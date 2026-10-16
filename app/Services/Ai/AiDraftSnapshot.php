<?php

namespace App\Services\Ai;

use App\Models\Page;
use App\Models\Section;
use App\Models\Site;
use App\Models\Theme;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class AiDraftSnapshot
{
    /**
     * Capture only structured, editable draft data. The returned `draft` value
     * is the concurrency boundary; `context` is read-only input for copywriting.
     *
     * @return array<string, mixed>
     */
    public function capture(
        Site $site,
        string $scope,
        ?int $pageId = null,
        ?int $sectionId = null,
        bool $lock = false,
    ): array {
        if (! in_array($scope, ['site', 'page', 'section'], true)) {
            throw new InvalidAiRefinementException('The refinement scope is invalid.');
        }

        $siteQuery = Site::query()->whereKey($site->getKey());
        $freshSite = $this->withLock($siteQuery, $lock)->firstOrFail();
        $context = [
            'site' => [
                'id' => $freshSite->getKey(),
                'name' => $freshSite->name,
                'type' => $freshSite->type,
                'category' => $freshSite->category,
                'description' => $freshSite->description,
                'locale' => $freshSite->locale,
            ],
        ];

        return match ($scope) {
            'site' => $this->captureSite($freshSite, $context, $lock),
            'page' => $this->capturePage($freshSite, $context, $pageId, $lock),
            'section' => $this->captureSection($freshSite, $context, $pageId, $sectionId, $lock),
        };
    }

    /**
     * @param  array<string, mixed>  $snapshot
     */
    public function hash(array $snapshot): string
    {
        if (! array_key_exists('draft', $snapshot)) {
            throw new InvalidAiRefinementException('The draft snapshot is incomplete.');
        }

        return hash('sha256', json_encode(
            $this->canonicalize($snapshot['draft']),
            JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION,
        ));
    }

    /**
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    private function captureSite(Site $site, array $context, bool $lock): array
    {
        $pagesQuery = Page::query()
            ->where('site_id', $site->getKey())
            ->orderBy('sort_order')
            ->orderBy('id');
        $pages = $this->withLock($pagesQuery, $lock)->get();
        $sections = $this->sectionsForPages($site, $pages, $lock);

        $themeQuery = Theme::query()->where('site_id', $site->getKey());
        $theme = $this->withLock($themeQuery, $lock)->first();

        return [
            'scope' => 'site',
            'target_page_id' => null,
            'target_section_id' => null,
            'context' => $context,
            'draft' => [
                'theme' => $theme?->settings,
                'pages' => $pages->map(fn (Page $page) => $this->pageData(
                    $page,
                    $sections->get($page->getKey(), collect()),
                ))->values()->all(),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    private function capturePage(Site $site, array $context, ?int $pageId, bool $lock): array
    {
        if (! $pageId) {
            throw new InvalidAiRefinementException('A page is required for this refinement scope.');
        }

        $pageQuery = Page::query()
            ->where('site_id', $site->getKey())
            ->whereKey($pageId);
        $page = $this->withLock($pageQuery, $lock)->firstOrFail();
        $sections = $this->sectionsForPages($site, collect([$page]), $lock)->get($page->getKey(), collect());

        return [
            'scope' => 'page',
            'target_page_id' => $page->getKey(),
            'target_section_id' => null,
            'context' => $context,
            'draft' => ['page' => $this->pageData($page, $sections)],
        ];
    }

    /**
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    private function captureSection(
        Site $site,
        array $context,
        ?int $pageId,
        ?int $sectionId,
        bool $lock,
    ): array {
        if (! $pageId || ! $sectionId) {
            throw new InvalidAiRefinementException('A page and section are required for this refinement scope.');
        }

        $pageQuery = Page::query()
            ->where('site_id', $site->getKey())
            ->whereKey($pageId);
        $page = $this->withLock($pageQuery, $lock)->firstOrFail();

        $sectionQuery = Section::query()
            ->where('site_id', $site->getKey())
            ->where('page_id', $page->getKey())
            ->whereKey($sectionId);
        $section = $this->withLock($sectionQuery, $lock)->firstOrFail();

        return [
            'scope' => 'section',
            'target_page_id' => $page->getKey(),
            'target_section_id' => $section->getKey(),
            'context' => $context,
            'page' => [
                'id' => $page->getKey(),
                'title' => $page->title,
                'slug' => $page->slug,
            ],
            'draft' => ['section' => $this->sectionData($section)],
        ];
    }

    /**
     * @param  Collection<int, Page>  $pages
     * @return Collection<int, Collection<int, Section>>
     */
    private function sectionsForPages(Site $site, Collection $pages, bool $lock): Collection
    {
        if ($pages->isEmpty()) {
            return collect();
        }

        $query = Section::query()
            ->where('site_id', $site->getKey())
            ->whereIn('page_id', $pages->map(fn (Page $page) => $page->getKey())->all())
            ->orderBy('page_id')
            ->orderBy('sort_order')
            ->orderBy('id');

        return $this->withLock($query, $lock)->get()->groupBy('page_id');
    }

    /**
     * @param  Collection<int, Section>  $sections
     * @return array<string, mixed>
     */
    private function pageData(Page $page, Collection $sections): array
    {
        return [
            'id' => $page->getKey(),
            'title' => $page->title,
            'slug' => $page->slug,
            'seo_title' => $page->seo_title,
            'seo_description' => $page->seo_description,
            'show_in_navigation' => (bool) $page->show_in_navigation,
            'sort_order' => (int) $page->sort_order,
            'sections' => $sections->map(fn (Section $section) => $this->sectionData($section))->values()->all(),
        ];
    }

    /** @return array<string, mixed> */
    private function sectionData(Section $section): array
    {
        return [
            'id' => $section->getKey(),
            'page_id' => $section->page_id,
            'key' => $section->key,
            'type' => $section->type,
            'content' => $section->content,
            'is_visible' => (bool) $section->is_visible,
            'sort_order' => (int) $section->sort_order,
        ];
    }

    private function withLock(Builder $query, bool $lock): Builder
    {
        return $lock ? $query->lockForUpdate() : $query;
    }

    private function canonicalize(mixed $value): mixed
    {
        if (! is_array($value)) {
            return $value;
        }

        if (array_is_list($value)) {
            return array_map(fn (mixed $item) => $this->canonicalize($item), $value);
        }

        ksort($value, SORT_STRING);

        foreach ($value as $key => $item) {
            $value[$key] = $this->canonicalize($item);
        }

        return $value;
    }
}
