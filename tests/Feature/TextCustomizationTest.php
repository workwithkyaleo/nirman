<?php

namespace Tests\Feature;

use App\Actions\PublishSite;
use App\Models\Section;
use App\Models\Site;
use App\Models\User;
use App\Services\Ai\AiRefinementProposalValidator;
use App\Support\TextFontCatalog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TextCustomizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_typography_saves_on_each_text_field_and_can_return_to_theme_defaults(): void
    {
        [$owner, $site, $section] = $this->studio();
        $style = ['size' => 38, 'line_height' => 1.25, 'letter_spacing' => -0.5, 'align' => 'center', 'weight' => 600, 'uppercase' => true, 'strikethrough' => true, 'underline' => true];

        foreach ([$style, null] as $value) {
            $content = [
                'eyebrow_style' => $value,
                'heading_style' => $value,
                'body_style' => $value,
                'items' => [['title' => 'Design', 'title_style' => $value, 'description_style' => $value]],
            ];
            $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), ['content' => $content])
                ->assertSessionHasNoErrors()->assertSessionHas('success');
            foreach ($content as $field => $expected) {
                $this->assertSame($expected, $section->fresh()->content[$field]);
            }
        }
    }

    public function test_typography_rejects_out_of_range_values_and_arbitrary_css_without_partial_saves(): void
    {
        [$owner, $site, $section] = $this->studio();
        $original = $section->content;
        $invalidStyles = [
            ['size' => 9], ['size' => 121], ['size' => '2rem'],
            ['line_height' => 0.79], ['line_height' => 2.51],
            ['letter_spacing' => -2.1], ['letter_spacing' => 12.1],
            ['align' => 'start; color:red'], ['weight' => 450],
            ['uppercase' => 'capitalize'], ['strikethrough' => null],
            ['textShadow' => '0 0 2px red'],
        ];
        foreach ($invalidStyles as $style) {
            $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), ['content' => [
                'heading' => 'Must not save',
                'heading_style' => $style,
                'items' => [['title' => 'Must not save', 'description_style' => $style]],
            ]])->assertSessionHasErrors();
            $this->assertSame($original, $section->fresh()->content);
        }
    }

    public function test_supported_fonts_are_consistent_for_section_theme_and_ai_theme_changes(): void
    {
        [$owner, $site, $section] = $this->studio();
        $theme = $site->theme->settings;
        foreach (TextFontCatalog::names() as $font) {
            $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), ['content' => [
                'heading_font' => $font,
                'items' => [['title' => 'Design', 'description_font' => $font]],
            ]])->assertSessionHasNoErrors();
            $this->actingAs($owner)->patch(route('themes.update', $site), [...$theme, 'heading_font' => $font, 'body_font' => $font])
                ->assertSessionHasNoErrors();
            $this->assertSame($font, $section->fresh()->content['heading_font']);
            $this->assertSame($font, $site->theme()->firstOrFail()->settings['body_font']);
            $proposal = app(AiRefinementProposalValidator::class)->validate([
                'summary' => 'Update typography',
                'operations' => [['op' => 'update_theme', 'changes' => ['heading_font' => $font, 'body_font' => $font]]],
            ]);
            $this->assertSame($font, $proposal['operations'][0]['changes']['heading_font']);
        }
    }

    public function test_draft_typography_does_not_change_public_styles_until_published(): void
    {
        [$owner, $site, $section] = $this->studio();
        $publishedStyle = ['size' => 24, 'weight' => 600, 'align' => 'left'];
        $section->update(['content' => [...$section->content, 'heading_style' => $publishedStyle]]);
        app(PublishSite::class)->handle($site->fresh(), $owner->id);
        $draftStyle = ['size' => 54, 'weight' => 800, 'align' => 'center', 'uppercase' => true];
        $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), ['content' => ['heading_style' => $draftStyle]])
            ->assertSessionHasNoErrors();
        $this->get(route('sites.preview', $site))->assertInertia(fn (Assert $page) => $page
            ->component('Public/Site')->where('page.sections.0.content.heading_style', $draftStyle));
        $this->get(route('public.site', ['siteSlug' => $site->slug]))->assertInertia(fn (Assert $page) => $page
            ->component('Public/Site')->where('page.sections.0.content.heading_style', $publishedStyle));
        app(PublishSite::class)->handle($site->fresh(), $owner->id);
        $this->get(route('public.site', ['siteSlug' => $site->slug]))->assertInertia(fn (Assert $page) => $page
            ->component('Public/Site')->where('page.sections.0.content.heading_style', $draftStyle));
    }

    public function test_typography_edits_preserve_membership_and_section_tenant_boundaries(): void
    {
        [$owner, $site, $section] = $this->studio();
        [$otherOwner, , $otherSection] = $this->studio();
        $original = $section->content;
        $content = ['heading_style' => ['size' => 60, 'weight' => 900]];
        $this->actingAs($otherOwner)->patch(route('sections.update', [$site, $section]), ['content' => $content])->assertForbidden();
        $this->actingAs($owner)->patch(route('sections.update', [$site, $otherSection]), ['content' => $content])->assertNotFound();
        $this->assertSame($original, $section->fresh()->content);
    }

    public function test_ai_copy_refinement_preserves_item_fonts_colours_and_typography(): void
    {
        [$owner, $site, $section] = $this->studio();
        $formatting = [
            'title_font' => 'Georgia', 'description_font' => 'System Sans',
            'title_color' => '#123456', 'description_color' => '#654321',
            'title_style' => ['size' => 28, 'weight' => 700],
            'description_style' => ['line_height' => 1.75, 'italic' => true],
        ];
        $section->update(['content' => [...$section->content, 'items' => [[
            'title' => 'Original title', 'body' => 'Original description.', ...$formatting,
        ]]]]);
        $this->actingAs($owner)->post(route('ai.refinements.store', $site), [
            'prompt' => 'Rewrite this section in a friendly and welcoming voice.',
            'scope' => 'section', 'page_id' => $section->page_id, 'section_id' => $section->id,
        ])->assertSessionHas('success');
        $generation = $site->aiGenerations()->where('mode', 'refinement')->sole();
        $output = $generation->output;
        $output['operations'] = [['op' => 'update_section', 'section_id' => $section->id, 'content' => [
            'items' => [['title' => 'Refined title', 'body' => 'Refined description.']],
        ]]];
        $generation->update(['output' => $output]);
        $this->actingAs($owner)->post(route('ai.refinements.apply', [$site, $generation]))->assertSessionHas('success');
        $item = $section->fresh()->content['items'][0];
        $this->assertSame('Refined title', $item['title']);
        foreach ($formatting as $key => $expected) {
            $this->assertSame($expected, $item[$key]);
        }
    }

    /** @return array{User, Site, Section} */
    private function studio(): array
    {
        $owner = User::factory()->create();
        $site = Site::create(['name' => 'Typography Studio', 'slug' => 'typography-'.Str::lower(Str::random(8)), 'type' => 'business']);
        $site->users()->attach($owner, ['role' => 'owner']);
        $site->theme()->create(['settings' => [
            'style' => 'modern', 'primary' => '#0f766e', 'secondary' => '#134e4a', 'accent' => '#f59e0b',
            'background' => '#ffffff', 'text' => '#17201e', 'heading_font' => 'Manrope', 'body_font' => 'Inter',
            'radius' => '16px', 'button_style' => 'solid', 'section_spacing' => 'comfortable', 'header_layout' => 'split', 'footer_layout' => 'columns',
        ]]);
        $page = $site->pages()->create(['title' => 'Home', 'slug' => 'home', 'sort_order' => 0]);
        $section = $page->sections()->create([
            'site_id' => $site->id, 'key' => (string) Str::uuid(), 'type' => 'services',
            'content' => ['heading' => 'Our work', 'body' => 'What we can do.', 'items' => [['title' => 'Design', 'body' => 'Your next chapter.']]],
            'sort_order' => 0, 'is_visible' => true,
        ]);

        return [$owner, $site, $section];
    }
}
