<?php

namespace Tests\Feature;

use App\Actions\PublishSite;
use App\Models\Section;
use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TextAnimationTest extends TestCase
{
    use RefreshDatabase;

    private const STYLE_FIELDS = ['eyebrow_style', 'heading_style', 'body_style', 'primary_action_style', 'secondary_action_style', 'action_style', 'items.0.title_style', 'items.0.description_style'];

    public function test_supported_animations_save_on_all_section_and_item_text_fields(): void
    {
        [$owner, $site, $section] = $this->studio();

        foreach (['none', 'fade', 'rise', 'slide', 'zoom', 'blur'] as $animation) {
            $style = ['bold' => true, 'size' => 32, 'animation' => $animation, 'animation_duration' => 700, 'animation_delay' => 250];
            $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), ['content' => $this->styledContent($style)])
                ->assertSessionHasNoErrors()->assertSessionHas('success');

            $this->assertStyles($section, $style);
        }
    }

    public function test_animation_timing_accepts_bounds_and_can_be_omitted(): void
    {
        [$owner, $site, $section] = $this->studio();

        foreach ([
            ['animation' => 'fade'],
            ['animation' => 'rise', 'animation_duration' => 200, 'animation_delay' => 0],
            ['animation' => 'blur', 'animation_duration' => 2000, 'animation_delay' => 2000],
        ] as $style) {
            $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), ['content' => $this->styledContent($style)])
                ->assertSessionHasNoErrors();

            $this->assertStyles($section, $style);
        }
    }

    public function test_animation_can_be_disabled_without_losing_typography_and_styles_can_be_reset(): void
    {
        [$owner, $site, $section] = $this->studio();
        $typography = ['italic' => true, 'weight' => 600, 'align' => 'center'];
        $section->update(['content' => [...$section->content, ...$this->styledContent([
            ...$typography, 'animation' => 'zoom', 'animation_duration' => 600, 'animation_delay' => 100,
        ])]]);

        $disabled = [...$typography, 'animation' => 'none'];
        $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), ['content' => $this->styledContent($disabled)])
            ->assertSessionHasNoErrors();
        $this->assertStyles($section, $disabled);

        $this->patch(route('sections.update', [$site, $section]), ['content' => $this->styledContent(null)])
            ->assertSessionHasNoErrors();
        $this->assertStyles($section, null);
    }

    public function test_invalid_animation_settings_and_arbitrary_css_are_rejected_without_partial_saves(): void
    {
        [$owner, $site, $section] = $this->studio();
        $original = $section->content;
        $invalid = [
            ['animation' => 'spin'],
            ['animation' => 'fade; color:red'],
            ['animation' => null],
            ['animation' => ['fade']],
            ['animation_duration' => 199],
            ['animation_duration' => 2001],
            ['animation_duration' => 500.5],
            ['animation_duration' => '0.5s'],
            ['animation_duration' => null],
            ['animation_delay' => -1],
            ['animation_delay' => 2001],
            ['animation_delay' => 100.5],
            ['animation_delay' => 'calc(1s)'],
            ['animation_delay' => null],
            ['animation' => 'fade', 'animation_iteration_count' => 'infinite'],
            ['animation' => 'rise', 'animation_name' => 'custom-animation'],
            ['animation' => 'blur', 'keyframes' => 'body { display:none }'],
        ];

        foreach ($invalid as $style) {
            $field = array_key_last($style);
            $knownField = in_array($field, ['animation', 'animation_duration', 'animation_delay'], true);
            $errors = array_map(fn (string $path): string => 'content.'.$path.($knownField ? '.'.$field : ''), self::STYLE_FIELDS);

            $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), ['content' => [
                'heading' => 'Must not save', ...$this->styledContent($style),
            ]])->assertSessionHasErrors($errors);

            $this->assertSame($original, $section->fresh()->content);
        }
    }

    public function test_animation_validation_uses_readable_field_labels(): void
    {
        [$owner, $site, $section] = $this->studio();

        $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), ['content' => [
            'heading_style' => ['animation_duration' => 199],
            'items' => [['title' => 'Design', 'description_style' => ['animation_delay' => -1]]],
        ]])->assertSessionHasErrors([
            'content.heading_style.animation_duration' => 'The heading animation duration field must be at least 200.',
            'content.items.0.description_style.animation_delay' => 'The item description animation delay field must be at least 0.',
        ]);
    }

    public function test_draft_animation_edits_do_not_change_the_public_snapshot_until_published(): void
    {
        [$owner, $site, $section] = $this->studio();
        $published = ['animation' => 'fade', 'animation_duration' => 600, 'animation_delay' => 0];
        $section->update(['content' => [...$section->content, ...$this->styledContent($published)]]);
        app(PublishSite::class)->handle($site->fresh(), $owner->id);

        $draft = ['animation' => 'slide', 'animation_duration' => 1000, 'animation_delay' => 300];
        $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), ['content' => $this->styledContent($draft)])
            ->assertSessionHasNoErrors();

        $this->get(route('sites.preview', $site))->assertInertia(function (Assert $page) use ($draft): void {
            $page->component('Public/Site');
            foreach (self::STYLE_FIELDS as $field) {
                $page->where('page.sections.0.content.'.$field, $draft);
            }
        });
        $this->get(route('public.site', ['siteSlug' => $site->slug]))->assertInertia(function (Assert $page) use ($published): void {
            $page->component('Public/Site');
            foreach (self::STYLE_FIELDS as $field) {
                $page->where('page.sections.0.content.'.$field, $published);
            }
        });

        app(PublishSite::class)->handle($site->fresh(), $owner->id);
        $this->get(route('public.site', ['siteSlug' => $site->slug]))->assertInertia(function (Assert $page) use ($draft): void {
            $page->component('Public/Site');
            foreach (self::STYLE_FIELDS as $field) {
                $page->where('page.sections.0.content.'.$field, $draft);
            }
        });
    }

    public function test_animation_edits_enforce_membership_roles_and_section_tenant_boundaries(): void
    {
        [$owner, $site, $section] = $this->studio();
        [$otherOwner, , $otherSection] = $this->studio();
        $staff = User::factory()->create();
        $site->users()->attach($staff, ['role' => 'staff']);
        $original = $section->content;
        $otherOriginal = $otherSection->content;
        $attributes = ['content' => $this->styledContent(['animation' => 'rise'])];

        $this->actingAs($otherOwner)->patch(route('sections.update', [$site, $section]), $attributes)->assertForbidden();
        $this->actingAs($staff)->patch(route('sections.update', [$site, $section]), $attributes)->assertForbidden();
        $this->actingAs($owner)->patch(route('sections.update', [$site, $otherSection]), $attributes)->assertNotFound();

        $this->assertSame($original, $section->fresh()->content);
        $this->assertSame($otherOriginal, $otherSection->fresh()->content);
    }

    public function test_ai_copy_refinement_preserves_each_text_fields_animation_and_typography(): void
    {
        [$owner, $site, $section] = $this->studio();
        $style = ['size' => 28, 'italic' => true, 'animation' => 'zoom', 'animation_duration' => 800, 'animation_delay' => 200];
        $section->update(['content' => [...$section->content, ...$this->styledContent($style)]]);

        $this->actingAs($owner)->post(route('ai.refinements.store', $site), [
            'prompt' => 'Rewrite this section in a friendly and welcoming voice.',
            'scope' => 'section', 'page_id' => $section->page_id, 'section_id' => $section->id,
        ])->assertSessionHas('success');
        $generation = $site->aiGenerations()->where('mode', 'refinement')->sole();
        $output = $generation->output;
        $output['operations'] = [['op' => 'update_section', 'section_id' => $section->id, 'content' => [
            'eyebrow' => 'Welcome', 'heading' => 'Refined heading', 'body' => 'Refined description.',
            'items' => [['title' => 'Refined item', 'body' => 'Refined item description.']],
        ]]];
        $generation->update(['output' => $output]);

        $this->post(route('ai.refinements.apply', [$site, $generation]))->assertSessionHas('success');

        $this->assertStyles($section, $style);
        $saved = $section->fresh()->content;
        $this->assertSame('Refined heading', $saved['heading']);
        $this->assertSame('Refined item', $saved['items'][0]['title']);
    }

    private function styledContent(?array $style): array
    {
        return [
            'eyebrow_style' => $style,
            'heading_style' => $style,
            'body_style' => $style,
            'primary_action_style' => $style,
            'secondary_action_style' => $style,
            'action_style' => $style,
            'items' => [['title' => 'Design', 'body' => 'Your next chapter.', 'title_style' => $style, 'description_style' => $style]],
        ];
    }

    private function assertStyles(Section $section, ?array $expected): void
    {
        $saved = $section->fresh()->content;
        foreach (self::STYLE_FIELDS as $field) {
            $this->assertTrue(Arr::has($saved, $field));
            $this->assertSame($expected, Arr::get($saved, $field));
        }
    }

    /** @return array{User, Site, Section} */
    private function studio(): array
    {
        $owner = User::factory()->create();
        $site = Site::create(['name' => 'Animation Studio', 'slug' => 'animation-'.Str::lower(Str::random(8)), 'type' => 'business']);
        $site->users()->attach($owner, ['role' => 'owner']);
        $site->theme()->create(['settings' => [
            'style' => 'modern', 'primary' => '#0f766e', 'secondary' => '#134e4a', 'accent' => '#f59e0b',
            'background' => '#ffffff', 'text' => '#17201e', 'heading_font' => 'Manrope', 'body_font' => 'Inter',
            'radius' => '16px', 'button_style' => 'solid', 'section_spacing' => 'comfortable', 'header_layout' => 'split', 'footer_layout' => 'columns',
        ]]);
        $page = $site->pages()->create(['title' => 'Home', 'slug' => 'home', 'sort_order' => 0]);
        $section = $page->sections()->create([
            'site_id' => $site->id, 'key' => (string) Str::uuid(), 'type' => 'services',
            'content' => ['eyebrow' => 'Welcome', 'heading' => 'Our work', 'body' => 'What we can do.', 'items' => [['title' => 'Design', 'body' => 'Your next chapter.']]],
            'sort_order' => 0, 'is_visible' => true,
        ]);

        return [$owner, $site, $section];
    }
}
