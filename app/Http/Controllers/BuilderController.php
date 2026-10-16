<?php

namespace App\Http\Controllers;

use App\Actions\ApplyAiRefinement;
use App\Actions\ApplyTemplate;
use App\Actions\CreateAiRefinement;
use App\Actions\GenerateWebsite;
use App\Actions\PublishSite;
use App\Actions\UpdateSection;
use App\Http\Requests\ApplyTemplateRequest;
use App\Http\Requests\CreateAiRefinementRequest;
use App\Http\Requests\UpdatePageRequest;
use App\Http\Requests\UpdateSectionRequest;
use App\Http\Requests\UpdateThemeRequest;
use App\Http\Requests\UploadSectionImageRequest;
use App\Models\AiGeneration;
use App\Models\Page;
use App\Models\Section;
use App\Models\Site;
use App\Models\Template;
use App\Services\Ai\InvalidAiRefinementException;
use App\Services\Ai\StaleAiRefinementException;
use App\Services\SectionMedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BuilderController extends Controller
{
    public function generate(Request $r, Site $site, GenerateWebsite $action)
    {
        $this->authorize('update', $site);
        try {
            $data = $r->validate(['prompt' => ['nullable', 'string', 'max:2000']]);
            $brief = array_merge($site->onboarding?->data ?? [], $data);
            $action->handle($site, $brief);
        } catch (\Throwable $exception) {
            report($exception);

            return back()->with('error', 'AI generation failed safely. Your existing draft was not changed. Please try again.');
        }

        return back()->with('success', 'Your website draft is ready.');
    }

    public function updateSection(UpdateSectionRequest $request, Site $site, Section $section, UpdateSection $action)
    {
        $data = $request->safe()->except(['section_image', 'item_images', 'element_images', 'items_empty', 'elements_empty']);
        if ($request->boolean('items_empty')) {
            $data['content']['items'] = [];
        }
        if ($request->boolean('elements_empty')) {
            $data['content']['elements'] = [];
        }
        $sectionImage = $request->file('section_image');
        $isHero = $section->type === 'hero';
        $action->handle(
            $site,
            $section,
            $data,
            $isHero ? null : $sectionImage,
            $request->file('item_images', []),
            $isHero ? $sectionImage : null,
            $request->file('element_images', []),
        );

        return back()->with('success', 'Section content and images saved.');
    }

    public function uploadSectionImage(UploadSectionImageRequest $request, Site $site, Section $section, UpdateSection $action)
    {
        $data = $request->validated();
        $target = $data['target'];
        $image = $request->file('image');
        $itemImages = $target === 'item' ? [$data['item_index'] => $image] : [];

        $action->handle(
            $site,
            $section,
            ['content' => $section->content],
            $target === 'section' ? $image : null,
            $itemImages,
            in_array($target, ['background', 'hero'], true) ? $image : null,
        );

        return back()->with('success', 'Image uploaded. Publish when you are ready.');
    }

    public function storeSection(Request $request, Site $site, Page $page)
    {
        $this->authorize('update', $site);
        abort_unless($page->site_id === $site->id, 404);
        $data = $request->validate(['type' => 'required|in:hero,text,features,gallery,testimonials,faq,contact,map,cta,services,sectors,products']);
        $defaults = ['hero' => ['eyebrow' => 'Welcome', 'heading' => 'A memorable headline', 'body' => 'Tell visitors why your business is worth choosing.', 'background_image' => '', 'primary_action' => 'Get started', 'secondary_action' => 'Learn more'], 'text' => ['heading' => 'Our story', 'body' => 'Share the people and purpose behind your business.'], 'features' => ['heading' => 'Why choose us', 'items' => [['title' => 'A key benefit', 'body' => 'Explain the value you provide.']]], 'gallery' => ['heading' => 'Our work', 'body' => 'Add images that show your business at its best.', 'items' => [['title' => 'Project or product', 'body' => 'Describe what visitors are seeing.', 'image' => '']]], 'testimonials' => ['heading' => 'What customers say', 'items' => [['title' => 'Happy customer', 'body' => 'Add a genuine customer story here.']]], 'faq' => ['heading' => 'Frequently asked questions', 'items' => [['title' => 'What should customers know?', 'body' => 'Add a clear, helpful answer.']]], 'contact' => ['heading' => 'Get in touch', 'body' => 'We would love to hear from you.'], 'map' => ['heading' => 'Visit us', 'body' => $site->address ?: 'Add your business address.'], 'cta' => ['heading' => 'Ready to get started?', 'body' => 'Contact us today.', 'action' => 'Contact us'], 'services' => ['heading' => 'What we offer', 'items' => [['title' => 'Service name', 'body' => 'Describe this service.']]], 'sectors' => ['heading' => 'Our business sectors', 'body' => 'Explore the industries and markets we serve.', 'items' => [['title' => 'Sector name', 'body' => 'Describe this business sector.', 'image' => '']]], 'products' => ['heading' => 'Featured products', 'body' => 'Explore our latest collection.']];
        $page->sections()->create(['site_id' => $site->id, 'key' => (string) Str::uuid(), 'type' => $data['type'], 'content' => $defaults[$data['type']], 'sort_order' => ($page->sections()->max('sort_order') ?? -1) + 1]);

        return back()->with('success', 'Section added.');
    }

    public function storePage(Request $request, Site $site)
    {
        $this->authorize('update', $site);
        $data = $request->validate(['title' => 'required|string|max:80']);
        $base = Str::slug($data['title']) ?: 'page';
        if (in_array($base, ['shop', 'cart', 'checkout', 'product', 'order'], true)) {
            $base .= '-page';
        }
        $slug = $base;
        $suffix = 2;
        while ($site->pages()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$suffix++;
        }
        $page = $site->pages()->create(['title' => $data['title'], 'slug' => $slug, 'sort_order' => ($site->pages()->max('sort_order') ?? -1) + 1]);
        $page->sections()->create(['site_id' => $site->id, 'key' => (string) Str::uuid(), 'type' => 'text', 'content' => ['heading' => $data['title'], 'body' => 'Add your content here.'], 'sort_order' => 0]);

        return back()->with('success', 'Page added.');
    }

    public function updatePage(UpdatePageRequest $request, Site $site, Page $page)
    {
        $this->authorize('update', $site);
        abort_unless($page->site_id === $site->id, 404);
        $page->update($request->validated());

        return back()->with('success', 'Page settings saved.');
    }

    public function destroyPage(Request $request, Site $site, Page $page)
    {
        $this->authorize('update', $site);
        abort_unless($page->site_id === $site->id, 404);
        abort_if($page->slug === 'home', 422, 'The home page cannot be deleted.');
        abort_if($page->published_version !== null, 422, 'Published pages cannot be deleted until unpublishing is supported. Hide it from navigation instead.');
        abort_if($site->pages()->count() <= 1, 422, 'A website needs at least one page.');
        $page->delete();

        return back()->with('success', 'Page removed from the draft.');
    }

    public function applyTemplate(ApplyTemplateRequest $request, Site $site, ApplyTemplate $action)
    {
        $this->authorize('update', $site);
        $template = Template::where('is_active', true)->findOrFail($request->integer('template_id'));
        $mode = $request->validated('mode', 'design');
        $action->handle($site, $template, $mode);

        $change = $mode === 'layout' ? 'design and home layout' : 'design';

        return back()->with('success', "{$template->name} {$change} applied to your draft. Publish when ready.");
    }

    public function createAiRefinement(CreateAiRefinementRequest $request, Site $site, CreateAiRefinement $action)
    {
        $this->authorize('update', $site);

        try {
            $action->handle($site, $request->user()->id, $request->validated());
        } catch (InvalidAiRefinementException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'AI prepared a draft proposal. Review it before applying.');
    }

    public function applyAiRefinement(Request $request, Site $site, AiGeneration $generation, ApplyAiRefinement $action)
    {
        $this->authorize('update', $site);
        abort_unless($generation->site_id === $site->id, 404);

        try {
            $action->handle($site, $generation, $request->user()->id);
        } catch (StaleAiRefinementException $exception) {
            $generation->update(['status' => 'stale', 'error' => $exception->getMessage()]);

            return back()->with('error', $exception->getMessage());
        } catch (InvalidAiRefinementException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'AI proposal applied to your draft. Publish when ready.');
    }

    public function destroyAiRefinement(Request $request, Site $site, AiGeneration $generation)
    {
        $this->authorize('update', $site);
        abort_unless($generation->site_id === $site->id, 404);
        abort_unless($generation->mode === 'refinement' && $generation->status === 'proposed', 422);
        $generation->update(['status' => 'cancelled']);

        return back()->with('success', 'AI proposal discarded.');
    }

    public function duplicateSection(Request $request, Site $site, Section $section)
    {
        $this->authorize('update', $site);
        abort_unless($section->site_id === $site->id, 404);
        DB::transaction(function () use ($section) {
            Section::where('page_id', $section->page_id)->where('sort_order', '>', $section->sort_order)->increment('sort_order');
            $copy = $section->replicate();
            $copy->key = (string) Str::uuid();
            $copy->sort_order = $section->sort_order + 1;
            $copy->save();
        });

        return back()->with('success', 'Section duplicated.');
    }

    public function destroySection(Request $request, Site $site, Section $section, SectionMedia $media)
    {
        $this->authorize('update', $site);
        abort_unless($section->site_id === $site->id, 404);
        $content = $section->content;
        $section->delete();

        try {
            $media->cleanupReplaced($site, (array) $content, []);
        } catch (\Throwable $exception) {
            report($exception);
        }

        return back()->with('success', 'Section removed.');
    }

    public function reorderSections(Request $request, Site $site, Page $page)
    {
        $this->authorize('update', $site);
        abort_unless($page->site_id === $site->id, 404);
        $data = $request->validate(['sections' => ['required', 'array'], 'sections.*' => ['required', 'integer', 'distinct']]);
        $expected = $page->sections()->pluck('id')->sort()->values()->all();
        $submitted = collect($data['sections'])->sort()->values()->all();
        abort_unless($expected === $submitted, 422, 'The complete section list is required.');
        DB::transaction(function () use ($page, $data) {
            foreach ($data['sections'] as $order => $id) {
                $page->sections()->whereKey($id)->update(['sort_order' => $order]);
            }
        });

        return back()->with('success', 'Section order saved.');
    }

    public function updateTheme(UpdateThemeRequest $request, Site $site)
    {
        $this->authorize('update', $site);
        $site->loadMissing('template');
        $settings = $site->template?->theme_defaults ?? [];

        foreach ($request->validated() as $key => $value) {
            $settings[$key] = $value;
        }

        $settings['template_slug'] = $site->template?->slug
            ?? data_get($site->theme?->settings, 'template_slug', 'sajilo-launch');
        $site->theme()->updateOrCreate([], ['settings' => $settings]);

        return back()->with('success', 'Theme updated everywhere.');
    }

    public function publish(Request $r, Site $site, PublishSite $action)
    {
        $this->authorize('update', $site);
        $action->handle($site, $r->user()->id);

        return back()->with('success', 'Website published.');
    }
}
