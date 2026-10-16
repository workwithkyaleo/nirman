<?php

namespace App\Actions;

use App\Models\Page;
use App\Models\Section;
use App\Models\Site;
use App\Models\Template;
use App\Support\TemplateLayout;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ApplyTemplate
{
    public function __construct(private TemplateLayout $layouts) {}

    public function handle(Site $site, Template $template, string $mode = 'design'): void
    {
        abort_unless(in_array($mode, ['design', 'layout'], true), 422, 'The template mode is invalid.');

        DB::transaction(function () use ($site, $template, $mode) {
            $lockedSite = Site::query()->whereKey($site->getKey())->lockForUpdate()->firstOrFail();
            $lockedTemplate = Template::query()->whereKey($template->getKey())->lockForUpdate()->firstOrFail();
            abort_unless($lockedTemplate->is_active, 422, 'This template is no longer available.');

            $lockedSite->update(['template_id' => $lockedTemplate->getKey()]);
            $theme = $lockedSite->theme()->lockForUpdate()->first();
            if ($theme) {
                $theme->update(['settings' => $lockedTemplate->theme_defaults]);
            } else {
                $lockedSite->theme()->create(['settings' => $lockedTemplate->theme_defaults]);
            }

            if ($mode === 'layout') {
                $this->applyHomeLayout($lockedSite, $lockedTemplate);
            }
        }, 3);
    }

    private function applyHomeLayout(Site $site, Template $template): void
    {
        $home = Page::query()
            ->where('site_id', $site->getKey())
            ->where('slug', 'home')
            ->lockForUpdate()
            ->first();
        abort_unless($home, 422, 'A home page is required before applying a template layout.');

        $desiredTypes = $this->layouts->homeSectionTypes($template);
        abort_if($desiredTypes === [], 422, 'This template does not contain a supported home layout.');

        $remaining = Section::query()
            ->where('site_id', $site->getKey())
            ->where('page_id', $home->getKey())
            ->orderBy('sort_order')
            ->orderBy('id')
            ->lockForUpdate()
            ->get();
        $ordered = collect();

        foreach ($desiredTypes as $type) {
            $matching = $remaining->first(fn (Section $section) => $section->type === $type);

            if ($matching) {
                $remaining = $remaining
                    ->reject(fn (Section $section) => $section->is($matching))
                    ->values();
                $ordered->push($matching);

                continue;
            }

            $ordered->push($home->sections()->create([
                'site_id' => $site->getKey(),
                'key' => (string) Str::uuid(),
                'type' => $type,
                'content' => $this->layouts->defaultContent($type, $site),
                'sort_order' => $ordered->count(),
                'is_visible' => true,
            ]));
        }

        $ordered = $ordered->concat($remaining)->values();
        foreach ($ordered as $sortOrder => $section) {
            if ((int) $section->sort_order !== $sortOrder) {
                $section->update(['sort_order' => $sortOrder]);
            }
        }
    }
}
