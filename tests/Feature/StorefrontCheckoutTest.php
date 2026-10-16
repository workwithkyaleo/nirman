<?php

namespace Tests\Feature;

use App\Actions\GenerateWebsite;
use App\Actions\PublishSite;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StorefrontCheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_browse_add_to_cart_and_place_cod_order(): void
    {
        $owner = User::factory()->create();
        $site = Site::create(['name' => 'Nepal Shop', 'slug' => 'nepal-shop', 'type' => 'store', 'currency' => 'NPR', 'description' => 'Local products']);
        $site->users()->attach($owner, ['role' => 'owner']);
        $site->theme()->create(['settings' => []]);
        $product = Product::create(['site_id' => $site->id, 'name' => 'Dhaka Scarf', 'slug' => 'dhaka-scarf', 'price_minor' => 150000, 'sale_price_minor' => 125000, 'stock_quantity' => 5, 'is_active' => true]);
        $location = $site->locations()->create(['name' => 'Main', 'code' => 'MAIN']);
        $location->stocks()->create(['site_id' => $site->id, 'product_id' => $product->id, 'quantity' => 5]);
        app(GenerateWebsite::class)->handle($site);
        app(PublishSite::class)->handle($site, $owner->id);

        $this->get(route('storefront.shop', $site->slug))->assertOk()->assertInertia(fn (Assert $page) => $page->component('Storefront/Shop')->where('products.data.0.name', 'Dhaka Scarf'));
        $this->post(route('storefront.cart.add', [$site->slug, $product]), ['quantity' => 2])->assertRedirect(route('storefront.cart', $site->slug));
        $this->get(route('storefront.cart', $site->slug))->assertInertia(fn (Assert $page) => $page->where('items.0.product.name', 'Dhaka Scarf')->where('subtotal_minor', 250000));
        $response = $this->post(route('storefront.order', $site->slug), ['name' => 'Sita Rai', 'phone' => '9800000001', 'email' => 'sita@example.test', 'address' => 'Patan Dhoka', 'city' => 'Lalitpur', 'notes' => 'Call on arrival', 'payment_method' => 'cod']);
        $order = $site->orders()->firstOrFail();
        $response->assertRedirect(route('storefront.confirmation', [$site->slug, $order->number]));
        $this->assertSame(250000, $order->total_minor);
        $this->assertSame(3, $product->fresh()->stock_quantity);
        $this->assertDatabaseHas('payments', ['order_id' => $order->id, 'gateway' => 'cod', 'status' => 'pending']);
        $this->get(route('storefront.confirmation', [$site->slug, $order->number]))->assertOk();
    }

    public function test_hidden_product_cannot_be_bought(): void
    {
        $site = Site::create(['name' => 'Shop', 'slug' => 'shop', 'type' => 'store', 'status' => 'published']);
        $product = Product::create(['site_id' => $site->id, 'name' => 'Hidden', 'slug' => 'hidden', 'price_minor' => 10000, 'stock_quantity' => 2, 'is_active' => false]);
        $this->post(route('storefront.cart.add', [$site->slug, $product]), ['quantity' => 1])->assertNotFound();
    }

    public function test_selected_product_color_is_kept_in_cart_and_order(): void
    {
        $site = Site::create(['name' => 'Color Shop', 'slug' => 'color-shop', 'type' => 'store', 'status' => 'published', 'currency' => 'NPR']);
        $product = Product::create(['site_id' => $site->id, 'name' => 'Phone', 'slug' => 'phone', 'price_minor' => 100000, 'stock_quantity' => 5, 'is_active' => true]);
        $variant = ProductVariant::create(['site_id' => $site->id, 'product_id' => $product->id, 'name' => 'Burgundy', 'color_hex' => '#800020', 'options' => ['color' => 'Burgundy'], 'stock_quantity' => 5]);
        $location = $site->locations()->create(['name' => 'Main', 'code' => 'MAIN']);
        $location->stocks()->create(['site_id' => $site->id, 'product_id' => $product->id, 'quantity' => 5]);

        $this->post(route('storefront.cart.add', [$site->slug, $product]), ['quantity' => 1, 'variant_id' => $variant->id])->assertRedirect();
        $this->get(route('storefront.cart', $site->slug))->assertInertia(fn (Assert $page) => $page->where('items.0.variant.name', 'Burgundy'));
        $this->post(route('storefront.order', $site->slug), ['name' => 'Buyer', 'phone' => '9800000001', 'email' => '', 'address' => 'Kathmandu', 'city' => 'Kathmandu', 'notes' => '', 'payment_method' => 'cod'])->assertRedirect();

        $this->assertSame('Burgundy', $site->orders()->firstOrFail()->items()->firstOrFail()->options['color']);
    }

    public function test_storefront_uses_the_published_template_for_legacy_theme_snapshots(): void
    {
        $site = Site::create([
            'name' => 'Legacy Shop',
            'slug' => 'legacy-shop',
            'type' => 'store',
            'status' => 'published',
            'published_design' => [
                'template_slug' => 'summit-studio',
                'profile' => [
                    'name' => 'Legacy Shop',
                    'slug' => 'legacy-shop',
                    'locale' => 'en',
                    'currency' => 'NPR',
                ],
                'theme' => [
                    'background' => '#111827',
                    'text' => '#f9fafb',
                ],
            ],
        ]);

        $this->get(route('storefront.shop', $site->slug))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Storefront/Shop')
                ->where('theme.template_slug', 'summit-studio')
                ->where('theme.background', '#111827')
                ->where('theme.text', '#f9fafb'));
    }
}
