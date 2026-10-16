<?php

namespace App\Actions;

use App\Models\AiGeneration;
use App\Models\Page;
use App\Models\Section;
use App\Models\Site;
use App\Services\Ai\AiDraftSnapshot;
use App\Services\Ai\AiRefinementGuard;
use App\Services\Ai\AiRefinementProposalValidator;
use App\Services\Ai\InvalidAiRefinementException;
use App\Services\Ai\StaleAiRefinementException;
use App\Support\ThemeContrast;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ApplyAiRefinement
{
    /** @var array<string, list<string>> */
    private const SECTION_CONTENT_KEYS = [
        'hero' => ['eyebrow', 'heading', 'body', 'primary_action', 'secondary_action'],
        'text' => ['eyebrow', 'heading', 'body'],
        'features' => ['eyebrow', 'heading', 'body', 'items'],
        'gallery' => ['eyebrow', 'heading', 'body', 'items'],
        'testimonials' => ['eyebrow', 'heading', 'body', 'items'],
        'faq' => ['eyebrow', 'heading', 'body', 'items'],
        'contact' => ['eyebrow', 'heading', 'body'],
        'map' => ['eyebrow', 'heading', 'body'],
        'cta' => ['eyebrow', 'heading', 'body', 'action'],
        'services' => ['eyebrow', 'heading', 'body', 'items'],
        'sectors' => ['eyebrow', 'heading', 'body', 'items'],
        'products' => ['eyebrow', 'heading', 'body'],
    ];

    public function __construct(
        private AiDraftSnapshot $snapshots,
        private AiRefinementProposalValidator $validator,
        private AiRefinementGuard $guard,
    ) {}

    /**
     * Atomically apply a previously proposed refinement to the draft only.
     * Published page versions are deliberately untouched.
     */
    public function handle(Site $site, AiGeneration $generation, int $userId): AiGeneration
    {
        $this->guard->assertCanManage($site, $userId);

        return DB::transaction(function () use ($site, $generation, $userId): AiGeneration {
            $lockedSite = Site::query()->whereKey($site->getKey())->lockForUpdate()->firstOrFail();
            $lockedGeneration = AiGeneration::query()
                ->whereKey($generation->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            if ((int) $lockedGeneration->site_id !== (int) $lockedSite->getKey()) {
                throw new InvalidAiRefinementException('The refinement does not belong to this website.');
            }

            // Recheck membership after obtaining workflow locks so revoked users
            // cannot apply an already-open proposal from another request.
            $this->guard->assertCanManage($lockedSite, $userId);

            if ($lockedGeneration->status === 'applied') {
                return $lockedGeneration;
            }

            if ($lockedGeneration->mode !== 'refinement' || $lockedGeneration->status !== 'proposed') {
                throw new InvalidAiRefinementException('Only a proposed refinement can be applied.');
            }

            $scope = (string) $lockedGeneration->scope;
            $pageId = $lockedGeneration->target_page_id ? (int) $lockedGeneration->target_page_id : null;
            $sectionId = $lockedGeneration->target_section_id ? (int) $lockedGeneration->target_section_id : null;
            $this->validateGenerationScope($scope, $pageId, $sectionId);

            $proposal = $this->validator->validate((array) $lockedGeneration->output);
            $targets = $this->resolveAndValidateTargets(
                $lockedSite,
                $proposal['operations'],
                $scope,
                $pageId,
                $sectionId,
            );

            $currentSnapshot = $this->snapshots->capture(
                $lockedSite,
                $scope,
                $pageId,
                $sectionId,
                lock: true,
            );
            $currentHash = $this->snapshots->hash($currentSnapshot);
            $baseHash = $lockedGeneration->base_hash;

            if (! is_string($baseHash) || strlen($baseHash) !== 64 || ! hash_equals($baseHash, $currentHash)) {
                throw new StaleAiRefinementException('The draft changed after this proposal was created. Generate a fresh refinement.');
            }

            foreach ($proposal['operations'] as $operation) {
                match ($operation['op']) {
                    'update_section' => $this->applySectionUpdate($targets['sections'][$operation['section_id']], $operation['content']),
                    'add_section' => $this->applySectionAddition($lockedSite, $targets['pages'][$operation['page_id']], $operation),
                    'update_theme' => $this->applyThemeUpdate($lockedSite, $operation['changes']),
                };
            }

            $lockedGeneration->forceFill([
                'status' => 'applied',
                'applied_at' => now(),
                'error' => null,
            ])->save();

            return $lockedGeneration->fresh();
        }, 3);
    }

    /**
     * @param  list<array<string, mixed>>  $operations
     * @return array{pages: array<int, Page>, sections: array<int, Section>}
     */
    private function resolveAndValidateTargets(
        Site $site,
        array $operations,
        string $scope,
        ?int $targetPageId,
        ?int $targetSectionId,
    ): array {
        $pages = [];
        $sections = [];

        foreach ($operations as $operation) {
            if ($operation['op'] === 'update_theme') {
                if ($scope !== 'site') {
                    throw new InvalidAiRefinementException('Theme changes require website scope.');
                }

                continue;
            }

            if ($operation['op'] === 'add_section') {
                if ($scope === 'section') {
                    throw new InvalidAiRefinementException('A section-scoped refinement cannot add sections.');
                }

                $operationPageId = (int) $operation['page_id'];
                $page = $pages[$operationPageId] ?? Page::query()
                    ->where('site_id', $site->getKey())
                    ->whereKey($operationPageId)
                    ->lockForUpdate()
                    ->first();

                if (! $page || ($scope === 'page' && $operationPageId !== $targetPageId)) {
                    throw new InvalidAiRefinementException('A refinement operation targets an invalid page.');
                }

                $pages[$operationPageId] = $page;

                continue;
            }

            $operationSectionId = (int) $operation['section_id'];
            $section = $sections[$operationSectionId] ?? Section::query()
                ->where('site_id', $site->getKey())
                ->whereKey($operationSectionId)
                ->lockForUpdate()
                ->first();

            if (! $section) {
                throw new InvalidAiRefinementException('A refinement operation targets an invalid section.');
            }

            if ($scope === 'page' && (int) $section->page_id !== $targetPageId) {
                throw new InvalidAiRefinementException('A refinement operation targets a section outside its page.');
            }

            if ($scope === 'section'
                && ((int) $section->getKey() !== $targetSectionId || (int) $section->page_id !== $targetPageId)) {
                throw new InvalidAiRefinementException('A refinement operation targets a different section.');
            }

            $this->validator->validateSectionPatch((string) $section->type, $operation['content']);

            $sections[$operationSectionId] = $section;
        }

        return ['pages' => $pages, 'sections' => $sections];
    }

    /** @param array<string, mixed> $content */
    private function applySectionUpdate(Section $section, array $content): void
    {
        $allowed = self::SECTION_CONTENT_KEYS[$section->type] ?? null;
        if (! $allowed || array_diff(array_keys($content), $allowed) !== []) {
            throw new InvalidAiRefinementException('A refinement contains fields that do not belong to its target section.');
        }

        $current = (array) $section->content;
        if (isset($content['items']) && is_array($content['items'])) {
            $existingItems = is_array($current['items'] ?? null) ? $current['items'] : [];
            $content['items'] = array_map(function (array $item, int $index) use ($existingItems): array {
                $existing = is_array($existingItems[$index] ?? null) ? $existingItems[$index] : [];

                foreach (['image', 'image_alt', 'image_style', 'title_color', 'description_color', 'title_font', 'description_font', 'title_style', 'description_style'] as $mediaKey) {
                    if (array_key_exists($mediaKey, $existing)) {
                        $item[$mediaKey] = $existing[$mediaKey];
                    }
                }

                return $item;
            }, $content['items'], array_keys($content['items']));
        }

        // Copy proposals may change only the section's declared text fields.
        // Owner-selected links, layouts and independent elements remain intact.
        $section->update(['content' => array_replace($current, $content)]);
    }

    /** @param array<string, mixed> $operation */
    private function applySectionAddition(Site $site, Page $page, array $operation): void
    {
        $sortOrder = (int) (Section::query()
            ->where('site_id', $site->getKey())
            ->where('page_id', $page->getKey())
            ->max('sort_order') ?? -1) + 1;

        $page->sections()->create([
            'site_id' => $site->getKey(),
            'key' => (string) Str::uuid(),
            'type' => $operation['type'],
            'content' => $operation['content'],
            'sort_order' => $sortOrder,
            'is_visible' => true,
        ]);
    }

    /** @param array<string, mixed> $changes */
    private function applyThemeUpdate(Site $site, array $changes): void
    {
        $theme = $site->theme()->lockForUpdate()->first();
        $settings = array_replace((array) $theme?->settings, $changes);

        if (isset($settings['background'], $settings['text'])
            && ThemeContrast::ratio($settings['background'], $settings['text']) < 4.5) {
            throw new InvalidAiRefinementException('The proposed theme does not provide accessible text contrast.');
        }

        if ($theme) {
            $theme->update(['settings' => $settings]);

            return;
        }

        $site->theme()->create(['settings' => $settings]);
    }

    private function validateGenerationScope(string $scope, ?int $pageId, ?int $sectionId): void
    {
        $valid = match ($scope) {
            'site' => $pageId === null && $sectionId === null,
            'page' => $pageId !== null && $sectionId === null,
            'section' => $pageId !== null && $sectionId !== null,
            default => false,
        };

        if (! $valid) {
            throw new InvalidAiRefinementException('The refinement has an invalid target scope.');
        }
    }
}
