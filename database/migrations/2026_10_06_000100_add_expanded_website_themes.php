<?php

use App\Support\TemplateCatalog;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** @var list<string> */
    private const SLUGS = [
        'patra-editorial',
        'drishti-photography',
        'prakriti-wellness',
        'chiya-cafe',
        'orbit-digital',
        'doko-essentials',
    ];

    public function up(): void
    {
        foreach (TemplateCatalog::all() as $template) {
            if (! in_array($template['slug'], self::SLUGS, true)) {
                continue;
            }

            // Existing installations get the new choices without reseeding
            // accounts, replacing customised templates or changing live sites.
            DB::table('templates')->upsert([[
                'name' => $template['name'],
                'slug' => $template['slug'],
                'category' => $template['category'],
                'blueprint' => json_encode($template['blueprint'], JSON_THROW_ON_ERROR),
                'theme_defaults' => json_encode($template['theme_defaults'], JSON_THROW_ON_ERROR),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]], ['slug'], ['is_active', 'updated_at']);
        }
    }

    public function down(): void
    {
        // Keep rows referenced by existing sites and their published snapshots.
        DB::table('templates')->whereIn('slug', self::SLUGS)->update([
            'is_active' => false,
            'updated_at' => now(),
        ]);
    }
};
