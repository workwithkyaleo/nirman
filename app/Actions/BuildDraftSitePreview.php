<?php

namespace App\Actions;

use App\Models\Page;
use App\Models\Section;
use App\Models\Site;

class BuildDraftSitePreview
{
    /** @return array<string, mixed> */
    public function handle(Site $site, ?string $pageSlug = null): array
    {
        $site->loadMissing(['theme', 'template']);

        $page = $site->pages()
            ->where('slug', $pageSlug ?: 'home')
            ->with(['sections' => fn ($query) => $query
                ->where('site_id', $site->id)
                ->where('is_visible', true)])
            ->firstOrFail();

        $theme = $site->theme?->settings ?? [];

        return [
            'site' => $site->only([
                'id',
                'name',
                'slug',
                'type',
                'category',
                'description',
                'currency',
                'locale',
                'phone',
                'email',
                'address',
                'map_url',
                'whatsapp',
                'logo_path',
                'social_links',
                'business_hours',
            ]),
            'theme' => $theme,
            'template' => $site->template?->slug ?? data_get($theme, 'template_slug', 'sajilo-launch'),
            'page' => $this->pageData($page),
            'navigation' => $site->pages()
                ->where('show_in_navigation', true)
                ->get(['title', 'slug'])
                ->map->only(['title', 'slug'])
                ->values()
                ->all(),
            'products' => $site->type === 'store'
                ? $site->products()
                    ->where('is_active', true)
                    ->orderByDesc('is_featured')
                    ->latest()
                    ->limit(24)
                    ->get([
                        'id',
                        'name',
                        'slug',
                        'description',
                        'image_path',
                        'price_minor',
                        'sale_price_minor',
                        'stock_quantity',
                        'is_featured',
                    ])
                : [],
            'isPreview' => true,
        ];
    }

    /** @return array<string, mixed> */
    private function pageData(Page $page): array
    {
        return [
            ...$page->only(['title', 'slug', 'seo_title', 'seo_description']),
            'sections' => $page->sections
                ->map(fn (Section $section) => $section->only(['key', 'type', 'content']))
                ->values()
                ->all(),
        ];
    }
}
