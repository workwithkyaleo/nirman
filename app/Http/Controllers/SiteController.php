<?php

namespace App\Http\Controllers;

use App\Actions\GenerateWebsite;
use App\Http\Requests\StoreSiteRequest;
use App\Http\Requests\UpdateSiteRequest;
use App\Models\Site;
use App\Models\Template;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SiteController extends Controller
{
    public function dashboard(Request $r)
    {
        $sites = $r->user()->sites()->withCount(['products', 'orders'])->get();

        return Inertia::render('Dashboard', ['sites' => $sites]);
    }

    public function create(Request $request)
    {
        $selectedTemplateId = $request->integer('template');

        return Inertia::render('Onboarding/Create', [
            'templates' => Template::where('is_active', true)->orderBy('id')->get()->map(fn (Template $template) => [
                'id' => $template->id,
                'name' => $template->name,
                'slug' => $template->slug,
                'category' => $template->category,
                'description' => data_get($template->blueprint, 'description', str($template->category)->append(' website')->toString()),
                'sections' => data_get($template->blueprint, 'home_sections', []),
                'theme' => $template->theme_defaults,
            ]),
            'selectedTemplateId' => Template::where('is_active', true)->whereKey($selectedTemplateId)->exists()
                ? $selectedTemplateId
                : null,
        ]);
    }

    public function store(StoreSiteRequest $r)
    {
        $data = $r->validated();
        $template = Template::where('is_active', true)->findOrFail($data['template_id']);
        $site = DB::transaction(function () use ($data, $r, $template) {
            $site = Site::create([
                'name' => $data['name'], 'type' => $data['type'], 'category' => $data['category'],
                'template_id' => $template->id,
                'description' => $data['description'], 'slug' => Str::slug($data['name']).'-'.Str::lower(Str::random(4)),
                'address' => $data['address'], 'map_url' => $data['map_url'] ?? null, 'phone' => $data['phone'],
                'email' => $data['email'], 'whatsapp' => $data['whatsapp'] ?? null, 'currency' => $data['currency'],
                'locale' => $data['language'], 'social_links' => array_filter(['facebook' => $data['facebook'] ?? null, 'instagram' => $data['instagram'] ?? null, 'tiktok' => $data['tiktok'] ?? null, 'website' => $data['website'] ?? null]),
                'business_hours' => ['display' => $data['opening_hours'] ?? null],
                'logo_path' => $r->file('logo')?->store('site-logos', 'public'),
            ]);
            $site->users()->attach($r->user(), ['role' => 'owner']);
            $site->onboarding()->create(['step' => 5, 'completed_at' => now(), 'data' => collect($data)->except(['logo'])->all()]);
            $site->theme()->create(['settings' => [
                ...$template->theme_defaults,
                'primary' => $data['primary'],
                'secondary' => $data['secondary'],
                'accent' => $data['accent'],
            ]]);

            return $site;
        });

        app(GenerateWebsite::class)->handle($site, $data);

        return redirect()->route('sites.edit', $site)->with('success', 'Your complete website draft is ready.');
    }

    public function edit(Request $r, Site $site)
    {
        $this->authorize('view', $site);
        $requestedPanel = $r->string('panel')->toString();
        $initialPanel = in_array($requestedPanel, ['add', 'layers', 'pages', 'content', 'uploads', 'design', 'templates', 'ai', 'settings'], true)
            ? $requestedPanel
            : 'content';

        return Inertia::render('Sites/Edit', [
            'site' => $site->load(['pages.sections', 'theme', 'template']),
            'previewProducts' => $site->type === 'store'
                ? $site->products()
                    ->where('is_active', true)
                    ->orderByDesc('is_featured')
                    ->latest()
                    ->limit(24)
                    ->get([
                        'id', 'name', 'slug', 'description', 'image_path',
                        'price_minor', 'sale_price_minor', 'stock_quantity', 'is_featured',
                    ])
                : [],
            'templates' => Template::where('is_active', true)->orderBy('id')->get()->map(fn (Template $template) => [
                'id' => $template->id,
                'name' => $template->name,
                'slug' => $template->slug,
                'category' => $template->category,
                'sections' => data_get($template->blueprint, 'home_sections', []),
                'theme' => $template->theme_defaults,
            ]),
            'aiGenerations' => $site->aiGenerations()
                ->where('mode', 'refinement')
                ->latest()
                ->limit(8)
                ->get()
                ->map(fn ($generation) => [
                    'id' => $generation->id,
                    'status' => $generation->status,
                    'scope' => $generation->scope,
                    'prompt' => data_get($generation->input, 'prompt'),
                    'summary' => data_get($generation->output, 'summary'),
                    'created_at' => $generation->created_at,
                ]),
            'canManage' => $r->user()->can('update', $site),
            'canManageStore' => $site->type === 'store' && $r->user()->can('manageStore', $site),
            'initialPanel' => $initialPanel,
        ]);
    }

    public function update(UpdateSiteRequest $request, Site $site)
    {
        $this->authorize('update', $site);
        $data = $request->validated();
        $site->update([
            ...collect($data)->only(['name', 'description', 'phone', 'email', 'address', 'map_url', 'whatsapp'])->all(),
            'business_hours' => ['display' => $data['opening_hours'] ?? null],
            'social_links' => array_filter(collect($data)->only(['facebook', 'instagram', 'tiktok', 'website'])->all()),
        ]);

        return back()->with('success', 'Business settings saved.');
    }

    public function uploadLogo(Request $request, Site $site)
    {
        $this->authorize('update', $site);
        $request->validate(['logo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp,svg', 'max:3072']]);
        $path = $request->file('logo')->store('site-logos', 'public');
        $site->update(['logo_path' => $path]);

        return back()->with('success', 'Logo updated. Publish to show it on your live website.');
    }
}
