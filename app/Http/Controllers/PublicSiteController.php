<?php

namespace App\Http\Controllers;

use App\Models\Site;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PublicSiteController extends Controller
{
    public function show(Request $r, string $siteSlug, ?string $pageSlug = null)
    {
        $site = Site::where('slug', $siteSlug)->where('status', 'published')->with('theme')->firstOrFail();
        $page = $site->pages()->where('slug', $pageSlug ?? 'home')->firstOrFail();
        abort_if(! $page->published_version, 404);
        $version = $page->versions()->where('version', $page->published_version)->firstOrFail();

        return Inertia::render('Public/Site', [
            'site' => data_get($site->published_design, 'profile', $site->only(['name', 'slug', 'type', 'locale', 'currency', 'phone', 'email', 'address', 'map_url', 'whatsapp', 'logo_path', 'social_links', 'business_hours'])),
            'theme' => data_get($site->published_design, 'theme', $site->theme?->settings),
            'template' => data_get($site->published_design, 'template_slug', data_get($site->theme?->settings, 'template_slug', 'sajilo-launch')),
            'page' => $version->snapshot,
            'navigation' => data_get($site->published_design, 'navigation', $site->pages()->whereNotNull('published_version')->where('show_in_navigation', true)->get(['title', 'slug'])->toArray()),
            'products' => $site->type === 'store' ? $site->products()->where('is_active', true)->orderByDesc('is_featured')->latest()->limit(24)->get(['id', 'name', 'slug', 'description', 'image_path', 'price_minor', 'sale_price_minor', 'stock_quantity', 'is_featured']) : [],
        ]);
    }
}
