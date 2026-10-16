<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Site;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StorefrontVariantSelectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_missing_variant_returns_a_field_error_instead_of_an_http_exception(): void
    {
        $site = Site::create(['name' => 'Shop', 'slug' => 'shop', 'type' => 'store', 'status' => 'published']);
        $product = Product::create(['site_id' => $site->id, 'name' => 'Shirt', 'slug' => 'shirt', 'price_minor' => 10000, 'stock_quantity' => 4, 'is_active' => true]);
        ProductVariant::create(['site_id' => $site->id, 'product_id' => $product->id, 'name' => 'Blue', 'options' => ['color' => 'Blue'], 'stock_quantity' => 4]);

        $this->post(route('storefront.cart.add', [$site->slug, $product]), ['quantity' => 1])
            ->assertRedirect()
            ->assertSessionHasErrors('variant_id');
    }
}
