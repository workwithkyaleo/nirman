<?php

namespace Tests\Unit;

use App\Models\Location;
use App\Models\Product;
use App\Models\Site;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class InventoryServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_adjustment_updates_location_stock_product_total_and_ledger(): void
    {
        $site = Site::create(['name' => 'Store', 'slug' => 'store', 'type' => 'store']);
        $location = Location::create(['site_id' => $site->id, 'name' => 'Kathmandu', 'code' => 'KTM']);
        $product = Product::create(['site_id' => $site->id, 'name' => 'Tea', 'slug' => 'tea', 'price_minor' => 50000]);

        $stock = app(InventoryService::class)->adjust($location, $product, 8, 'purchase', reference: 'PO-1');

        $this->assertSame(8, $stock->quantity);
        $this->assertSame(8, $product->fresh()->stock_quantity);
        $this->assertDatabaseHas('inventory_movements', ['site_id' => $site->id, 'quantity_delta' => 8, 'quantity_after' => 8]);
    }

    public function test_stock_cannot_become_negative(): void
    {
        $this->expectException(ValidationException::class);
        $site = Site::create(['name' => 'Store', 'slug' => 'store', 'type' => 'store']);
        $location = Location::create(['site_id' => $site->id, 'name' => 'Kathmandu', 'code' => 'KTM']);
        $product = Product::create(['site_id' => $site->id, 'name' => 'Tea', 'slug' => 'tea', 'price_minor' => 50000]);
        app(InventoryService::class)->adjust($location, $product, -1, 'sale');
    }
}
