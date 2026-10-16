<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Site;
use Illuminate\Session\Store;

class StorefrontCart
{
    public function __construct(private Store $session) {}

    public function items(Site $site): array
    {
        $stored = $this->session->get($this->key($site), []);
        $productIds = collect($stored)->map(fn ($item, $key) => is_array($item) ? $item['product_id'] : $key)->unique();
        $products = Product::where('site_id', $site->id)->where('is_active', true)->whereIn('id', $productIds)->with('variants')->get()->keyBy('id');

        return collect($stored)->map(function ($storedItem, $productId) use ($products) {
            $quantity = is_array($storedItem) ? $storedItem['quantity'] : $storedItem;
            $variantId = is_array($storedItem) ? ($storedItem['variant_id'] ?? null) : null;
            $productId = is_array($storedItem) ? $storedItem['product_id'] : $productId;
            $product = $products->get($productId);
            if (! $product) {
                return null;
            }
            $quantity = min((int) $quantity, $product->stock_quantity);
            $unit = $product->sale_price_minor ?? $product->price_minor;
            $variant = $variantId ? $product->variants->firstWhere('id', $variantId) : null;

            return ['product' => $product->only(['id', 'name', 'slug', 'sku', 'image_path', 'stock_quantity']), 'variant' => $variant?->only(['id', 'name', 'color_hex', 'image_path']), 'quantity' => $quantity, 'unit_price_minor' => $unit, 'total_minor' => $unit * $quantity];
        })->filter()->values()->all();
    }

    public function put(Site $site, Product $product, int $quantity, ?ProductVariant $variant = null): void
    {
        abort_unless($product->site_id === $site->id && $product->is_active, 404);
        $cart = $this->session->get($this->key($site), []);
        abort_if($variant && ($variant->site_id !== $site->id || $variant->product_id !== $product->id), 404);
        $key = $product->id.':'.($variant?->id ?? 'default');
        if ($quantity <= 0) {
            unset($cart[$key]);
        } else {
            $cart[$key] = ['product_id' => $product->id, 'variant_id' => $variant?->id, 'quantity' => min($quantity, $product->stock_quantity, 99)];
        }
        $this->session->put($this->key($site), $cart);
    }

    public function clear(Site $site): void
    {
        $this->session->forget($this->key($site));
    }

    private function key(Site $site): string
    {
        return "storefront_cart.{$site->id}";
    }
}
