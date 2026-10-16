<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveProductRequest;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Site;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index(Request $request, Site $site)
    {
        $this->authorize('manageStore', $site);
        abort_unless($site->type === 'store', 404);
        $products = $site->products()->with('category:id,name')->when($request->string('search')->toString(), fn ($q, $search) => $q->where(fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('sku', 'like', "%{$search}%")))->latest()->paginate(15)->withQueryString();

        return Inertia::render('Products/Index', [
            'site' => [
                ...$site->only(['id', 'name', 'type', 'currency']),
                'can_manage' => $request->user()->can('update', $site),
            ],
            'products' => $products,
            'filters' => $request->only('search'),
        ]);
    }

    public function create(Request $request, Site $site)
    {
        $this->authorize('manageStore', $site);
        abort_unless($site->type === 'store', 404);

        return Inertia::render('Products/Form', [
            'site' => [
                ...$site->only(['id', 'name', 'type', 'currency']),
                'can_manage' => $request->user()->can('update', $site),
            ],
            'product' => null,
            'categories' => ProductCategory::where('site_id', $site->id)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(SaveProductRequest $request, Site $site)
    {
        $this->authorize('manageStore', $site);
        abort_unless($site->type === 'store', 404);
        $this->persist($request, $site);

        return redirect()->route('products.index', $site)->with('success', 'Product added successfully.');
    }

    public function edit(Request $request, Site $site, Product $product)
    {
        $this->authorize('manageStore', $site);
        abort_unless($site->type === 'store', 404);
        abort_unless($product->site_id === $site->id, 404);

        return Inertia::render('Products/Form', [
            'site' => [
                ...$site->only(['id', 'name', 'type', 'currency']),
                'can_manage' => $request->user()->can('update', $site),
            ],
            'product' => $product->load(['category:id,name', 'variants:id,site_id,product_id,name,color_hex,image_path']),
            'categories' => ProductCategory::where('site_id', $site->id)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(SaveProductRequest $request, Site $site, Product $product)
    {
        $this->authorize('manageStore', $site);
        abort_unless($site->type === 'store', 404);
        abort_unless($product->site_id === $site->id, 404);
        $this->persist($request, $site, $product);

        return redirect()->route('products.index', $site)->with('success', 'Product updated.');
    }

    public function destroy(Site $site, Product $product)
    {
        $this->authorize('manageStore', $site);
        abort_unless($site->type === 'store', 404);
        abort_unless($product->site_id === $site->id, 404);
        $product->delete();

        return back()->with('success', 'Product moved to trash.');
    }

    private function persist(SaveProductRequest $request, Site $site, ?Product $product = null): Product
    {
        $data = $request->validated();

        return DB::transaction(function () use ($data, $request, $site, $product) {
            $category = null;
            if (! empty($data['category'])) {
                $category = ProductCategory::firstOrCreate(['site_id' => $site->id, 'slug' => Str::slug($data['category'])], ['name' => $data['category']]);
            }
            $slug = Str::slug($data['name']);
            if (! $product || $product->name !== $data['name']) {
                $slug = $slug.'-'.Str::lower(Str::random(4));
            }
            $priceMinor = $this->toMinor((string) $data['price']);
            $salePriceMinor = filled($data['sale_price'] ?? null) ? $this->toMinor((string) $data['sale_price']) : null;
            $values = ['site_id' => $site->id, 'product_category_id' => $category?->id, 'name' => $data['name'], 'slug' => $slug, 'sku' => $data['sku'] ?: null, 'description' => $data['description'] ?? null, 'price_minor' => $priceMinor, 'sale_price_minor' => $salePriceMinor !== null && $salePriceMinor < $priceMinor ? $salePriceMinor : null, 'stock_quantity' => $data['stock_quantity'], 'is_featured' => $data['is_featured'], 'is_active' => $data['is_active']];
            if ($request->hasFile('image')) {
                $values['image_path'] = $request->file('image')->store('products/'.$site->id, 'public');
            }
            if ($product) {
                $product->update($values);
            } else {
                $product = Product::create($values);
            }
            $this->syncColors($request, $site, $product, $data['colors'] ?? []);
            $location = $site->locations()->firstOrCreate(['code' => 'MAIN'], ['name' => 'Main location', 'type' => 'warehouse']);
            $current = (int) $location->stocks()->where('product_id', $product->id)->sum('quantity');
            $delta = (int) $data['stock_quantity'] - $current;
            if ($delta !== 0) {
                app(InventoryService::class)->adjust($location, $product, $delta, 'manual_adjustment', auth()->id());
            }

            return $product->fresh();
        });
    }

    private function syncColors(SaveProductRequest $request, Site $site, Product $product, array $colors): void
    {
        $kept = [];
        foreach ($colors as $index => $color) {
            $variant = isset($color['id'])
                ? $product->variants()->where('site_id', $site->id)->findOrFail($color['id'])
                : $product->variants()->make(['site_id' => $site->id]);
            $variant->fill([
                'name' => $color['name'],
                'color_hex' => $color['color_hex'] ?: null,
                'options' => ['color' => $color['name']],
                'stock_quantity' => $product->stock_quantity,
            ]);
            if ($request->hasFile("colors.{$index}.image")) {
                $oldImage = $variant->image_path;
                $variant->image_path = $request->file("colors.{$index}.image")->store('products/'.$site->id.'/colors', 'public');
                if ($oldImage) {
                    Storage::disk('public')->delete($oldImage);
                }
            }
            $variant->save();
            $kept[] = $variant->id;
        }

        $product->variants()->whereNotIn('id', $kept)->get()->each(function ($variant): void {
            if ($variant->image_path) {
                Storage::disk('public')->delete($variant->image_path);
            }
            $variant->delete();
        });
    }

    private function toMinor(string $amount): int
    {
        [$whole,$fraction] = array_pad(explode('.', trim($amount), 2), 2, '');

        return ((int) $whole * 100) + (int) str_pad(substr($fraction, 0, 2), 2, '0');
    }
}
