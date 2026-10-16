<?php

use App\Models\Site;
use App\Support\TemplateCatalog;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const KEYS = [
        'content_width',
        'hero_alignment',
        'card_style',
    ];

    public function up(): void
    {
        foreach (TemplateCatalog::all() as $definition) {
            DB::table('templates')
                ->where('slug', $definition['slug'])
                ->update([
                    'theme_defaults' => json_encode($definition['theme_defaults'], JSON_THROW_ON_ERROR),
                    'updated_at' => now(),
                ]);
        }

        Site::query()->with(['template', 'theme'])->eachById(function (Site $site): void {
            $defaults = $site->template?->theme_defaults ?? [];
            $composition = array_intersect_key($defaults, array_flip(self::KEYS));

            if ($site->theme) {
                $site->theme->update([
                    'settings' => array_merge($composition, $site->theme->settings ?? []),
                ]);
            }

            if ($site->published_design) {
                $published = $site->published_design;
                $published['theme'] = array_merge($composition, $published['theme'] ?? []);
                $site->update(['published_design' => $published]);
            }
        });
    }

    public function down(): void
    {
        $this->removeKeysFromJsonColumn('themes', 'settings');
        $this->removeKeysFromJsonColumn('templates', 'theme_defaults');
        $this->removeKeysFromPublishedThemes();
    }

    private function removeKeysFromJsonColumn(string $table, string $column): void
    {
        DB::table($table)
            ->select(['id', $column])
            ->orderBy('id')
            ->each(function (object $record) use ($table, $column): void {
                $value = $this->decodeJsonObject($record->{$column});

                if (! $value || ! $this->forgetKeys($value)) {
                    return;
                }

                DB::table($table)->where('id', $record->id)->update([
                    $column => json_encode($value, JSON_THROW_ON_ERROR),
                ]);
            });
    }

    private function removeKeysFromPublishedThemes(): void
    {
        DB::table('sites')
            ->select(['id', 'published_design'])
            ->orderBy('id')
            ->each(function (object $site): void {
                $published = $this->decodeJsonObject($site->published_design);

                if (! $published || ! isset($published->theme) || ! is_object($published->theme)) {
                    return;
                }

                if (! $this->forgetKeys($published->theme)) {
                    return;
                }

                DB::table('sites')->where('id', $site->id)->update([
                    'published_design' => json_encode($published, JSON_THROW_ON_ERROR),
                ]);
            });
    }

    private function decodeJsonObject(mixed $value): ?object
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        try {
            $decoded = json_decode($value, flags: JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return null;
        }

        return is_object($decoded) ? $decoded : null;
    }

    private function forgetKeys(object $value): bool
    {
        $changed = false;

        foreach (self::KEYS as $key) {
            if (! property_exists($value, $key)) {
                continue;
            }

            unset($value->{$key});
            $changed = true;
        }

        return $changed;
    }
};
