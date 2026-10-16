<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', fn (Blueprint $t) => $t->boolean('is_super_admin')->default(false)->index());

        Schema::create('templates', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->string('slug')->unique();
            $t->string('category');
            $t->json('blueprint');
            $t->json('theme_defaults');
            $t->boolean('is_active')->default(true);
            $t->timestamps();
        });
        Schema::create('plans', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->string('slug')->unique();
            $t->unsignedInteger('price_minor')->default(0);
            $t->string('currency', 3)->default('NPR');
            $t->json('entitlements');
            $t->boolean('is_active')->default(true);
            $t->timestamps();
        });
        Schema::create('sites', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->string('slug')->unique();
            $t->string('type')->default('business');
            $t->string('status')->default('draft')->index();
            $t->string('locale')->default('en');
            $t->string('currency', 3)->default('NPR');
            $t->string('category')->nullable();
            $t->text('description')->nullable();
            $t->string('phone')->nullable();
            $t->string('email')->nullable();
            $t->string('address')->nullable();
            $t->string('whatsapp')->nullable();
            $t->json('social_links')->nullable();
            $t->foreignId('template_id')->nullable()->constrained()->nullOnDelete();
            $t->timestamp('published_at')->nullable();
            $t->softDeletes();
            $t->timestamps();
        });
        Schema::create('site_user', function (Blueprint $t) {
            $t->id();
            $t->foreignId('site_id')->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('role')->default('staff');
            $t->timestamps();
            $t->unique(['site_id', 'user_id']);
        });
        Schema::create('onboarding_progress', function (Blueprint $t) {
            $t->id();
            $t->foreignId('site_id')->unique()->constrained()->cascadeOnDelete();
            $t->unsignedTinyInteger('step')->default(1);
            $t->json('data')->nullable();
            $t->timestamp('completed_at')->nullable();
            $t->timestamps();
        });
        Schema::create('domains', function (Blueprint $t) {
            $t->id();
            $t->foreignId('site_id')->constrained()->cascadeOnDelete();
            $t->string('host')->unique();
            $t->boolean('is_primary')->default(false);
            $t->timestamp('verified_at')->nullable();
            $t->string('verification_token', 64);
            $t->timestamps();
        });
        Schema::create('themes', function (Blueprint $t) {
            $t->id();
            $t->foreignId('site_id')->unique()->constrained()->cascadeOnDelete();
            $t->json('settings');
            $t->timestamps();
        });
        Schema::create('pages', function (Blueprint $t) {
            $t->id();
            $t->foreignId('site_id')->constrained()->cascadeOnDelete();
            $t->string('title');
            $t->string('slug');
            $t->string('seo_title')->nullable();
            $t->text('seo_description')->nullable();
            $t->boolean('show_in_navigation')->default(true);
            $t->unsignedInteger('sort_order')->default(0);
            $t->unsignedInteger('published_version')->nullable();
            $t->softDeletes();
            $t->timestamps();
            $t->unique(['site_id', 'slug']);
            $t->index(['site_id', 'sort_order']);
        });
        Schema::create('sections', function (Blueprint $t) {
            $t->id();
            $t->foreignId('site_id')->constrained()->cascadeOnDelete();
            $t->foreignId('page_id')->constrained()->cascadeOnDelete();
            $t->uuid('key');
            $t->string('type');
            $t->json('content');
            $t->unsignedInteger('sort_order');
            $t->boolean('is_visible')->default(true);
            $t->timestamps();
            $t->unique(['page_id', 'key']);
            $t->index(['site_id', 'page_id', 'sort_order']);
        });
        Schema::create('page_versions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('site_id')->constrained()->cascadeOnDelete();
            $t->foreignId('page_id')->constrained()->cascadeOnDelete();
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $t->unsignedInteger('version');
            $t->json('snapshot');
            $t->timestamp('published_at')->nullable();
            $t->timestamps();
            $t->unique(['page_id', 'version']);
        });
        Schema::create('media', function (Blueprint $t) {
            $t->id();
            $t->foreignId('site_id')->constrained()->cascadeOnDelete();
            $t->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $t->string('disk');
            $t->string('path');
            $t->string('mime_type');
            $t->unsignedBigInteger('size');
            $t->string('alt_text')->nullable();
            $t->softDeletes();
            $t->timestamps();
        });
        Schema::create('product_categories', function (Blueprint $t) {
            $t->id();
            $t->foreignId('site_id')->constrained()->cascadeOnDelete();
            $t->string('name');
            $t->string('slug');
            $t->softDeletes();
            $t->timestamps();
            $t->unique(['site_id', 'slug']);
        });
        Schema::create('products', function (Blueprint $t) {
            $t->id();
            $t->foreignId('site_id')->constrained()->cascadeOnDelete();
            $t->foreignId('product_category_id')->nullable()->constrained()->nullOnDelete();
            $t->string('name');
            $t->string('slug');
            $t->string('sku')->nullable();
            $t->text('description')->nullable();
            $t->unsignedBigInteger('price_minor');
            $t->unsignedBigInteger('sale_price_minor')->nullable();
            $t->unsignedInteger('stock_quantity')->default(0);
            $t->boolean('is_featured')->default(false);
            $t->boolean('is_active')->default(true);
            $t->softDeletes();
            $t->timestamps();
            $t->unique(['site_id', 'slug']);
            $t->unique(['site_id', 'sku']);
            $t->index(['site_id', 'is_active']);
        });
        Schema::create('product_variants', function (Blueprint $t) {
            $t->id();
            $t->foreignId('site_id')->constrained()->cascadeOnDelete();
            $t->foreignId('product_id')->constrained()->cascadeOnDelete();
            $t->string('name');
            $t->string('sku')->nullable();
            $t->json('options');
            $t->unsignedBigInteger('price_minor')->nullable();
            $t->unsignedInteger('stock_quantity')->default(0);
            $t->timestamps();
        });
        Schema::create('customers', function (Blueprint $t) {
            $t->id();
            $t->foreignId('site_id')->constrained()->cascadeOnDelete();
            $t->string('name');
            $t->string('email')->nullable();
            $t->string('phone');
            $t->timestamps();
            $t->index(['site_id', 'phone']);
        });
        Schema::create('addresses', function (Blueprint $t) {
            $t->id();
            $t->foreignId('site_id')->constrained()->cascadeOnDelete();
            $t->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $t->string('line_1');
            $t->string('line_2')->nullable();
            $t->string('city');
            $t->string('region')->nullable();
            $t->string('postal_code')->nullable();
            $t->string('country', 2)->default('NP');
            $t->timestamps();
        });
        Schema::create('orders', function (Blueprint $t) {
            $t->id();
            $t->foreignId('site_id')->constrained()->cascadeOnDelete();
            $t->foreignId('customer_id')->constrained()->restrictOnDelete();
            $t->string('number');
            $t->string('status')->default('pending')->index();
            $t->string('payment_status')->default('unpaid')->index();
            $t->string('currency', 3);
            $t->unsignedBigInteger('subtotal_minor');
            $t->unsignedBigInteger('delivery_minor')->default(0);
            $t->unsignedBigInteger('total_minor');
            $t->json('delivery_address');
            $t->timestamps();
            $t->unique(['site_id', 'number']);
        });
        Schema::create('order_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('site_id')->constrained()->cascadeOnDelete();
            $t->foreignId('order_id')->constrained()->cascadeOnDelete();
            $t->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $t->string('name');
            $t->string('sku')->nullable();
            $t->unsignedInteger('quantity');
            $t->unsignedBigInteger('unit_price_minor');
            $t->unsignedBigInteger('total_minor');
            $t->json('options')->nullable();
            $t->timestamps();
        });
        Schema::create('order_status_events', function (Blueprint $t) {
            $t->id();
            $t->foreignId('site_id')->constrained()->cascadeOnDelete();
            $t->foreignId('order_id')->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->string('from_status')->nullable();
            $t->string('to_status');
            $t->text('note')->nullable();
            $t->timestamps();
        });
        Schema::create('payments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('site_id')->constrained()->cascadeOnDelete();
            $t->foreignId('order_id')->constrained()->cascadeOnDelete();
            $t->string('gateway');
            $t->string('status')->default('pending');
            $t->unsignedBigInteger('amount_minor');
            $t->string('currency', 3);
            $t->string('idempotency_key')->unique();
            $t->string('external_reference')->nullable();
            $t->json('metadata')->nullable();
            $t->timestamps();
        });
        Schema::create('subscriptions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('site_id')->constrained()->cascadeOnDelete();
            $t->foreignId('plan_id')->constrained()->restrictOnDelete();
            $t->string('status')->default('active');
            $t->timestamp('starts_at');
            $t->timestamp('ends_at')->nullable();
            $t->timestamps();
        });
        Schema::create('usage_records', function (Blueprint $t) {
            $t->id();
            $t->foreignId('site_id')->constrained()->cascadeOnDelete();
            $t->string('metric');
            $t->unsignedBigInteger('quantity')->default(0);
            $t->date('period_start');
            $t->date('period_end');
            $t->timestamps();
            $t->unique(['site_id', 'metric', 'period_start']);
        });
        Schema::create('ai_generations', function (Blueprint $t) {
            $t->id();
            $t->foreignId('site_id')->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->string('provider')->default('local');
            $t->string('status')->default('pending')->index();
            $t->json('input');
            $t->json('output')->nullable();
            $t->unsignedTinyInteger('attempts')->default(0);
            $t->unsignedInteger('input_tokens')->default(0);
            $t->unsignedInteger('output_tokens')->default(0);
            $t->text('error')->nullable();
            $t->timestamps();
        });
        Schema::create('enquiries', function (Blueprint $t) {
            $t->id();
            $t->foreignId('site_id')->constrained()->cascadeOnDelete();
            $t->string('name');
            $t->string('email')->nullable();
            $t->string('phone')->nullable();
            $t->text('message');
            $t->string('status')->default('new');
            $t->timestamps();
        });
        Schema::create('appointments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('site_id')->constrained()->cascadeOnDelete();
            $t->string('name');
            $t->string('email')->nullable();
            $t->string('phone');
            $t->timestamp('requested_at')->nullable();
            $t->text('details')->nullable();
            $t->string('status')->default('requested');
            $t->timestamps();
        });
        Schema::create('audit_logs', function (Blueprint $t) {
            $t->id();
            $t->foreignId('site_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->string('action')->index();
            $t->string('subject_type')->nullable();
            $t->unsignedBigInteger('subject_id')->nullable();
            $t->json('context')->nullable();
            $t->ipAddress('ip_address')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['audit_logs', 'appointments', 'enquiries', 'ai_generations', 'usage_records', 'subscriptions', 'payments', 'order_status_events', 'order_items', 'orders', 'addresses', 'customers', 'product_variants', 'products', 'product_categories', 'media', 'page_versions', 'sections', 'pages', 'themes', 'domains', 'onboarding_progress', 'site_user', 'sites', 'plans', 'templates'] as $table) {
            Schema::dropIfExists($table);
        }
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn('is_super_admin'));
    }
};
