<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateOrderStatusRequest;
use App\Models\Order;
use App\Models\Site;
use App\Services\OrderStatusService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function index(Request $request, Site $site)
    {
        $this->authorize('manageStore', $site);
        abort_unless($site->type === 'store', 404);

        return Inertia::render('Orders/Index', [
            'site' => [...$site->only(['id', 'name', 'currency', 'type']), 'can_manage' => $request->user()->can('update', $site)],
            'orders' => $site->orders()
                ->with(['items:id,order_id,name,quantity,total_minor'])
                ->latest()
                ->paginate(30)
                ->through(fn (Order $order) => [
                    ...$order->only(['id', 'number', 'status', 'payment_status', 'currency', 'total_minor', 'channel', 'created_at']),
                    'customer_name' => data_get($order->delivery_address, 'name'),
                    'phone' => data_get($order->delivery_address, 'phone'),
                    'city' => data_get($order->delivery_address, 'city'),
                    'items' => $order->items->map->only(['name', 'quantity', 'total_minor']),
                    'next_statuses' => $this->nextStatuses($order->status),
                ]),
            'statusCounts' => $site->orders()->selectRaw('status, count(*) as count')->groupBy('status')->pluck('count', 'status'),
        ]);
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Site $site, Order $order, OrderStatusService $service)
    {
        $this->authorize('manageStore', $site);
        abort_unless($order->site_id === $site->id, 404);
        $data = $request->validated();
        $service->update($order, $data['status'], $data['note'] ?? null, $request->user(), (bool) ($data['notify_customer'] ?? true));

        return back()->with('success', 'Order updated'.(($data['notify_customer'] ?? true) ? ' and notification queued.' : '.'));
    }

    private function nextStatuses(string $status): array
    {
        return [
            'pending' => ['confirmed', 'cancelled'],
            'confirmed' => ['processing', 'cancelled'],
            'processing' => ['dispatched', 'cancelled'],
            'dispatched' => ['delivered'],
            'delivered' => [],
            'cancelled' => [],
        ][$status] ?? [];
    }
}
