<?php

namespace Tests\Feature;

use App\Models\Site;
use App\Models\Template;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class UpdateThemeRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_each_theme_colour_rejects_alpha_hex(): void
    {
        [$owner, $site, $theme] = $this->siteWithTheme();

        foreach (['primary', 'secondary', 'accent', 'background', 'text'] as $field) {
            $payload = $theme;
            $payload[$field] = '#11223344';

            $this->actingAs($owner)
                ->from(route('sites.edit', $site))
                ->patch(route('themes.update', $site), $payload)
                ->assertRedirect(route('sites.edit', $site))
                ->assertSessionHasErrors($field);

            $this->assertSame($theme, $site->theme()->firstOrFail()->settings);
        }
    }

    public function test_theme_colours_require_an_exact_six_digit_hash_form(): void
    {
        [$owner, $site, $theme] = $this->siteWithTheme();

        foreach (['#123', '112233', '#12345g', "#1122\n33"] as $invalid) {
            $payload = [...$theme, 'primary' => $invalid];

            $this->actingAs($owner)
                ->from(route('sites.edit', $site))
                ->patch(route('themes.update', $site), $payload)
                ->assertRedirect(route('sites.edit', $site))
                ->assertSessionHasErrors('primary');
        }

        $this->assertSame($theme, $site->theme()->firstOrFail()->settings);
    }

    public function test_accessible_contrast_is_still_required_for_valid_colours(): void
    {
        [$owner, $site, $theme] = $this->siteWithTheme();

        $this->actingAs($owner)
            ->from(route('sites.edit', $site))
            ->patch(route('themes.update', $site), [
                ...$theme,
                'background' => '#ffffff',
                'text' => '#777777',
            ])
            ->assertRedirect(route('sites.edit', $site))
            ->assertSessionHasErrors([
                'text' => 'Text and background colours must have at least 4.5:1 contrast.',
            ]);

        $this->assertSame($theme, $site->theme()->firstOrFail()->settings);
    }

    /** @return array{User, Site, array<string, mixed>} */
    private function siteWithTheme(): array
    {
        $owner = User::factory()->create();
        $slug = 'strict-colour-'.Str::lower(Str::random(6));
        $theme = [
            'style' => 'modern',
            'template_slug' => $slug,
            'primary' => '#14532d',
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
        ];
        $template = Template::create([
            'name' => 'Strict Colour',
            'slug' => $slug,
            'category' => 'Test',
            'blueprint' => ['home_sections' => ['hero']],
            'theme_defaults' => $theme,
            'is_active' => true,
        ]);
        $site = Site::create([
            'name' => 'Strict Colour Studio',
            'slug' => 'strict-colour-studio-'.Str::lower(Str::random(6)),
            'type' => 'business',
            'template_id' => $template->id,
        ]);
        $site->users()->attach($owner, ['role' => 'owner']);
        $site->theme()->create(['settings' => $theme]);

        return [$owner, $site, $theme];
    }
}
