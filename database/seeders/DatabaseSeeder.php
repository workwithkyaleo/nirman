<?php

namespace Database\Seeders;

use App\Actions\GenerateWebsite;
use App\Actions\PublishSite;
use App\Models\InventoryStock;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Site;
use App\Models\Template;
use App\Models\User;
use App\Support\TemplateCatalog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Template::whereIn('slug', ['modern-retail', 'fashion-lifestyle', 'restaurant-cafe', 'professional-services', 'local-business'])->update(['is_active' => false]);
        foreach (TemplateCatalog::all() as $template) {
            Template::updateOrCreate(['slug' => $template['slug']], $template);
        }
        foreach ([['Free Trial', 'free-trial', 0, ['websites' => 1, 'products' => 5, 'ai_generations' => 3, 'staff' => 0, 'custom_domain' => false]], ['Business', 'business', 149900, ['websites' => 1, 'products' => 0, 'ai_generations' => 20, 'staff' => 2, 'custom_domain' => true]], ['Store', 'store', 249900, ['websites' => 1, 'products' => 100, 'ai_generations' => 30, 'staff' => 3, 'custom_domain' => true]], ['Pro', 'pro', 499900, ['websites' => 5, 'products' => 1000, 'ai_generations' => 100, 'staff' => 10, 'custom_domain' => true]]] as [$name,$slug,$price,$limits]) {
            Plan::updateOrCreate(['slug' => $slug], ['name' => $name, 'price_minor' => $price, 'entitlements' => $limits]);
        }
        User::updateOrCreate(['email' => 'admin@nirmaan.test'], ['name' => 'Platform Admin', 'password' => Hash::make('password'), 'email_verified_at' => now(), 'is_super_admin' => true]);
        $owner = User::updateOrCreate(['email' => 'owner@nirmaan.test'], ['name' => 'Aarav Shrestha', 'password' => Hash::make('password'), 'email_verified_at' => now()]);
        foreach ([['Himalayan Bloom', 'himalayan-bloom', 'business', 'Florist'], ['Ktm Craft House', 'ktm-craft-house', 'store', 'Nepali handicrafts']] as [$name,$slug,$type,$category]) {
            $template = Template::where('slug', $type === 'store' ? 'everest-commerce' : 'kanti-beauty')->firstOrFail();
            $site = Site::updateOrCreate(['slug' => $slug], ['name' => $name, 'type' => $type, 'template_id' => $template->id, 'category' => $category, 'description' => $type === 'store' ? 'Handmade homeware and gifts from independent Nepali makers.' : 'Seasonal flowers arranged with care and delivered across Kathmandu.', 'status' => 'draft', 'currency' => 'NPR', 'address' => 'Lalitpur, Nepal', 'phone' => '+977 9800000000']);
            $site->users()->syncWithoutDetaching([$owner->id => ['role' => 'owner']]);
            $site->theme()->updateOrCreate([], ['settings' => $template->theme_defaults]);
            $site->onboarding()->firstOrCreate([], ['step' => 5, 'completed_at' => now(), 'data' => ['style' => 'modern', 'language' => 'English']]);
            app(GenerateWebsite::class)->handle($site);
            app(PublishSite::class)->handle($site, $owner->id);
            if ($type === 'store') {
                foreach (['Lokta Paper Journal', 'Handwoven Dhaka Scarf', 'Copper Water Bottle', 'Ceramic Tea Set', 'Felt Mountain Garland', 'Wild Honey 500g', 'Singing Bowl', 'Bamboo Serving Tray', 'Pashmina Wrap', 'Wooden Spice Box'] as $i => $product) {
                    Product::firstOrCreate(['site_id' => $site->id, 'slug' => str($product)->slug()], ['name' => $product, 'sku' => 'KCH-'.str_pad((string) ($i + 1), 3, '0', STR_PAD_LEFT), 'description' => 'Made in Nepal with thoughtful materials and time-honoured craft.', 'price_minor' => (1200 + $i * 325) * 100, 'stock_quantity' => 3 + $i, 'is_featured' => $i < 4]);
                }
                $location = $site->locations()->firstOrCreate(['code' => 'KTM-01'], ['name' => 'Kathmandu Store', 'type' => 'store', 'address' => 'Lalitpur, Nepal']);
                foreach ($site->products as $product) {
                    InventoryStock::firstOrCreate(['site_id' => $site->id, 'location_id' => $location->id, 'product_id' => $product->id, 'product_variant_id' => null], ['quantity' => $product->stock_quantity, 'reorder_level' => 5]);
                }
            }
        }
    }
}
