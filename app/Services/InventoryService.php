<?php

namespace App\Services;

use App\Models\InventoryMovement;
use App\Models\InventoryStock;
use App\Models\Location;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryService
{
    public function adjust(Location $location, Product $product, int $delta, string $type, ?int $userId = null, ?string $reference = null): InventoryStock
    {
        abort_unless($location->site_id === $product->site_id, 404);

        return DB::transaction(function () use ($location, $product, $delta, $type, $userId, $reference) {
            $stock = InventoryStock::query()->lockForUpdate()->firstOrCreate(
                ['site_id' => $location->site_id, 'location_id' => $location->id, 'product_id' => $product->id, 'product_variant_id' => null],
                ['quantity' => 0, 'reserved_quantity' => 0]
            );
            $after = $stock->quantity + $delta;
            if ($after < 0) {
                throw ValidationException::withMessages(['quantity' => 'This adjustment would make stock negative.']);
            }
            $stock->update(['quantity' => $after]);
            $product->update(['stock_quantity' => InventoryStock::where('site_id', $product->site_id)->where('product_id', $product->id)->sum('quantity')]);
            InventoryMovement::create(['site_id' => $location->site_id, 'location_id' => $location->id, 'product_id' => $product->id, 'user_id' => $userId, 'type' => $type, 'quantity_delta' => $delta, 'quantity_after' => $after, 'reference' => $reference]);

            return $stock->fresh();
        });
    }
}
