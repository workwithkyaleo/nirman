<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_generations', function (Blueprint $table) {
            $table->string('mode')->default('initial')->after('provider');
            $table->string('scope')->nullable()->after('mode');
            $table->foreignId('target_page_id')->nullable()->after('scope')->constrained('pages')->nullOnDelete();
            $table->foreignId('target_section_id')->nullable()->after('target_page_id')->constrained('sections')->nullOnDelete();
            $table->string('base_hash', 64)->nullable()->after('target_section_id');
            $table->timestamp('applied_at')->nullable()->after('error');
            $table->index(['site_id', 'mode', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('ai_generations', function (Blueprint $table) {
            $table->dropForeign(['target_page_id']);
            $table->dropForeign(['target_section_id']);
            $table->dropIndex(['site_id', 'mode', 'status']);
            $table->dropColumn(['mode', 'scope', 'target_page_id', 'target_section_id', 'base_hash', 'applied_at']);
        });
    }
};
