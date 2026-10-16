<?php

namespace App\Http\Controllers;

use App\Models\InventoryMovement;
use App\Models\InventoryStock;
use App\Models\Site;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CommerceHubController extends Controller
{
    public function show(Request $request, Site $site)
    {
        $this->authorize('manageStore', $site);
        abort_unless($site->type === 'store', 404);

        $orders = $site->orders();
        $channelTotals = (clone $orders)->selectRaw('channel, count(*) as orders, coalesce(sum(total_minor), 0) as revenue_minor')->groupBy('channel')->get();

        return Inertia::render('Commerce/Hub', [
            'site' => [
                ...$site->only(['id', 'name', 'type', 'currency']),
                'can_manage' => $request->user()->can('update', $site),
            ],
            'metrics' => [
                'revenue_minor' => (clone $orders)->whereNotIn('status', ['cancelled', 'refunded'])->sum('total_minor'),
                'orders' => (clone $orders)->count(),
                'pending' => (clone $orders)->where('status', 'pending')->count(),
                'low_stock' => InventoryStock::where('site_id', $site->id)->whereColumn('quantity', '<=', 'reorder_level')->count(),
            ],
            'channels' => $channelTotals,
            'stock' => InventoryStock::where('site_id', $site->id)->with(['product:id,name,sku', 'location:id,name'])->orderBy('quantity')->limit(12)->get(),
            'movements' => InventoryMovement::where('site_id', $site->id)->with(['product:id,name'])->latest()->limit(8)->get(),
            'orders' => (clone $orders)->latest()->limit(8)->get(['id', 'number', 'channel', 'status', 'payment_status', 'total_minor', 'created_at']),
        ]);
    }
}
