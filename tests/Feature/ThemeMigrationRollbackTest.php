<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ThemeMigrationRollbackTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @param  list<string>  $keys
     */
    #[DataProvider('themeControlMigrations')]
    public function test_theme_control_rollbacks_remove_only_their_keys_and_ignore_invalid_json(
        string $migrationFile,
        array $keys,
        string $unrelatedKey,
    ): void {
        $now = now();
        $suffix = substr($migrationFile, 11, 6);
        $templateId = DB::table('templates')->value('id');
        $values = array_fill_keys($keys, 'remove-me');
        $customizations = [...$values, $unrelatedKey => 'keep-me'];

        DB::table('templates')->where('id', $templateId)->update([
            'theme_defaults' => json_encode([
                'preserved' => 'template',
                ...$customizations,
            ], JSON_THROW_ON_ERROR),
        ]);

        $invalidTemplateId = DB::table('templates')->insertGetId([
            'name' => "Invalid JSON {$suffix}",
            'slug' => "invalid-json-{$suffix}",
            'category' => 'Test',
            'blueprint' => '{}',
            'theme_defaults' => '{invalid',
            'is_active' => false,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $siteId = $this->insertSite(
            "rollback-valid-{$suffix}",
            $templateId,
            json_encode([
                'preserved' => 'published-design',
                'theme' => [
                    'preserved' => 'published-theme',
                    ...$customizations,
                ],
            ], JSON_THROW_ON_ERROR),
        );
        $invalidSiteId = $this->insertSite("rollback-invalid-{$suffix}", $templateId, '{invalid');
        $nullSiteId = $this->insertSite("rollback-null-{$suffix}", $templateId, null);
        $nullThemeSiteId = $this->insertSite(
            "rollback-null-theme-{$suffix}",
            $templateId,
            json_encode(['preserved' => 'published-design', 'theme' => null], JSON_THROW_ON_ERROR),
        );

        DB::table('themes')->insert([
            [
                'site_id' => $siteId,
                'settings' => json_encode([
                    'preserved' => 'theme',
                    ...$customizations,
                ], JSON_THROW_ON_ERROR),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'site_id' => $invalidSiteId,
                'settings' => '{invalid',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        $migration = require database_path("migrations/{$migrationFile}");
        $migration->down();

        $theme = $this->decodeJsonObject(DB::table('themes')->where('site_id', $siteId)->value('settings'));
        $template = $this->decodeJsonObject(DB::table('templates')->where('id', $templateId)->value('theme_defaults'));
        $published = $this->decodeJsonObject(DB::table('sites')->where('id', $siteId)->value('published_design'));

        foreach ($keys as $key) {
            $this->assertArrayNotHasKey($key, $theme);
            $this->assertArrayNotHasKey($key, $template);
            $this->assertArrayNotHasKey($key, $published['theme']);
        }

        $this->assertSame('theme', $theme['preserved']);
        $this->assertSame('template', $template['preserved']);
        $this->assertSame('published-design', $published['preserved']);
        $this->assertSame('published-theme', $published['theme']['preserved']);
        $this->assertSame('keep-me', $theme[$unrelatedKey]);
        $this->assertSame('keep-me', $template[$unrelatedKey]);
        $this->assertSame('keep-me', $published['theme'][$unrelatedKey]);

        $this->assertSame('{invalid', DB::table('themes')->where('site_id', $invalidSiteId)->value('settings'));
        $this->assertSame('{invalid', DB::table('templates')->where('id', $invalidTemplateId)->value('theme_defaults'));
        $this->assertSame('{invalid', DB::table('sites')->where('id', $invalidSiteId)->value('published_design'));
        $this->assertNull(DB::table('sites')->where('id', $nullSiteId)->value('published_design'));
        $this->assertSame(
            ['preserved' => 'published-design', 'theme' => null],
            $this->decodeJsonObject(DB::table('sites')->where('id', $nullThemeSiteId)->value('published_design')),
        );
    }

    /**
     * @return array<string, array{string, list<string>, string}>
     */
    public static function themeControlMigrations(): array
    {
        return [
            'composition controls' => [
                '2026_09_05_000100_expand_theme_composition_controls.php',
                ['content_width', 'hero_alignment', 'card_style'],
                'motion',
            ],
            'advanced controls' => [
                '2026_09_05_000200_add_advanced_theme_controls.php',
                ['heading_scale', 'hero_height', 'header_style', 'motion', 'image_shape', 'divider_style'],
                'content_width',
            ],
        ];
    }

    private function insertSite(string $slug, int $templateId, ?string $publishedDesign): int
    {
        return DB::table('sites')->insertGetId([
            'name' => str($slug)->headline()->toString(),
            'slug' => $slug,
            'type' => 'business',
            'status' => 'draft',
            'locale' => 'en',
            'currency' => 'NPR',
            'template_id' => $templateId,
            'published_design' => $publishedDesign,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /** @return array<string, mixed> */
    private function decodeJsonObject(mixed $value): array
    {
        $decoded = json_decode((string) $value, true, flags: JSON_THROW_ON_ERROR);
        $this->assertIsArray($decoded);

        return $decoded;
    }
}
