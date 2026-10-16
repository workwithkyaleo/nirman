<?php

namespace Tests\Feature;

use App\Models\Site;
use App\Models\Template;
use App\Models\User;
use App\Support\TemplateLayout;
use App\Support\ThemeContrast;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class NewTemplateThemesTest extends TestCase
{
    use RefreshDatabase;

    private const SLUGS = [
        'patra-editorial',
        'drishti-photography',
        'prakriti-wellness',
        'chiya-cafe',
        'orbit-digital',
        'doko-essentials',
    ];

    public function test_expanded_catalog_installs_six_accessible_distinct_compositions(): void
    {
        $templates = Template::query()->whereIn('slug', self::SLUGS)->get();
        $this->assertCount(6, $templates);
        $allCompositions = Template::query()->where('is_active', true)->get()
            ->map(fn (Template $template) => json_encode($template->blueprint['home_sections'], JSON_THROW_ON_ERROR));
        $this->assertSame($allCompositions->count(), $allCompositions->unique()->count());

        $site = new Site(['name' => 'Sample business', 'type' => 'business']);
        $layouts = app(TemplateLayout::class);

        foreach ($templates as $template) {
            $this->assertTrue($template->is_active);
            $this->assertSame($template->slug, $template->blueprint['visual_style']);
            $this->assertSame($template->slug, $template->theme_defaults['template_slug']);
            $this->assertGreaterThanOrEqual(4.5, ThemeContrast::ratio(
                $template->theme_defaults['background'],
                $template->theme_defaults['text'],
            ), "{$template->name} body text must remain readable.");
            $this->assertSame($template->blueprint['home_sections'], $layouts->homeSectionTypes($template));

            foreach ($layouts->homeSectionTypes($template) as $type) {
                $content = $layouts->defaultContent($type, $site);
                $this->assertNotEmpty($content['heading']);
                $this->assertArrayNotHasKey('html', $content);
            }
        }

        $this->assertSame('#151617', $templates->firstWhere('slug', 'drishti-photography')->theme_defaults['background']);
        $this->assertSame('#111426', $templates->firstWhere('slug', 'orbit-digital')->theme_defaults['background']);
    }

    /** @return array<string, array{string, string}> */
    public static function templateModes(): array
    {
        $cases = [];
        foreach (self::SLUGS as $slug) {
            foreach (['design', 'layout'] as $mode) {
                $cases["{$slug} {$mode}"] = [$slug, $mode];
            }
        }

        return $cases;
    }

    #[DataProvider('templateModes')]
    public function test_new_templates_can_be_applied_without_changing_the_published_site(string $slug, string $mode): void
    {
        $owner = User::factory()->create();
        $originalTemplate = Template::query()->where('slug', 'sajilo-launch')->firstOrFail();
        $selectedTemplate = Template::query()->where('slug', $slug)->firstOrFail();
        $site = $this->siteFor($owner, $originalTemplate);
        $home = $site->pages()->create(['title' => 'Home', 'slug' => 'home', 'sort_order' => 0]);
        $hero = $home->sections()->create([
            'site_id' => $site->id,
            'key' => (string) Str::uuid(),
            'type' => 'hero',
            'content' => ['heading' => 'Our carefully written headline', 'body' => 'Keep our original introduction.'],
            'sort_order' => 0,
            'is_visible' => true,
        ]);

        $this->actingAs($owner)->post(route('sites.publish', $site))
            ->assertRedirect()->assertSessionHas('success');
        $publishedDesign = $site->fresh()->published_design;
        $version = $home->versions()->firstOrFail();
        $publishedSnapshot = $version->snapshot;

        $this->actingAs($owner)->post(route('templates.apply', $site), [
            'template_id' => $selectedTemplate->id,
            'mode' => $mode,
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertSame($selectedTemplate->id, $site->fresh()->template_id);
        $this->assertSame($selectedTemplate->theme_defaults, $site->theme()->firstOrFail()->settings);
        $this->assertSame('Our carefully written headline', $hero->fresh()->content['heading']);
        $this->assertSame(
            $mode === 'layout' ? $selectedTemplate->blueprint['home_sections'] : ['hero'],
            $home->sections()->pluck('type')->all(),
        );
        foreach ($home->sections as $section) {
            $this->assertSame($site->id, $section->site_id);
            $this->assertSame($home->id, $section->page_id);
        }

        // All defaults are accepted by the same validation used for later edits.
        $this->actingAs($owner)->patch(route('themes.update', $site), $selectedTemplate->theme_defaults)
            ->assertRedirect()->assertSessionHas('success')->assertSessionHasNoErrors();
        $this->assertSame($publishedDesign, $site->fresh()->published_design);
        $this->assertSame($publishedSnapshot, $version->fresh()->snapshot);

        $this->get(route('public.site', ['siteSlug' => $site->slug]))
            ->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Public/Site')
            ->where('template', $originalTemplate->slug)
            ->where('theme.background', $originalTemplate->theme_defaults['background'])
            ->has('page.sections', 1)
            ->where('page.sections.0.content.heading', 'Our carefully written headline'));

        $this->actingAs($owner)->get(route('sites.preview', $site))
            ->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Public/Site')
            ->where('isPreview', true)
            ->where('template', $selectedTemplate->slug)
            ->where('theme.background', $selectedTemplate->theme_defaults['background'])
            ->has('page.sections', $mode === 'layout' ? count($selectedTemplate->blueprint['home_sections']) : 1));
    }

    public function test_new_template_choices_cannot_bypass_site_membership(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $originalTemplate = Template::query()->where('slug', 'sajilo-launch')->firstOrFail();
        $site = $this->siteFor($owner, $originalTemplate);

        foreach (Template::query()->whereIn('slug', self::SLUGS)->get() as $template) {
            $this->actingAs($stranger)->post(route('templates.apply', $site), [
                'template_id' => $template->id,
                'mode' => 'design',
            ])->assertForbidden();
        }

        $this->assertSame($originalTemplate->id, $site->fresh()->template_id);
        $this->assertSame($originalTemplate->theme_defaults, $site->theme()->firstOrFail()->settings);
    }

    public function test_catalog_upgrade_preserves_customized_templates_and_existing_site_state(): void
    {
        $owner = User::factory()->create();
        $customized = Template::query()->where('slug', 'patra-editorial')->firstOrFail();
        $customized->update(['name' => 'Custom journal', 'theme_defaults' => [
            ...$customized->theme_defaults,
            'primary' => '#993333',
        ]]);
        $site = $this->siteFor($owner, $customized);
        $site->update(['published_design' => ['template_slug' => $customized->slug, 'theme' => $customized->theme_defaults]]);
        $settings = $site->theme()->firstOrFail()->settings;
        $publishedDesign = $site->published_design;
        Template::query()->whereIn('slug', array_slice(self::SLUGS, 1))->delete();

        $migration = require database_path('migrations/2026_10_06_000100_add_expanded_website_themes.php');
        $migration->up();
        $migration->up();

        $this->assertSame(6, Template::query()->whereIn('slug', self::SLUGS)->where('is_active', true)->count());
        $this->assertSame('Custom journal', $customized->fresh()->name);
        $this->assertSame('#993333', $customized->fresh()->theme_defaults['primary']);
        $this->assertSame($settings, $site->theme()->firstOrFail()->settings);
        $this->assertSame($publishedDesign, $site->fresh()->published_design);

        $migration->down();
        $this->assertSame(6, Template::query()->whereIn('slug', self::SLUGS)->count());
        $this->assertSame(0, Template::query()->whereIn('slug', self::SLUGS)->where('is_active', true)->count());
        $this->assertSame($customized->id, $site->fresh()->template_id);
        $this->assertSame($publishedDesign, $site->fresh()->published_design);

        $migration->up();
        $this->assertSame(6, Template::query()->whereIn('slug', self::SLUGS)->where('is_active', true)->count());
        $this->assertSame('#993333', $customized->fresh()->theme_defaults['primary']);
    }

    private function siteFor(User $owner, Template $template): Site
    {
        $site = Site::create([
            'name' => 'Template preview business',
            'slug' => 'template-preview-'.Str::lower(Str::random(8)),
            'type' => 'business',
            'template_id' => $template->id,
        ]);
        $site->users()->attach($owner, ['role' => 'owner']);
        $site->theme()->create(['settings' => $template->theme_defaults]);

        return $site;
    }
}
