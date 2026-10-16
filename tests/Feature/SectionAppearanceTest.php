<?php

namespace Tests\Feature;

use App\Actions\PublishSite;
use App\Models\Section;
use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SectionAppearanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_save_and_reset_section_layout_and_image_designs(): void
    {
        $owner = User::factory()->create();
        [$site, $section] = $this->sectionFor($owner);
        $appearance = [
            'background_color' => '#fff1f2',
            'border_color' => '#be123c',
            'border_width' => 3,
            'radius' => 24,
            'spacing' => 'comfortable',
            'alignment' => 'left',
            'decoration' => 'arch',
            'decoration_color' => '#fb7185',
        ];
        $imageStyle = [
            'shape' => 'arch',
            'aspect_ratio' => 'portrait',
            'fit' => 'contain',
            'position' => 'top',
            'border_color' => '#be123c',
            'border_width' => 2,
            'shadow' => 'soft',
            'opacity' => 90,
        ];

        $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), [
            'content' => [
                'appearance' => $appearance,
                'image_style' => $imageStyle,
                'items' => [['title' => 'Our team', 'image_style' => $imageStyle]],
            ],
        ])->assertSessionHasNoErrors()->assertSessionHas('success');

        $saved = $section->fresh()->content;
        $this->assertSame($appearance, $saved['appearance']);
        $this->assertSame($imageStyle, $saved['image_style']);
        $this->assertSame($imageStyle, $saved['items'][0]['image_style']);
        $this->assertSame('Original heading', $saved['heading']);

        $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), [
            'content' => [
                'appearance' => null,
                'image_style' => null,
                'items' => [['title' => 'Our team', 'image_style' => null]],
            ],
        ])->assertSessionHasNoErrors();

        $reset = $section->fresh()->content;
        $this->assertNull($reset['appearance']);
        $this->assertNull($reset['image_style']);
        $this->assertNull($reset['items'][0]['image_style']);
    }

    public function test_arbitrary_css_and_unbounded_image_or_layout_values_are_rejected_without_saving(): void
    {
        $owner = User::factory()->create();
        [$site, $section] = $this->sectionFor($owner);
        $original = $section->content;

        $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), [
            'content' => [
                'heading' => 'Invalid update',
                'appearance' => [
                    'background_color' => 'url(javascript:alert(1))',
                    'border_color' => '#fff',
                    'border_width' => 9,
                    'radius' => -1,
                    'spacing' => '100vh',
                    'alignment' => 'justify',
                    'decoration' => '<script>',
                    'decoration_color' => 'red',
                    'position' => 'fixed',
                ],
                'image_style' => [
                    'shape' => 'polygon(0 0)',
                    'aspect_ratio' => '999 / 1',
                    'fit' => 'fill',
                    'position' => 'calc(1px)',
                    'border_color' => 'transparent',
                    'border_width' => 100,
                    'shadow' => 'url(https://example.com)',
                    'opacity' => 0,
                    'transform' => 'rotate(90deg)',
                ],
                'items' => [['title' => 'Item', 'image_style' => ['shape' => 'script', 'opacity' => 101]]],
            ],
        ])->assertSessionHasErrors([
            'content.appearance', 'content.appearance.background_color',
            'content.appearance.border_color', 'content.appearance.border_width',
            'content.appearance.radius', 'content.appearance.spacing',
            'content.appearance.alignment', 'content.appearance.decoration',
            'content.appearance.decoration_color', 'content.image_style',
            'content.image_style.shape', 'content.image_style.aspect_ratio',
            'content.image_style.fit', 'content.image_style.position',
            'content.image_style.border_color', 'content.image_style.border_width',
            'content.image_style.shadow', 'content.image_style.opacity',
            'content.items.0.image_style.shape', 'content.items.0.image_style.opacity',
        ]);

        $this->assertSame($original, $section->fresh()->content);
    }

    public function test_cover_photo_design_is_saved_with_the_hero_image_reference(): void
    {
        $owner = User::factory()->create();
        [$site, $section] = $this->sectionFor($owner);
        $section->update(['type' => 'hero']);
        $imageStyle = ['fit' => 'cover', 'position' => 'left', 'opacity' => 60];

        $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), [
            'content' => [
                'background_image' => 'https://example.com/cover.jpg',
                'image_style' => $imageStyle,
                'appearance' => ['alignment' => 'right', 'decoration' => 'circle'],
            ],
        ])->assertSessionHasNoErrors();

        $this->assertSame('https://example.com/cover.jpg', $section->fresh()->content['background_image']);
        $this->assertSame($imageStyle, $section->fresh()->content['image_style']);
    }

    public function test_draft_design_changes_only_reach_the_public_page_after_publishing(): void
    {
        $owner = User::factory()->create();
        [$site, $section] = $this->sectionFor($owner);
        $published = ['background_color' => '#ffffff', 'alignment' => 'center'];
        $section->update(['content' => [...$section->content, 'appearance' => $published]]);
        app(PublishSite::class)->handle($site, $owner->id);
        $draft = ['background_color' => '#0f172a', 'decoration' => 'diagonal'];
        $imageStyle = ['shape' => 'circle', 'position' => 'top'];

        $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), [
            'content' => ['appearance' => $draft, 'image_style' => $imageStyle],
        ])->assertSessionHasNoErrors();

        $this->get(route('public.site', ['siteSlug' => $site->slug]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Public/Site')
                ->where('page.sections.0.content.appearance', $published));

        $this->get(route('sites.preview', $site))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Public/Site')
                ->where('page.sections.0.content.appearance', $draft)
                ->where('page.sections.0.content.image_style', $imageStyle));

        app(PublishSite::class)->handle($site->fresh(), $owner->id);

        $this->get(route('public.site', ['siteSlug' => $site->slug]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Public/Site')
                ->where('page.sections.0.content.appearance', $draft)
                ->where('page.sections.0.content.image_style', $imageStyle));
    }

    public function test_image_and_section_design_edits_cannot_cross_site_membership_boundaries(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        [$site, $section] = $this->sectionFor($owner);
        [, $otherSection] = $this->sectionFor($stranger);
        $original = $section->content;
        $changes = ['content' => ['appearance' => ['background_color' => '#ff0000'], 'image_style' => ['shape' => 'circle']]];

        $this->actingAs($stranger)->patch(route('sections.update', [$site, $section]), $changes)->assertForbidden();
        $this->actingAs($owner)->patch(route('sections.update', [$site, $otherSection]), $changes)->assertNotFound();

        $this->assertSame($original, $section->fresh()->content);
    }

    /** @return array{Site, Section} */
    private function sectionFor(User $owner): array
    {
        $site = Site::create([
            'name' => 'Design Studio',
            'slug' => 'design-studio-'.Str::lower(Str::random(6)),
            'type' => 'business',
        ]);
        $site->users()->attach($owner, ['role' => 'owner']);
        $site->theme()->create(['settings' => []]);
        $page = $site->pages()->create(['title' => 'Home', 'slug' => 'home', 'sort_order' => 0]);
        $section = $page->sections()->create([
            'site_id' => $site->id,
            'key' => (string) Str::uuid(),
            'type' => 'services',
            'content' => ['heading' => 'Original heading', 'items' => [['title' => 'Our team']]],
            'sort_order' => 0,
            'is_visible' => true,
        ]);

        return [$site, $section];
    }
}
