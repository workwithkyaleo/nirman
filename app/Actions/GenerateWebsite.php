<?php

namespace App\Actions;

use App\Models\AiGeneration;
use App\Models\Page;
use App\Models\Site;
use App\Services\Ai\WebsiteGenerator;
use App\Services\SectionMedia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GenerateWebsite
{
    private const SECTION_TYPES = ['hero', 'text', 'services', 'sectors', 'features', 'gallery', 'testimonials', 'faq', 'contact', 'map', 'cta', 'products'];

    public function __construct(private WebsiteGenerator $generator, private SectionMedia $media) {}

    public function handle(Site $site, array $brief = []): void
    {
        $generation = AiGeneration::create(['site_id' => $site->id, 'user_id' => auth()->id(), 'provider' => 'local', 'mode' => 'initial', 'status' => 'processing', 'input' => $brief, 'attempts' => 1]);
        try {
            $output = $this->generator->generate($site, $brief);
            throw_unless(isset($output['pages']) && is_array($output['pages']) && count($output['pages']) > 0 && count($output['pages']) <= 20, \UnexpectedValueException::class, 'The AI provider returned an invalid website structure.');
            $slugs = [];
            foreach ($output['pages'] as $page) {
                throw_unless(isset($page['title'], $page['slug'], $page['sections']) && is_string($page['title']) && mb_strlen($page['title']) <= 80 && is_string($page['slug']) && preg_match('/^[a-z0-9-]+$/', $page['slug']) && is_array($page['sections']) && count($page['sections']) <= 30, \UnexpectedValueException::class, 'The AI provider returned an invalid page structure.');
                throw_if(in_array($page['slug'], $slugs, true), \UnexpectedValueException::class, 'The AI provider returned duplicate page slugs.');
                $slugs[] = $page['slug'];
                foreach ($page['sections'] as $section) {
                    throw_unless(isset($section['type'], $section['content']) && in_array($section['type'], self::SECTION_TYPES, true) && is_array($section['content']) && strlen(json_encode($section['content'], JSON_THROW_ON_ERROR)) <= 30000, \UnexpectedValueException::class, 'The AI provider returned an invalid section.');
                }
            }
            $replacedContent = [];
            DB::transaction(function () use ($site, $output, $generation, &$replacedContent) {
                foreach ($output['pages'] as $pi => $data) {
                    $page = Page::updateOrCreate(['site_id' => $site->id, 'slug' => $data['slug']], ['title' => $data['title'], 'sort_order' => $pi, 'seo_title' => $output['seo']['title'] ?? null, 'seo_description' => $output['seo']['description'] ?? null]);
                    array_push($replacedContent, ...$page->sections()->get(['content'])->pluck('content')->all());
                    $page->sections()->delete();
                    foreach ($data['sections'] as $i => $section) {
                        $page->sections()->create(['site_id' => $site->id, 'key' => (string) Str::uuid(), 'type' => $section['type'], 'content' => $section['content'], 'sort_order' => $i]);
                    }
                }
                $generation->update(['status' => 'completed', 'output' => $output]);
            });

            foreach ($replacedContent as $content) {
                try {
                    $this->media->cleanupReplaced($site, (array) $content, []);
                } catch (\Throwable $exception) {
                    report($exception);
                }
            }
        } catch (\Throwable $exception) {
            $generation->update(['status' => 'failed', 'error' => str($exception->getMessage())->limit(1000)]);
            throw $exception;
        }
    }
}
