<?php

namespace App\Http\Controllers;

use App\Models\Site;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SiteSettingsController extends Controller
{
    public function show(Request $request, Site $site): Response
    {
        $this->authorize('update', $site);

        return Inertia::render('Sites/Settings', [
            'site' => [
                ...$site->only([
                    'id', 'name', 'slug', 'type', 'status', 'currency',
                    'description', 'phone', 'email', 'address', 'map_url',
                    'whatsapp', 'logo_path', 'published_at',
                ]),
                'business_hours' => $site->business_hours,
                'social_links'   => $site->social_links,
                'seo'            => $site->seo ?? [],
                'notifications'  => $site->notifications_settings ?? [],
                'can_manage'       => $request->user()->can('update', $site),
                'can_manage_store' => $site->type === 'store' && $request->user()->can('manageStore', $site),
            ],
            'members' => $site->users()
                ->get()
                ->map(fn ($u) => [
                    'id'    => $u->id,
                    'name'  => $u->name,
                    'email' => $u->email,
                    'role'  => $u->pivot->role,
                ]),
        ]);
    }

    public function update(Request $request, Site $site): RedirectResponse
    {
        $this->authorize('update', $site);

        $data = $request->validate([
            'section'               => ['required', 'string'],
            // general
            'name'                  => ['sometimes', 'string', 'max:120'],
            'description'           => ['sometimes', 'nullable', 'string', 'max:1500'],
            'currency'              => ['sometimes', 'string', 'size:3'],
            // contact
            'phone'                 => ['sometimes', 'nullable', 'string', 'max:30'],
            'email'                 => ['sometimes', 'nullable', 'email', 'max:120'],
            'whatsapp'              => ['sometimes', 'nullable', 'string', 'max:30'],
            'address'               => ['sometimes', 'nullable', 'string', 'max:400'],
            'map_url'               => ['sometimes', 'nullable', 'url', 'max:500'],
            'opening_hours'         => ['sometimes', 'nullable', 'string', 'max:200'],
            // social
            'facebook'              => ['sometimes', 'nullable', 'url', 'max:300'],
            'instagram'             => ['sometimes', 'nullable', 'url', 'max:300'],
            'tiktok'                => ['sometimes', 'nullable', 'url', 'max:300'],
            'youtube'               => ['sometimes', 'nullable', 'url', 'max:300'],
            'linkedin'              => ['sometimes', 'nullable', 'url', 'max:300'],
            'twitter'               => ['sometimes', 'nullable', 'url', 'max:300'],
            'website'               => ['sometimes', 'nullable', 'url', 'max:300'],
            // seo
            'seo.meta_title'        => ['sometimes', 'nullable', 'string', 'max:70'],
            'seo.meta_description'  => ['sometimes', 'nullable', 'string', 'max:160'],
            'seo.og_title'          => ['sometimes', 'nullable', 'string', 'max:95'],
            'seo.og_description'    => ['sometimes', 'nullable', 'string', 'max:200'],
            'seo.google_analytics'  => ['sometimes', 'nullable', 'string', 'max:30'],
            'seo.facebook_pixel'    => ['sometimes', 'nullable', 'string', 'max:30'],
            'seo.robots'            => ['sometimes', 'nullable', Rule::in(['index,follow', 'noindex,nofollow', 'noindex,follow', 'index,nofollow'])],
            // notifications
            'notifications.order_email'   => ['sometimes', 'boolean'],
            'notifications.enquiry_email' => ['sometimes', 'boolean'],
            'notifications.digest_email'  => ['sometimes', 'boolean'],
        ]);

        $section = $data['section'];
        unset($data['section']);

        match ($section) {
            'general' => $site->update(array_filter([
                'name'        => $data['name'] ?? null,
                'description' => $data['description'] ?? null,
                'currency'    => $data['currency'] ?? null,
            ], fn ($v) => $v !== null)),

            'contact' => $site->update([
                'phone'    => $data['phone'] ?? null,
                'email'    => $data['email'] ?? null,
                'whatsapp' => $data['whatsapp'] ?? null,
                'address'  => $data['address'] ?? null,
                'map_url'  => $data['map_url'] ?? null,
                'business_hours' => array_merge($site->business_hours ?? [], [
                    'display' => $data['opening_hours'] ?? null,
                ]),
            ]),

            'social' => $site->update([
                'social_links' => array_merge($site->social_links ?? [], [
                    'facebook'  => $data['facebook']  ?? null,
                    'instagram' => $data['instagram'] ?? null,
                    'tiktok'    => $data['tiktok']    ?? null,
                    'youtube'   => $data['youtube']   ?? null,
                    'linkedin'  => $data['linkedin']  ?? null,
                    'twitter'   => $data['twitter']   ?? null,
                    'website'   => $data['website']   ?? null,
                ]),
            ]),

            'seo' => $site->update([
                'seo' => array_merge($site->seo ?? [], $data['seo'] ?? []),
            ]),

            'notifications' => $site->update([
                'notifications_settings' => array_merge(
                    $site->notifications_settings ?? [],
                    $data['notifications'] ?? []
                ),
            ]),

            default => null,
        };

        return back()->with('success', ucfirst($section) . ' settings saved.');
    }

    public function uploadLogo(Request $request, Site $site): RedirectResponse
    {
        $this->authorize('update', $site);
        $request->validate(['logo' => ['required', 'image', 'max:3072']]);

        if ($site->logo_path) {
            Storage::disk('public')->delete($site->logo_path);
        }

        $path = $request->file('logo')->store("logos/{$site->id}", 'public');
        $site->update(['logo_path' => $path]);

        return back()->with('success', 'Logo updated.');
    }
}
