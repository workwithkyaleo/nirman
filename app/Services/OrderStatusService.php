<?php

namespace App\Services;

use App\Jobs\SendWhatsAppOrderStatusNotification;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderStatusService
{
    private const TRANSITIONS = [
        'pending' => ['confirmed', 'cancelled'],
        'confirmed' => ['processing', 'cancelled'],
        'processing' => ['dispatched', 'cancelled'],
        'dispatched' => ['delivered'],
        'delivered' => [],
        'cancelled' => [],
    ];

    public function update(Order $order, string $status, ?string $note, ?User $user, bool $notifyCustomer): Order
    {
        if (! in_array($status, self::TRANSITIONS[$order->status] ?? [], true)) {
            throw ValidationException::withMessages(['status' => 'That order status cannot be selected from its current state.']);
        }

        return DB::transaction(function () use ($order, $status, $note, $user, $notifyCustomer) {
            $from = $order->status;
            $order->update(['status' => $status]);
            $order->events()->create([
                'site_id' => $order->site_id,
                'user_id' => $user?->id,
                'from_status' => $from,
                'to_status' => $status,
                'note' => $note,
            ]);

            if ($notifyCustomer) {
                SendWhatsAppOrderStatusNotification::dispatch($order->fresh(['items', 'site']));
            }

            return $order->fresh();
        });
    }
}
