<?php

namespace Tests\Feature;

use App\Models\Page;
use App\Models\Section;
use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ActionTextCustomizationTest extends TestCase
{
    use RefreshDatabase;

    private const FIELDS = ['primary_action', 'secondary_action', 'action'];

    public function test_button_text_fonts_colors_styles_and_animations_save_and_reset_without_changing_labels(): void
    {
        [$owner, $site, , $hero] = $this->studio();
        $style = [
            'bold' => true, 'italic' => true, 'underline' => true,
            'strikethrough' => false, 'uppercase' => true, 'size' => 20,
            'line_height' => 1.25, 'letter_spacing' => 1.5, 'align' => 'center', 'weight' => 700,
            'animation' => 'rise', 'animation_duration' => 600, 'animation_delay' => 150,
        ];

        foreach ([['Lora', '#2468ab', $style], [null, null, null]] as [$font, $color, $format]) {
            $content = $this->formatting($font, $color, $format);
            $this->actingAs($owner)->patch(route('sections.update', [$site, $hero]), ['content' => $content])
                ->assertSessionHasNoErrors()->assertSessionHas('success');
            $saved = $hero->fresh()->content;
            foreach ($content as $field => $expected) {
                $this->assertArrayHasKey($field, $saved);
                $this->assertSame($expected, $saved[$field]);
            }
            $this->assertSame('Get started', $saved['primary_action']);
            $this->assertSame('Learn more', $saved['secondary_action']);
            $this->assertSame('Contact us', $saved['action']);
        }
    }

    public function test_button_text_rejects_invalid_fonts_colors_typography_and_arbitrary_css_atomically(): void
    {
        [$owner, $site, , $hero] = $this->studio();
        $original = $hero->content;
        $invalid = [
            ['font', 'CustomFont, url(https://example.com)'],
            ['color', 'red; background:blue'],
            ['style', ['size' => 121]],
            ['style', ['weight' => 450]],
            ['style', ['italic' => 'yes']],
            ['style', ['animation' => 'spin']],
            ['style', ['animation_duration' => 199]],
            ['style', ['animation_delay' => -1]],
            ['style', ['animation' => 'fade', 'animation_iteration_count' => 'infinite']],
        ];

        foreach ($invalid as [$setting, $value]) {
            $content = ['heading' => 'Must not save'];
            foreach (self::FIELDS as $field) {
                $content["{$field}_{$setting}"] = $value;
            }
            $this->actingAs($owner)->patch(route('sections.update', [$site, $hero]), ['content' => $content])
                ->assertSessionHasErrors();
            $this->assertSame($original, $hero->fresh()->content);
        }
    }

    public function test_button_text_validation_has_friendly_labels(): void
    {
        [$owner, $site, , $hero] = $this->studio();

        $this->actingAs($owner)->patch(route('sections.update', [$site, $hero]), ['content' => [
            'primary_action_font' => 'Unsupported Font',
            'secondary_action_style' => ['animation_delay' => -1],
            'action_style' => ['size' => 9],
        ]])->assertSessionHasErrors([
            'content.primary_action_font' => 'The selected primary button text font is invalid.',
            'content.secondary_action_style.animation_delay' => 'The secondary button text animation delay field must be at least 0.',
            'content.action_style.size' => 'The button text size field must be at least 10.',
        ]);
    }

    public function test_ai_button_copy_refinement_preserves_owner_formatting_for_hero_and_cta_labels(): void
    {
        [$owner, $site, $page, $hero, $cta] = $this->studio();
        $formatting = $this->formatting('Montserrat', '#13579b', [
            'italic' => true, 'size' => 22, 'animation' => 'zoom', 'animation_duration' => 800, 'animation_delay' => 200,
        ]);
        foreach ([$hero, $cta] as $section) {
            $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), ['content' => $formatting])
                ->assertSessionHasNoErrors();
        }

        $this->post(route('ai.refinements.store', $site), [
            'prompt' => 'Make the button text more friendly and welcoming.',
            'scope' => 'page', 'page_id' => $page->id,
        ])->assertSessionHas('success');
        $generation = $site->aiGenerations()->where('mode', 'refinement')->sole();
        $output = $generation->output;
        $output['operations'] = [
            ['op' => 'update_section', 'section_id' => $hero->id, 'content' => [
                'primary_action' => 'Start your journey', 'secondary_action' => 'Explore our story',
            ]],
            ['op' => 'update_section', 'section_id' => $cta->id, 'content' => ['action' => 'Talk with our team']],
        ];
        $generation->update(['output' => $output]);

        $this->post(route('ai.refinements.apply', [$site, $generation]))->assertSessionHas('success');

        foreach ([$hero, $cta] as $section) {
            $saved = $section->fresh()->content;
            foreach ($formatting as $field => $expected) {
                $this->assertSame($expected, $saved[$field]);
            }
        }
        $this->assertSame('Start your journey', $hero->fresh()->content['primary_action']);
        $this->assertSame('Explore our story', $hero->fresh()->content['secondary_action']);
        $this->assertSame('Talk with our team', $cta->fresh()->content['action']);
    }

    private function formatting(?string $font, ?string $color, ?array $style): array
    {
        $content = [];
        foreach (self::FIELDS as $field) {
            $content["{$field}_font"] = $font;
            $content["{$field}_color"] = $color;
            $content["{$field}_style"] = $style;
        }

        return $content;
    }

    /** @return array{User, Site, Page, Section, Section} */
    private function studio(): array
    {
        $owner = User::factory()->create();
        $site = Site::create([
            'name' => 'Button Text Studio', 'slug' => 'buttons-'.Str::lower(Str::random(8)), 'type' => 'business',
        ]);
        $site->users()->attach($owner, ['role' => 'owner']);
        $site->theme()->create(['settings' => []]);
        $page = $site->pages()->create(['title' => 'Home', 'slug' => 'home', 'sort_order' => 0]);
        $hero = $page->sections()->create([
            'site_id' => $site->id, 'key' => (string) Str::uuid(), 'type' => 'hero',
            'content' => [
                'heading' => 'Welcome', 'primary_action' => 'Get started',
                'secondary_action' => 'Learn more', 'action' => 'Contact us',
            ],
            'sort_order' => 0, 'is_visible' => true,
        ]);
        $cta = $page->sections()->create([
            'site_id' => $site->id, 'key' => (string) Str::uuid(), 'type' => 'cta',
            'content' => ['heading' => 'Let us help', 'action' => 'Contact us'],
            'sort_order' => 1, 'is_visible' => true,
        ]);

        return [$owner, $site, $page, $hero, $cta];
    }
}
