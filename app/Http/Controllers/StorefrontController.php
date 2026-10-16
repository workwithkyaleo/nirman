<?php

namespace App\Http\Controllers;

use App\Http\Requests\CheckoutRequest;
use App\Models\Customer;
use App\Models\InventoryStock;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Site;
use App\Services\StorefrontCart;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class StorefrontController extends Controller
{
    public function shop(string $siteSlug, Request $request, StorefrontCart $cart)
    {
        $site = $this->store($siteSlug);
        $products = $site->products()->where('is_active', true)->with('category:id,name')->when($request->string('search')->toString(), fn ($q, $search) => $q->where('name', 'like', "%{$search}%"))->orderByDesc('is_featured')->latest()->paginate(16)->withQueryString();

        return Inertia::render('Storefront/Shop', ['site' => $this->siteData($site), 'theme' => $this->designTheme($site), 'navigation' => $this->navigation($site), 'products' => $products, 'cartCount' => $this->cartCount($cart, $site), 'filters' => $request->only('search')]);
    }

    public function product(string $siteSlug, string $productSlug, StorefrontCart $cart)
    {
        $site = $this->store($siteSlug);
        $product = $site->products()->where('slug', $productSlug)->where('is_active', true)->with(['category:id,name', 'variants:id,product_id,name,color_hex,image_path'])->firstOrFail();

        return Inertia::render('Storefront/Product', ['site' => $this->siteData($site), 'theme' => $this->designTheme($site), 'navigation' => $this->navigation($site), 'product' => $product, 'cartCount' => $this->cartCount($cart, $site)]);
    }

    public function add(Request $request, string $siteSlug, Product $product, StorefrontCart $cart)
    {
        $site = $this->store($siteSlug);
        abort_unless($product->site_id === $site->id, 404);
        $data = $request->validate(['quantity' => 'required|integer|min:1|max:99', 'variant_id' => 'nullable|integer']);
        $variant = filled($data['variant_id'] ?? null) ? $product->variants()->where('site_id', $site->id)->findOrFail($data['variant_id']) : null;
        if ($product->variants()->exists() && ! $variant) {
            return back()->withErrors(['variant_id' => 'Please select a color before adding this product to your cart.']);
        }
        if ($product->stock_quantity < $data['quantity']) {
            return back()->with('error', 'Only '.$product->stock_quantity.' item(s) are currently available.');
        }
        $current = collect($cart->items($site))->first(fn ($item) => $item['product']['id'] === $product->id && data_get($item, 'variant.id') === $variant?->id)['quantity'] ?? 0;
        $cart->put($site, $product, $current + $data['quantity'], $variant);

        return redirect()->route('storefront.cart', $site->slug)->with('success', 'Product added to cart.');
    }

    public function cart(string $siteSlug, StorefrontCart $cart)
    {
        $site = $this->store($siteSlug);
        $items = $cart->items($site);

        return Inertia::render('Storefront/Cart', ['site' => $this->siteData($site), 'theme' => $this->designTheme($site), 'navigation' => $this->navigation($site), 'items' => $items, 'subtotal_minor' => collect($items)->sum('total_minor'), 'cartCount' => $this->cartCount($cart, $site)]);
    }

    public function updateCart(Request $request, string $siteSlug, Product $product, StorefrontCart $cart)
    {
        $site = $this->store($siteSlug);
        abort_unless($product->site_id === $site->id, 404);
        $data = $request->validate(['quantity' => 'required|integer|min:0|max:99', 'variant_id' => 'nullable|integer']);
        $variant = filled($data['variant_id'] ?? null) ? $product->variants()->where('site_id', $site->id)->findOrFail($data['variant_id']) : null;
        if ($data['quantity'] > $product->stock_quantity) {
            return back()->with('error', 'Requested quantity is not available.');
        }
        $cart->put($site, $product, $data['quantity'], $variant);

        return back()->with('success', 'Cart updated.');
    }

    public function checkout(string $siteSlug, StorefrontCart $cart)
    {
        $site = $this->store($siteSlug);
        $items = $cart->items($site);
        if (! count($items)) {
            return redirect()->route('storefront.shop', $site->slug)->with('error', 'Your cart is empty.');
        }

        return Inertia::render('Storefront/Checkout', ['site' => $this->siteData($site), 'theme' => $this->designTheme($site), 'navigation' => $this->navigation($site), 'items' => $items, 'subtotal_minor' => collect($items)->sum('total_minor'), 'delivery_minor' => 0, 'cartCount' => $this->cartCount($cart, $site)]);
    }

    public function placeOrder(CheckoutRequest $request, string $siteSlug, StorefrontCart $cart)
    {
        $site = $this->store($siteSlug);
        $items = $cart->items($site);
        if (! count($items)) {
            return redirect()->route('storefront.shop', $site->slug)->with('error', 'Your cart is empty.');
        }
        $order = DB::transaction(function () use ($request, $site, $items) {
            foreach ($items as $item) {
                $product = Product::whereKey($item['product']['id'])->lockForUpdate()->firstOrFail();
                if ($product->stock_quantity < $item['quantity']) {
                    abort(422, "{$product->name} no longer has enough stock.");
                }
            }
            $customer = Customer::firstOrCreate(['site_id' => $site->id, 'phone' => $request->phone], ['name' => $request->name, 'email' => $request->email]);
            $subtotal = collect($items)->sum('total_minor');
            $order = Order::create(['site_id' => $site->id, 'customer_id' => $customer->id, 'number' => now()->format('ymd').'-'.Str::upper(Str::random(6)), 'channel' => 'online', 'status' => 'pending', 'payment_status' => 'unpaid', 'currency' => $site->currency, 'subtotal_minor' => $subtotal, 'delivery_minor' => 0, 'total_minor' => $subtotal, 'delivery_address' => ['name' => $request->name, 'phone' => $request->phone, 'email' => $request->email, 'address' => $request->address, 'city' => $request->city, 'notes' => $request->notes]]);
            foreach ($items as $item) {
                $product = Product::whereKey($item['product']['id'])->lockForUpdate()->firstOrFail();
                $order->items()->create(['site_id' => $site->id, 'product_id' => $product->id, 'name' => $product->name, 'sku' => $product->sku, 'quantity' => $item['quantity'], 'unit_price_minor' => $item['unit_price_minor'], 'total_minor' => $item['total_minor'], 'options' => $item['variant'] ? ['color' => $item['variant']['name'], 'variant_id' => $item['variant']['id']] : null]);
                $product->decrement('stock_quantity', $item['quantity']);
                $remaining = $item['quantity'];
                foreach (InventoryStock::where('site_id', $site->id)->where('product_id', $product->id)->where('quantity', '>', 0)->orderByDesc('quantity')->lockForUpdate()->get() as $stock) {
                    $deduct = min($stock->quantity, $remaining);
                    $stock->decrement('quantity', $deduct);
                    $remaining -= $deduct;
                    if ($remaining === 0) {
                        break;
                    }
                }
            }
            $order->events()->create(['site_id' => $site->id, 'from_status' => null, 'to_status' => 'pending', 'note' => 'Order placed through storefront']);
            Payment::create(['site_id' => $site->id, 'order_id' => $order->id, 'gateway' => 'cod', 'status' => 'pending', 'amount_minor' => $order->total_minor, 'currency' => $site->currency, 'idempotency_key' => (string) Str::uuid()]);

            return $order;
        });
        $cart->clear($site);
        request()->session()->put("storefront_order.{$site->id}", $order->id);

        return redirect()->route('storefront.confirmation', [$site->slug, $order->number]);
    }

    public function confirmation(string $siteSlug, string $number, Request $request)
    {
        $site = $this->store($siteSlug);
        $order = Order::where('site_id', $site->id)->where('number', $number)->findOrFail($request->session()->get("storefront_order.{$site->id}"));

        return Inertia::render('Storefront/Confirmation', ['site' => $this->siteData($site), 'theme' => $this->designTheme($site), 'navigation' => $this->navigation($site), 'order' => $order->only(['number', 'status', 'payment_status', 'currency', 'total_minor'])]);
    }

    private function store(string $slug): Site
    {
        return Site::where('slug', $slug)->where('type', 'store')->where('status', 'published')->with('theme')->firstOrFail();
    }

    private function siteData(Site $site): array
    {
        return data_get($site->published_design, 'profile', $site->only(['name', 'slug', 'locale', 'currency', 'phone', 'whatsapp', 'logo_path']));
    }

    private function designTheme(Site $site): array
    {
        $theme = data_get($site->published_design, 'theme', $site->theme?->settings ?? []);
        $theme = is_array($theme) ? $theme : [];

        // Older published snapshots stored the template beside the theme rather
        // than inside it. Keep storefront composition aligned with the public
        // website when those snapshots are rendered.
        $theme['template_slug'] = data_get(
            $site->published_design,
            'template_slug',
            $theme['template_slug'] ?? 'sajilo-launch',
        );

        return $theme;
    }

    private function navigation(Site $site): array
    {
        return data_get(
            $site->published_design,
            'navigation',
            $site->pages()->whereNotNull('published_version')->where('show_in_navigation', true)->get(['title', 'slug'])->toArray(),
        );
    }

    private function cartCount(StorefrontCart $cart, Site $site): int
    {
        return collect($cart->items($site))->sum('quantity');
    }
}
