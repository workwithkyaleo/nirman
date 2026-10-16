<?php

namespace App\Http\Controllers;

use App\Actions\BuildDraftSitePreview;
use App\Models\Site;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SiteDraftPreviewController extends Controller
{
    public function __construct(private readonly BuildDraftSitePreview $buildPreview) {}

    public function show(Site $site, ?string $pageSlug = null): Response
    {
        $this->authorize('view', $site);

        return Inertia::render('Public/Site', $this->buildPreview->handle($site, $pageSlug));
    }

    public function shop(Site $site, Request $request): Response
    {
        $this->authorize('view', $site);
        abort_unless($site->type === 'store', 404);

        $products = $site->products()
            ->where('is_active', true)
            ->with('category:id,name')
            ->when($request->string('search')->toString(), fn ($query, $search) => $query->where('name', 'like', "%{$search}%"))
            ->orderByDesc('is_featured')
            ->latest()
            ->paginate(16)
            ->withQueryString();

        return Inertia::render('Storefront/Shop', [
            ...$this->storefrontData($site),
            'products' => $products,
            'filters' => $request->only('search'),
        ]);
    }

    public function product(Site $site, string $productSlug): Response
    {
        $this->authorize('view', $site);
        abort_unless($site->type === 'store', 404);
        $product = $site->products()->where('slug', $productSlug)->where('is_active', true)->with(['category:id,name', 'variants:id,product_id,name,color_hex,image_path'])->firstOrFail();

        return Inertia::render('Storefront/Product', [
            ...$this->storefrontData($site),
            'product' => $product,
        ]);
    }

    /** @return array<string, mixed> */
    private function storefrontData(Site $site): array
    {
        $site->loadMissing(['theme', 'template']);
        $theme = $site->theme?->settings ?? [];
        $theme['template_slug'] = $site->template?->slug ?? data_get($theme, 'template_slug', 'sajilo-launch');

        return [
            'site' => $site->only(['id', 'name', 'slug', 'locale', 'currency', 'phone', 'whatsapp', 'logo_path']),
            'theme' => $theme,
            'cartCount' => 0,
            'navigation' => $site->pages()->where('show_in_navigation', true)->get(['title', 'slug'])->toArray(),
            'isPreview' => true,
        ];
    }
}
