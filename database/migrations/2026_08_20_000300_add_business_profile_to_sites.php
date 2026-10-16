<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sites', function (Blueprint $table) {
            $table->string('logo_path')->nullable()->after('description');
            $table->string('map_url', 1000)->nullable()->after('address');
            $table->json('business_hours')->nullable()->after('social_links');
        });
    }

    public function down(): void
    {
        Schema::table('sites', fn (Blueprint $table) => $table->dropColumn(['logo_path', 'map_url', 'business_hours']));
    }
};
