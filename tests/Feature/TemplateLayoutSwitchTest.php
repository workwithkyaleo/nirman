<?php

namespace Tests\Feature;

use App\Models\Page;
use App\Models\Section;
use App\Models\Site;
use App\Models\Template;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class TemplateLayoutSwitchTest extends TestCase
{
    use RefreshDatabase;

    public function test_design_mode_is_the_default_and_changes_no_page_layout(): void
    {
        $owner = User::factory()->create();
        $originalTemplate = $this->template('original-design', ['hero', 'gallery'], '#115e59');
        $selectedTemplate = $this->template('selected-design', ['hero', 'services', 'faq'], '#1d4ed8');
        $site = $this->siteFor($owner, $originalTemplate);
        $home = $this->pageFor($site, 'Home', 'home');
        $gallery = $this->sectionFor($home, 'gallery', ['heading' => 'Original gallery'], 0);
        $hero = $this->sectionFor($home, 'hero', ['heading' => 'Original hero'], 1);
        $originalIds = [$gallery->id, $hero->id];

        $this->actingAs($owner)
            ->from(route('sites.edit', $site))
            ->post(route('templates.apply', $site), [
                'template_id' => $selectedTemplate->id,
                'mode' => 'unsupported',
            ])
            ->assertRedirect(route('sites.edit', $site))
            ->assertSessionHasErrors('mode');

        $this->assertSame($originalTemplate->id, $site->fresh()->template_id);
        $this->assertSame($originalIds, $home->sections()->pluck('id')->all());

        $this->actingAs($owner)
            ->post(route('templates.apply', $site), ['template_id' => $selectedTemplate->id])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertSame($selectedTemplate->id, $site->fresh()->template_id);
        $this->assertSame($selectedTemplate->theme_defaults, $site->theme()->firstOrFail()->settings);
        $this->assertSame($originalIds, $home->sections()->pluck('id')->all());
        $this->assertSame(['gallery', 'hero'], $home->sections()->pluck('type')->all());
        $this->assertSame(['heading' => 'Original gallery'], $gallery->fresh()->content);
        $this->assertSame(['heading' => 'Original hero'], $hero->fresh()->content);
    }

    public function test_design_switch_replaces_the_complete_palette_and_discards_stale_theme_keys(): void
    {
        $owner = User::factory()->create();
        $originalTemplate = $this->template('stale-palette', ['hero'], '#0f766e');
        $selectedTemplate = $this->template('fresh-palette', ['hero'], '#9f1239');
        $selectedTheme = [
            ...$selectedTemplate->theme_defaults,
            'secondary' => '#4c0519',
            'accent' => '#fbbf24',
            'background' => '#fff7ed',
            'text' => '#292524',
        ];
        $selectedTemplate->update(['theme_defaults' => $selectedTheme]);

        $site = $this->siteFor($owner, $originalTemplate, 'Palette Studio');
        $site->theme()->firstOrFail()->update(['settings' => [
            ...$originalTemplate->theme_defaults,
            'background' => '#020617',
            'text' => '#f8fafc',
            'legacy_text_color' => '#ff00ff',
            'legacy_surface_color' => '#00ffff',
        ]]);

        $this->actingAs($owner)
            ->post(route('templates.apply', $site), [
                'template_id' => $selectedTemplate->id,
                'mode' => 'design',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $settings = $site->theme()->firstOrFail()->settings;

        $this->assertSame($selectedTheme, $settings);
        $this->assertSame('#fff7ed', $settings['background']);
        $this->assertSame('#292524', $settings['text']);
        $this->assertArrayNotHasKey('legacy_text_color', $settings);
        $this->assertArrayNotHasKey('legacy_surface_color', $settings);
    }

    public function test_theme_updates_keep_the_selected_template_as_the_composition_source(): void
    {
        $owner = User::factory()->create();
        $selectedTemplate = $this->template('selected-composition', ['hero'], '#0f766e');
        $otherTemplate = $this->template('browser-supplied-composition', ['hero'], '#7c3aed');
        $site = $this->siteFor($owner, $selectedTemplate, 'Canonical Theme Studio');
        $settings = [
            ...$selectedTemplate->theme_defaults,
            'primary' => '#fef08a',
            'text' => '#111827',
            'template_slug' => $otherTemplate->slug,
        ];

        $this->actingAs($owner)
            ->patch(route('themes.update', $site), $settings)
            ->assertRedirect()
            ->assertSessionHas('success');

        $saved = $site->theme()->firstOrFail()->settings;
        $this->assertSame($selectedTemplate->slug, $saved['template_slug']);
        $this->assertSame('#fef08a', $saved['primary']);
        $this->assertSame('#111827', $saved['text']);

        unset($settings['template_slug']);
        $this->actingAs($owner)
            ->patch(route('themes.update', $site), $settings)
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertSame(
            $selectedTemplate->slug,
            $site->theme()->firstOrFail()->settings['template_slug'],
        );
    }

    public function test_layout_mode_reorganizes_only_home_preserves_content_and_keeps_published_snapshots(): void
    {
        $owner = User::factory()->create();
        $originalTemplate = $this->template('published-layout', ['faq', 'hero', 'text', 'gallery'], '#115e59');
        $selectedTemplate = $this->template('new-layout', ['hero', 'services', 'faq'], '#7c3aed');
        $site = $this->siteFor($owner, $originalTemplate, 'Layout Studio');
        $home = $this->pageFor($site, 'Home', 'home', 0);
        $faqContent = [
            'heading' => 'Questions from our customers',
            'items' => [['title' => 'Do you deliver?', 'body' => 'Yes, throughout the valley.']],
        ];
        $faq = $this->sectionFor($home, 'faq', $faqContent, 0, false);
        $hero = $this->sectionFor($home, 'hero', [
            'heading' => 'A customer-written hero',
            'body' => 'This copy must survive the layout switch.',
        ], 1);
        $text = $this->sectionFor($home, 'text', ['heading' => 'Our story', 'body' => 'Keep this unmatched section.'], 2);
        $gallery = $this->sectionFor($home, 'gallery', ['heading' => 'Our work', 'items' => []], 3);

        $about = $this->pageFor($site, 'About', 'about', 1);
        $aboutCta = $this->sectionFor($about, 'cta', ['heading' => 'About call to action', 'action' => 'Call us'], 0);
        $aboutServices = $this->sectionFor($about, 'services', [
            'heading' => 'About-page services',
            'items' => [['title' => 'Consulting', 'body' => 'Practical support.']],
        ], 1);
        $aboutBefore = $about->sections()->get()->map->only(['id', 'type', 'content', 'sort_order', 'is_visible'])->all();

        $this->actingAs($owner)
            ->post(route('sites.publish', $site))
            ->assertRedirect()
            ->assertSessionHas('success');

        $home->refresh();
        $publishedVersion = $home->versions()
            ->where('version', $home->published_version)
            ->firstOrFail();
        $publishedSnapshot = $publishedVersion->snapshot;
        $publishedDesign = $site->fresh()->published_design;

        $this->actingAs($owner)
            ->post(route('templates.apply', $site), [
                'template_id' => $selectedTemplate->id,
                'mode' => 'layout',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $ordered = $home->sections()->get();
        $this->assertSame(['hero', 'services', 'faq', 'text', 'gallery'], $ordered->pluck('type')->all());
        $this->assertSame(
            [$hero->id, $faq->id, $text->id, $gallery->id],
            [$ordered[0]->id, $ordered[2]->id, $ordered[3]->id, $ordered[4]->id],
        );
        $this->assertSame(range(0, 4), $ordered->pluck('sort_order')->all());

        $newServices = $ordered->get(1);
        $this->assertNotContains($newServices->id, [$faq->id, $hero->id, $text->id, $gallery->id]);
        $this->assertSame($site->id, $newServices->site_id);
        $this->assertSame($home->id, $newServices->page_id);
        $this->assertTrue($newServices->is_visible);
        $this->assertNotEmpty($newServices->key);
        $this->assertIsString($newServices->content['heading']);
        $this->assertNotEmpty($newServices->content['items']);
        $this->assertSame(['title', 'body'], array_keys($newServices->content['items'][0]));

        $this->assertSame('A customer-written hero', $hero->fresh()->content['heading']);
        $this->assertSame('This copy must survive the layout switch.', $hero->fresh()->content['body']);
        $this->assertSame($faqContent, $faq->fresh()->content);
        $this->assertFalse($faq->fresh()->is_visible);
        $this->assertSame(['heading' => 'Our story', 'body' => 'Keep this unmatched section.'], $text->fresh()->content);
        $this->assertSame(['heading' => 'Our work', 'items' => []], $gallery->fresh()->content);
        $this->assertDatabaseCount('sections', 7);

        $this->assertSame($aboutBefore, $about->sections()->get()->map->only(['id', 'type', 'content', 'sort_order', 'is_visible'])->all());
        $this->assertSame('About call to action', $aboutCta->fresh()->content['heading']);
        $this->assertSame('About-page services', $aboutServices->fresh()->content['heading']);

        $site->refresh();
        $this->assertSame($selectedTemplate->id, $site->template_id);
        $this->assertSame($selectedTemplate->theme_defaults, $site->theme()->firstOrFail()->settings);
        $this->assertSame($publishedDesign, $site->published_design);
        $this->assertSame($publishedSnapshot, $publishedVersion->fresh()->snapshot);
        $this->assertSame(
            ['hero', 'text', 'gallery'],
            collect($publishedVersion->fresh()->snapshot['sections'])->pluck('type')->all(),
        );
    }

    public function test_guest_and_stranger_cannot_apply_a_layout(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $originalTemplate = $this->template('private-original', ['hero'], '#115e59');
        $selectedTemplate = $this->template('private-selected', ['services', 'hero'], '#b42318');
        $site = $this->siteFor($owner, $originalTemplate, 'Private Studio');
        $home = $this->pageFor($site, 'Home', 'home');
        $hero = $this->sectionFor($home, 'hero', ['heading' => 'Private content'], 0);
        $payload = ['template_id' => $selectedTemplate->id, 'mode' => 'layout'];

        $this->post(route('templates.apply', $site), $payload)
            ->assertRedirect(route('login'));

        $this->actingAs($stranger)
            ->post(route('templates.apply', $site), $payload)
            ->assertForbidden();

        $this->assertSame($originalTemplate->id, $site->fresh()->template_id);
        $this->assertSame($originalTemplate->theme_defaults, $site->theme()->firstOrFail()->settings);
        $this->assertSame([$hero->id], $home->sections()->pluck('id')->all());
        $this->assertSame(['heading' => 'Private content'], $hero->fresh()->content);
    }

    public function test_failed_layout_switch_rolls_back_design_changes(): void
    {
        $owner = User::factory()->create();
        $originalTemplate = $this->template('rollback-original', ['text'], '#115e59');
        $selectedTemplate = $this->template('rollback-selected', ['hero', 'services'], '#c2410c');
        $site = $this->siteFor($owner, $originalTemplate, 'No Home Studio');
        $about = $this->pageFor($site, 'About', 'about');
        $section = $this->sectionFor($about, 'text', ['heading' => 'Only page'], 0);

        $this->actingAs($owner)
            ->post(route('templates.apply', $site), [
                'template_id' => $selectedTemplate->id,
                'mode' => 'layout',
            ])
            ->assertUnprocessable();

        $this->assertSame($originalTemplate->id, $site->fresh()->template_id);
        $this->assertSame($originalTemplate->theme_defaults, $site->theme()->firstOrFail()->settings);
        $this->assertSame(['heading' => 'Only page'], $section->fresh()->content);
        $this->assertDatabaseCount('sections', 1);
    }

    /** @param list<string> $homeSections */
    private function template(string $slug, array $homeSections, string $primary): Template
    {
        return Template::create([
            'name' => Str::headline($slug),
            'slug' => $slug,
            'category' => 'Test',
            'blueprint' => [
                'description' => 'A focused test template.',
                'home_sections' => $homeSections,
            ],
            'theme_defaults' => [
                'style' => 'modern',
                'template_slug' => $slug,
                'primary' => $primary,
                'secondary' => '#1f2937',
                'accent' => '#f59e0b',
                'background' => '#ffffff',
                'text' => '#111827',
                'heading_font' => 'Manrope',
                'body_font' => 'Inter',
                'radius' => '16px',
                'button_style' => 'solid',
                'section_spacing' => 'comfortable',
                'header_layout' => 'split',
                'footer_layout' => 'columns',
            ],
            'is_active' => true,
        ]);
    }

    private function siteFor(User $owner, Template $template, string $name = 'Template Studio'): Site
    {
        $site = Site::create([
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(6)),
            'type' => 'business',
            'description' => 'A business description used for safe section defaults.',
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

    /** @param array<string, mixed> $content */
    private function sectionFor(
        Page $page,
        string $type,
        array $content,
        int $sortOrder,
        bool $isVisible = true,
    ): Section {
        return $page->sections()->create([
            'site_id' => $page->site_id,
            'key' => (string) Str::uuid(),
            'type' => $type,
            'content' => $content,
            'sort_order' => $sortOrder,
            'is_visible' => $isVisible,
        ]);
    }
}
