<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $this->setHomeSections(['hero', 'services', 'gallery', 'testimonials', 'cta']);
    }

    public function down(): void
    {
        $this->setHomeSections(['hero', 'gallery', 'services', 'testimonials', 'cta']);
    }

    /** @param  list<string>  $sections */
    private function setHomeSections(array $sections): void
    {
        $template = DB::table('templates')->where('slug', 'kanti-beauty')->first();

        if (! $template) {
            return;
        }

        $blueprint = json_decode((string) $template->blueprint, true);
        if (! is_array($blueprint)) {
            $blueprint = [];
        }

        $blueprint['home_sections'] = $sections;

        DB::table('templates')
            ->where('id', $template->id)
            ->update([
                'blueprint' => json_encode($blueprint, JSON_THROW_ON_ERROR),
                'updated_at' => now(),
            ]);
    }
};
