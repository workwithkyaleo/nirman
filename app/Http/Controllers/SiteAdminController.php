<?php

namespace App\Http\Controllers;

use App\Models\Section;
use App\Models\Site;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SiteAdminController extends Controller
{
    public function show(Request $request, Site $site): Response
    {
        $this->authorize('view', $site);

        $pages = $site->pages();
        $products = $site->products();
        $orders = $site->orders();
        $proposals = $site->aiGenerations()->where('mode', 'refinement');
        $proposalStatuses = (clone $proposals)
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        return Inertia::render('Sites/Admin', [
            'site' => [
                ...$site->only(['id', 'name', 'slug', 'type', 'status', 'currency', 'published_at']),
                'can_manage' => $request->user()->can('update', $site),
                'can_manage_store' => $site->type === 'store' && $request->user()->can('manageStore', $site),
            ],
            'stats' => [
                'pages' => (clone $pages)->count(),
                'published_pages' => (clone $pages)->whereNotNull('published_version')->count(),
                'sections' => Section::query()
                    ->where('site_id', $site->id)
                    ->whereHas('page')
                    ->count(),
                'products' => (clone $products)->count(),
                'orders' => (clone $orders)->count(),
                'revenue_minor' => (int) (clone $orders)
                    ->whereNotIn('status', ['cancelled', 'refunded'])
                    ->sum('total_minor'),
                'ai_proposals' => [
                    'total' => (int) $proposalStatuses->sum(),
                    'proposed' => (int) $proposalStatuses->get('proposed', 0),
                    'applied' => (int) $proposalStatuses->get('applied', 0),
                    'stale' => (int) $proposalStatuses->get('stale', 0),
                    'cancelled' => (int) $proposalStatuses->get('cancelled', 0),
                ],
            ],
            'recentOrders' => (clone $orders)
                ->latest('id')
                ->limit(6)
                ->get(['id', 'number', 'channel', 'status', 'payment_status', 'currency', 'total_minor', 'created_at']),
            'recentAi' => (clone $proposals)
                ->latest('id')
                ->limit(6)
                ->get(['id', 'status', 'scope', 'input', 'output', 'applied_at', 'created_at'])
                ->map(fn ($generation) => [
                    'id' => $generation->id,
                    'status' => $generation->status,
                    'scope' => $generation->scope,
                    'prompt' => data_get($generation->input, 'prompt'),
                    'summary' => data_get($generation->output, 'summary'),
                    'applied_at' => $generation->applied_at,
                    'created_at' => $generation->created_at,
                ])
                ->values(),
        ]);
    }
}
