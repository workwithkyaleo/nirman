<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $templates = DB::table('templates')->get()->keyBy('id');

        DB::table('sites')
            ->whereNotNull('template_id')
            ->orderBy('id')
            ->each(function ($site) use ($templates) {
                $template = $templates->get($site->template_id);

                if (! $template) {
                    return;
                }

                $defaults = json_decode((string) $template->theme_defaults, true);

                if (! is_array($defaults)) {
                    return;
                }

                $theme = DB::table('themes')->where('site_id', $site->id)->first();
                $current = $theme ? json_decode((string) $theme->settings, true) : [];
                $current = is_array($current) ? $current : [];
                $settings = $defaults;

                foreach ($current as $key => $value) {
                    if ($this->isValidCustomValue($key, $value)) {
                        $settings[$key] = $value;
                    }
                }

                $settings['template_slug'] = $template->slug;
                $payload = json_encode($settings, JSON_THROW_ON_ERROR);

                if ($theme) {
                    DB::table('themes')->where('id', $theme->id)->update([
                        'settings' => $payload,
                        'updated_at' => now(),
                    ]);

                    return;
                }

                DB::table('themes')->insert([
                    'site_id' => $site->id,
                    'settings' => $payload,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            });
    }

    public function down(): void
    {
        // Normalized theme data remains valid when rolling back.
    }

    private function isValidCustomValue(string $key, mixed $value): bool
    {
        if (! is_string($value)) {
            return false;
        }

        if (in_array($key, ['primary', 'secondary', 'accent', 'background', 'text'], true)) {
            return preg_match('/^#[0-9a-f]{6}$/i', $value) === 1;
        }

        $allowed = [
            'style' => ['modern', 'elegant', 'bold', 'minimal', 'traditional'],
            'heading_font' => ['Manrope', 'Inter', 'Playfair Display', 'Poppins', 'DM Sans'],
            'body_font' => ['Inter', 'Manrope', 'Poppins', 'DM Sans'],
            'radius' => ['0px', '8px', '16px', '24px'],
            'button_style' => ['solid', 'outline', 'rounded'],
            'section_spacing' => ['compact', 'comfortable', 'generous'],
            'header_layout' => ['split', 'centered', 'minimal'],
            'footer_layout' => ['columns', 'centered', 'minimal'],
        ];

        return isset($allowed[$key]) && in_array($value, $allowed[$key], true);
    }
};
