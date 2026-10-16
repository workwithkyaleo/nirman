<?php

namespace App\Actions;

use App\Models\Site;
use Illuminate\Support\Facades\DB;

class PublishSite
{
    public function handle(Site $site, ?int $userId): void
    {
        DB::transaction(function () use ($site, $userId) {
            foreach ($site->pages()->with('sections')->get() as $page) {
                $version = ($page->versions()->max('version') ?? 0) + 1;
                $page->versions()->create(['site_id' => $site->id, 'created_by' => $userId, 'version' => $version, 'snapshot' => ['title' => $page->title, 'slug' => $page->slug, 'seo_title' => $page->seo_title, 'seo_description' => $page->seo_description, 'sections' => $page->sections->where('is_visible', true)->values()->map->only(['key', 'type', 'content'])->all()], 'published_at' => now()]);
                $page->update(['published_version' => $version]);
            }
            $site->loadMissing(['theme', 'template']);
            $site->update([
                'status' => 'published',
                'published_at' => now(),
                'published_design' => [
                    'template_slug' => $site->template?->slug ?? data_get($site->theme?->settings, 'template_slug'),
                    'theme' => $site->theme?->settings ?? [],
                    'navigation' => $site->pages()
                        ->whereNotNull('published_version')
                        ->where('show_in_navigation', true)
                        ->get(['title', 'slug'])
                        ->toArray(),
                    'profile' => $site->only([
                        'name',
                        'slug',
                        'type',
                        'locale',
                        'currency',
                        'phone',
                        'email',
                        'address',
                        'map_url',
                        'whatsapp',
                        'logo_path',
                        'social_links',
                        'business_hours',
                    ]),
                ],
            ]);
        });
    }
}
