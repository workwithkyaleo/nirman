<?php

namespace Tests\Feature;

use App\Actions\GenerateWebsite;
use App\Actions\PublishSite;
use App\Models\Product;
use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProductManagementTest extends TestCase
{
    use RefreshDatabase;

    private function storeFor(User $user): Site
    {
        $site = Site::create(['name' => 'Shop', 'slug' => 'shop-'.fake()->unique()->word(), 'type' => 'store', 'currency' => 'NPR']);
        $site->users()->attach($user, ['role' => 'owner']);

        return $site;
    }

    public function test_owner_can_add_update_and_delete_a_product_with_minor_unit_prices(): void
    {
        $owner = User::factory()->create();
        $site = $this->storeFor($owner);
        $response = $this->actingAs($owner)->post(route('products.store', $site), ['name' => 'Dhaka Scarf', 'category' => 'Accessories', 'sku' => 'DS-1', 'description' => 'Handwoven in Nepal.', 'price' => '1499.50', 'sale_price' => '1299.00', 'stock_quantity' => 8, 'is_featured' => true, 'is_active' => true]);
        $response->assertRedirect(route('products.index', $site));
        $product = Product::where('site_id', $site->id)->firstOrFail();
        $this->assertSame(149950, $product->price_minor);
        $this->assertSame(129900, $product->sale_price_minor);
        $this->assertDatabaseHas('inventory_stocks', ['site_id' => $site->id, 'product_id' => $product->id, 'quantity' => 8]);
        $this->patch(route('products.update', [$site, $product]), ['name' => 'Dhaka Scarf', 'category' => 'Accessories', 'sku' => 'DS-1', 'description' => 'Updated', 'price' => '1500', 'sale_price' => '', 'stock_quantity' => 3, 'is_featured' => false, 'is_active' => true])->assertRedirect(route('products.index', $site));
        $this->assertSame(3, $product->fresh()->stock_quantity);
        $this->delete(route('products.destroy', [$site, $product]))->assertSessionHas('success');
        $this->assertSoftDeleted($product);
    }

    public function test_product_routes_do_not_leak_between_sites(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $site = $this->storeFor($owner);
        $otherSite = $this->storeFor($other);
        $product = Product::create(['site_id' => $site->id, 'name' => 'Private Product', 'slug' => 'private-product', 'price_minor' => 10000]);
        $this->actingAs($other)->get(route('products.edit', [$otherSite, $product]))->assertNotFound();
        $this->actingAs($other)->get(route('products.index', $site))->assertForbidden();
    }

    public function test_equal_sale_price_is_stored_as_no_sale(): void
    {
        $owner = User::factory()->create();
        $site = $this->storeFor($owner);

        $this->actingAs($owner)->post(route('products.store', $site), ['name' => 'Full Price Item', 'category' => '', 'sku' => '', 'description' => '', 'price' => '2000', 'sale_price' => '2000', 'stock_quantity' => 1, 'is_featured' => false, 'is_active' => true])->assertRedirect();

        $this->assertNull(Product::where('site_id', $site->id)->firstOrFail()->sale_price_minor);
    }

    public function test_owner_can_add_color_options_with_separate_images(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create();
        $site = $this->storeFor($owner);

        $this->actingAs($owner)->post(route('products.store', $site), [
            'name' => 'Cotton Shirt', 'category' => 'Clothing', 'sku' => 'SHIRT-1', 'description' => '',
            'price' => '2000', 'sale_price' => '', 'stock_quantity' => 10, 'is_featured' => false, 'is_active' => true,
            'colors' => [
                ['name' => 'Red', 'color_hex' => '#ff0000', 'image' => UploadedFile::fake()->image('red.jpg')],
                ['name' => 'Blue', 'color_hex' => '#0000ff', 'image' => UploadedFile::fake()->image('blue.jpg')],
            ],
        ])->assertRedirect();

        $product = Product::where('site_id', $site->id)->firstOrFail();
        $this->assertSame(['Red', 'Blue'], $product->variants()->pluck('name')->all());
        $product->variants->each(fn ($variant) => Storage::disk('public')->assertExists($variant->image_path));
    }

    public function test_active_product_is_available_to_the_published_storefront(): void
    {
        $owner = User::factory()->create();
        $site = $this->storeFor($owner);
        $site->update(['description' => 'A local store.']);
        $site->theme()->create(['settings' => []]);
        Product::create(['site_id' => $site->id, 'name' => 'Visible Product', 'slug' => 'visible-product', 'price_minor' => 125000, 'stock_quantity' => 4, 'is_active' => true]);
        Product::create(['site_id' => $site->id, 'name' => 'Hidden Product', 'slug' => 'hidden-product', 'price_minor' => 125000, 'stock_quantity' => 4, 'is_active' => false]);
        app(GenerateWebsite::class)->handle($site);
        app(PublishSite::class)->handle($site, $owner->id);

        $this->get(route('public.site', ['siteSlug' => $site->slug]))->assertOk()->assertInertia(fn (Assert $page) => $page->component('Public/Site')->has('products', 1)->where('products.0.name', 'Visible Product'));
    }
}
