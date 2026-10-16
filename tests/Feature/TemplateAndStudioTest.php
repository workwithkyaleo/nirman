<?php

namespace Tests\Feature;

use App\Models\Page;
use App\Models\Site;
use App\Models\Template;
use App\Models\User;
use App\Support\ThemeContrast;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TemplateAndStudioTest extends TestCase
{
    use RefreshDatabase;

    public function test_migrations_install_at_least_ten_active_distinct_templates(): void
    {
        $templates = Template::query()
            ->where('is_active', true)
            ->get();
        $activeSlugs = $templates->pluck('slug');
        $compositionSignatures = $templates->map(
            fn (Template $template) => json_encode(data_get($template->blueprint, 'home_sections', []), JSON_THROW_ON_ERROR),
        );
        $visualStyles = $templates->pluck('blueprint')->map(fn (array $blueprint) => data_get($blueprint, 'visual_style'));

        $this->assertGreaterThanOrEqual(10, $activeSlugs->count());
        $this->assertSame($activeSlugs->count(), $activeSlugs->unique()->count());
        $this->assertSame($templates->count(), $compositionSignatures->unique()->count());
        $this->assertSame($templates->count(), $visualStyles->filter()->unique()->count());
        $this->assertFalse($activeSlugs->contains(fn ($slug) => blank($slug)));

        foreach ($templates as $template) {
            $this->assertGreaterThanOrEqual(
                4.5,
                ThemeContrast::ratio(
                    $template->theme_defaults['background'],
                    $template->theme_defaults['text'],
                ),
                "{$template->name} must ship with accessible body text contrast.",
            );

            foreach ([
                'content_width',
                'hero_alignment',
                'card_style',
                'heading_scale',
                'hero_height',
                'header_style',
                'motion',
                'image_shape',
                'divider_style',
            ] as $setting) {
                $this->assertArrayHasKey($setting, $template->theme_defaults);
            }
        }
    }

    public function test_owner_can_save_advanced_theme_controls_but_not_an_inaccessible_palette(): void
    {
        $owner = User::factory()->create();
        $template = Template::query()->where('is_active', true)->firstOrFail();
        $site = $this->siteFor($owner, $template, 'Accessible Theme Studio');
        $original = $site->theme->settings;
        $customized = [
            ...$original,
            'content_width' => 'wide',
            'hero_alignment' => 'left',
            'card_style' => 'flat',
            'heading_scale' => 'display',
            'hero_height' => 'screen',
            'header_style' => 'glass',
            'motion' => 'none',
            'image_shape' => 'rounded',
            'divider_style' => 'strong',
        ];

        $this->actingAs($owner)
            ->patch(route('themes.update', $site), $customized)
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertEquals($customized, $site->theme()->firstOrFail()->settings);

        $inaccessible = [
            ...$customized,
            'background' => '#777777',
            'text' => '#888888',
        ];

        $this->actingAs($owner)
            ->from(route('sites.edit', $site))
            ->patch(route('themes.update', $site), $inaccessible)
            ->assertRedirect(route('sites.edit', $site))
            ->assertSessionHasErrors('text');

        $this->assertEquals($customized, $site->theme()->firstOrFail()->settings);
    }

    public function test_site_creation_requires_an_active_template_and_persists_its_design(): void
    {
        $user = User::factory()->create();
        $activeTemplate = Template::query()->where('is_active', true)->firstOrFail();
        $inactiveTemplate = Template::create([
            'name' => 'Retired Design',
            'slug' => 'retired-design',
            'category' => 'Archived',
            'blueprint' => ['home_sections' => ['hero', 'cta']],
            'theme_defaults' => $activeTemplate->theme_defaults,
            'is_active' => false,
        ]);

        $missingTemplate = $this->validSitePayload($activeTemplate->id, 'Missing Template Co');
        unset($missingTemplate['template_id']);

        $this->actingAs($user)
            ->from(route('sites.create'))
            ->post(route('sites.store'), $missingTemplate)
            ->assertRedirect(route('sites.create'))
            ->assertSessionHasErrors('template_id');

        $this->actingAs($user)
            ->from(route('sites.create'))
            ->post(route('sites.store'), $this->validSitePayload($inactiveTemplate->id, 'Inactive Template Co'))
            ->assertRedirect(route('sites.create'))
            ->assertSessionHasErrors('template_id');

        $this->assertDatabaseCount('sites', 0);

        $response = $this->actingAs($user)->post(
            route('sites.store'),
            $this->validSitePayload($activeTemplate->id, 'Template Ready Co'),
        );

        $site = Site::query()->where('name', 'Template Ready Co')->firstOrFail();
        $response->assertRedirect(route('sites.edit', $site));
        $this->assertSame($activeTemplate->id, $site->template_id);
        $this->assertTrue($site->template->is($activeTemplate));
        $this->assertEquals([
            ...$activeTemplate->theme_defaults,
            'primary' => '#14532d',
            'secondary' => '#1e3a8a',
            'accent' => '#f59e0b',
        ], $site->theme->settings);
    }

    public function test_owner_can_apply_a_template_without_replacing_content_and_stranger_is_forbidden(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        [$originalTemplate, $ownerTemplate, $forbiddenTemplate] = Template::query()
            ->where('is_active', true)
            ->take(3)
            ->get()
            ->all();
        $site = $this->siteFor($owner, $originalTemplate);
        $page = $this->pageFor($site, 'Home', 'home');
        $originalContent = ['heading' => 'Keep this exact headline', 'body' => 'Owner-authored draft copy.'];
        $section = $page->sections()->create([
            'site_id' => $site->id,
            'key' => (string) Str::uuid(),
            'type' => 'hero',
            'content' => $originalContent,
            'sort_order' => 0,
        ]);

        $this->actingAs($owner)
            ->post(route('templates.apply', $site), ['template_id' => $ownerTemplate->id])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertSame($ownerTemplate->id, $site->fresh()->template_id);
        $this->assertSame($ownerTemplate->theme_defaults, $site->theme()->firstOrFail()->settings);
        $this->assertSame($originalContent, $section->fresh()->content);

        $this->actingAs($stranger)
            ->post(route('templates.apply', $site), ['template_id' => $forbiddenTemplate->id])
            ->assertForbidden();

        $this->assertSame($ownerTemplate->id, $site->fresh()->template_id);
        $this->assertSame($ownerTemplate->theme_defaults, $site->theme()->firstOrFail()->settings);
        $this->assertSame($originalContent, $section->fresh()->content);
    }

    public function test_page_settings_are_tenant_bound_and_home_page_cannot_be_deleted(): void
    {
        $owner = User::factory()->create();
        $otherOwner = User::factory()->create();
        $template = Template::query()->where('is_active', true)->firstOrFail();
        $site = $this->siteFor($owner, $template, 'Owner Studio');
        $home = $this->pageFor($site, 'Home', 'home', 0);
        $about = $this->pageFor($site, 'About', 'about', 1);
        $otherSite = $this->siteFor($otherOwner, $template, 'Other Studio');
        $foreignPage = $this->pageFor($otherSite, 'Private Page', 'private', 0);

        $this->actingAs($owner)
            ->patch(route('pages.update', [$site, $about]), [
                'title' => 'Our Story',
                'seo_title' => 'Our Story | Owner Studio',
                'seo_description' => 'Learn about the people and purpose behind Owner Studio.',
                'show_in_navigation' => false,
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $about->refresh();
        $this->assertSame('Our Story', $about->title);
        $this->assertSame('Our Story | Owner Studio', $about->seo_title);
        $this->assertSame('Learn about the people and purpose behind Owner Studio.', $about->seo_description);
        $this->assertFalse($about->show_in_navigation);

        $this->actingAs($owner)
            ->patch(route('pages.update', [$site, $foreignPage]), [
                'title' => 'Cross-tenant overwrite',
                'seo_title' => 'Should not save',
                'seo_description' => 'This page belongs to a different website.',
                'show_in_navigation' => false,
            ])
            ->assertNotFound();

        $this->assertSame('Private Page', $foreignPage->fresh()->title);
        $this->assertTrue($foreignPage->fresh()->show_in_navigation);

        $this->actingAs($otherOwner)
            ->patch(route('pages.update', [$site, $about]), [
                'title' => 'Unauthorized overwrite',
                'seo_title' => null,
                'seo_description' => null,
                'show_in_navigation' => true,
            ])
            ->assertForbidden();

        $this->assertSame('Our Story', $about->fresh()->title);

        $this->actingAs($owner)
            ->delete(route('pages.destroy', [$site, $home]))
            ->assertUnprocessable();

        $this->assertNotSoftDeleted($home);
    }

    public function test_section_reordering_requires_each_section_id_exactly_once(): void
    {
        $owner = User::factory()->create();
        $template = Template::query()->where('is_active', true)->firstOrFail();
        $site = $this->siteFor($owner, $template);
        $page = $this->pageFor($site, 'Home', 'home');
        $sections = collect(['hero', 'features', 'cta'])->map(function (string $type, int $order) use ($page, $site) {
            return $page->sections()->create([
                'site_id' => $site->id,
                'key' => (string) Str::uuid(),
                'type' => $type,
                'content' => ['heading' => Str::headline($type)],
                'sort_order' => $order,
            ]);
        });
        $originalIds = $sections->pluck('id')->all();

        $this->actingAs($owner)
            ->patchJson(route('sections.reorder', [$site, $page]), [
                'sections' => array_slice($originalIds, 0, 2),
            ])
            ->assertUnprocessable();

        $this->assertSame($originalIds, $page->sections()->pluck('id')->all());

        $this->actingAs($owner)
            ->patchJson(route('sections.reorder', [$site, $page]), [
                'sections' => [$originalIds[0], $originalIds[0], $originalIds[2]],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('sections.1');

        $this->assertSame($originalIds, $page->sections()->pluck('id')->all());

        $reversedIds = array_reverse($originalIds);
        $this->actingAs($owner)
            ->patch(route('sections.reorder', [$site, $page]), ['sections' => $reversedIds])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertSame($reversedIds, $page->sections()->pluck('id')->all());
    }

    public function test_publishing_snapshots_template_and_theme_for_public_inertia_props(): void
    {
        $owner = User::factory()->create();
        [$publishedTemplate, $draftTemplate] = Template::query()
            ->where('is_active', true)
            ->take(2)
            ->get()
            ->all();
        $site = $this->siteFor($owner, $publishedTemplate, 'Published Studio');
        $page = $this->pageFor($site, 'Home', 'home');
        $page->sections()->create([
            'site_id' => $site->id,
            'key' => (string) Str::uuid(),
            'type' => 'hero',
            'content' => ['heading' => 'Published headline'],
            'sort_order' => 0,
        ]);
        $publishedTheme = $publishedTemplate->theme_defaults;

        $this->actingAs($owner)
            ->post(route('sites.publish', $site))
            ->assertRedirect()
            ->assertSessionHas('success');

        $site->refresh();
        $this->assertSame($publishedTemplate->slug, data_get($site->published_design, 'template_slug'));
        $this->assertSame($publishedTheme, data_get($site->published_design, 'theme'));

        $this->actingAs($owner)
            ->post(route('templates.apply', $site), ['template_id' => $draftTemplate->id])
            ->assertRedirect()
            ->assertSessionHas('success');

        $draftTheme = [
            ...$draftTemplate->theme_defaults,
            'primary' => '#abcdef',
            'secondary' => '#123456',
            'accent' => '#fedcba',
        ];
        $this->actingAs($owner)
            ->patch(route('themes.update', $site), $draftTheme)
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertSame($draftTemplate->id, $site->fresh()->template_id);
        $this->assertSame($draftTheme, $site->theme()->firstOrFail()->settings);
        $this->assertNotSame($publishedTheme['primary'], $draftTheme['primary']);

        $this->get(route('public.site', ['siteSlug' => $site->slug]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Public/Site')
                ->where('template', $publishedTemplate->slug)
                ->where('theme.template_slug', $publishedTheme['template_slug'])
                ->where('theme.primary', $publishedTheme['primary'])
                ->where('theme.secondary', $publishedTheme['secondary'])
                ->where('theme.accent', $publishedTheme['accent'])
                ->where('page.sections.0.content.heading', 'Published headline'));
    }

    public function test_business_profile_changes_are_tenant_safe_and_stay_draft_until_publish(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $template = Template::query()->where('is_active', true)->firstOrFail();
        $site = $this->siteFor($owner, $template, 'Original Name');
        $site->update(['description' => 'Original description', 'phone' => '111']);
        $page = $this->pageFor($site, 'Home', 'home');
        $page->sections()->create(['site_id' => $site->id, 'key' => (string) Str::uuid(), 'type' => 'hero', 'content' => ['heading' => 'Home'], 'sort_order' => 0]);

        $this->actingAs($owner)->post(route('sites.publish', $site))->assertSessionHas('success');

        $payload = [
            'name' => 'Draft Name',
            'description' => 'Draft description',
            'phone' => '222',
            'email' => 'draft@example.test',
            'address' => 'Kathmandu, Nepal',
            'map_url' => null,
            'whatsapp' => null,
            'opening_hours' => 'Sun–Fri, 9–5',
            'facebook' => null,
            'instagram' => null,
            'tiktok' => null,
            'website' => null,
        ];

        $this->actingAs($stranger)->patch(route('sites.update', $site), $payload)->assertForbidden();
        $this->assertSame('Original Name', $site->fresh()->name);

        $this->actingAs($owner)->patch(route('sites.update', $site), $payload)->assertSessionHas('success');
        $this->assertSame('Draft Name', $site->fresh()->name);

        $this->get(route('public.site', ['siteSlug' => $site->slug]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('site.name', 'Original Name')
                ->where('site.phone', '111'));

        $this->actingAs($owner)->post(route('sites.publish', $site))->assertSessionHas('success');
        $this->get(route('public.site', ['siteSlug' => $site->slug]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('site.name', 'Draft Name')
                ->where('site.phone', '222'));
    }

    public function test_owner_can_replace_logo_but_a_stranger_cannot(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $template = Template::query()->where('is_active', true)->firstOrFail();
        $site = $this->siteFor($owner, $template);

        $this->actingAs($stranger)
            ->post(route('sites.logo', $site), ['logo' => UploadedFile::fake()->image('foreign.png')])
            ->assertForbidden();
        $this->assertNull($site->fresh()->logo_path);

        $this->actingAs($owner)
            ->post(route('sites.logo', $site), ['logo' => UploadedFile::fake()->image('brand.png', 400, 400)])
            ->assertSessionHas('success');

        $path = $site->fresh()->logo_path;
        $this->assertNotNull($path);
        Storage::disk('public')->assertExists($path);
    }

    /** @return array<string, mixed> */
    private function validSitePayload(int $templateId, string $name): array
    {
        return [
            'name' => $name,
            'type' => 'business',
            'template_id' => $templateId,
            'category' => 'Professional services',
            'description' => 'A careful local team helping customers build better businesses.',
            'target_customers' => 'Growing teams in Nepal',
            'address' => 'Lalitpur, Nepal',
            'phone' => '+977 9800000000',
            'email' => 'hello@example.test',
            'services' => 'Brand strategy, Website design',
            'unique_value' => 'Personal local service backed by practical experience.',
            'primary' => '#14532d',
            'secondary' => '#1e3a8a',
            'accent' => '#f59e0b',
            'style' => 'modern',
            'language' => 'en',
            'currency' => 'NPR',
            'ordering' => false,
        ];
    }

    private function siteFor(User $owner, Template $template, string $name = 'Test Studio'): Site
    {
        $site = Site::create([
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(6)),
            'type' => 'business',
            'template_id' => $template->id,
        ]);
        $site->users()->attach($owner, ['role' => 'owner']);
        $site->theme()->create(['settings' => $template->theme_defaults]);

        return $site;
    }

    private function pageFor(Site $site, string $title, string $slug, int $sortOrder = 0): Page
    {
        return $site->pages()->create([
            'title' => $title,
            'slug' => $slug,
            'sort_order' => $sortOrder,
        ]);
    }
}
