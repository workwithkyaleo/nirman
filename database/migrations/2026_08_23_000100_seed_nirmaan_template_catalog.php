<?php

use App\Support\TemplateCatalog;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('templates')->whereIn('slug', [
            'modern-retail',
            'fashion-lifestyle',
            'restaurant-cafe',
            'professional-services',
            'local-business',
        ])->update(['is_active' => false, 'updated_at' => now()]);

        foreach (TemplateCatalog::all() as $template) {
            DB::table('templates')->updateOrInsert(
                ['slug' => $template['slug']],
                [
                    'name' => $template['name'],
                    'category' => $template['category'],
                    'blueprint' => json_encode($template['blueprint'], JSON_THROW_ON_ERROR),
                    'theme_defaults' => json_encode($template['theme_defaults'], JSON_THROW_ON_ERROR),
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }
    }

    public function down(): void
    {
        DB::table('templates')->whereIn('slug', collect(TemplateCatalog::all())->pluck('slug'))->delete();
    }
};
