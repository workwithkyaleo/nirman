<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $templateId = DB::table('templates')->where('slug', 'sajilo-launch')->value('id');

        if ($templateId) {
            DB::table('sites')->whereNull('template_id')->update([
                'template_id' => $templateId,
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        // Existing sites keep their valid selection on rollback.
    }
};
