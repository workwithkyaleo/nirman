<?php

namespace App\Jobs;

use App\Models\Order;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class SendWhatsAppOrderStatusNotification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Order $order)
    {
    }

    public function handle(): void
    {
        $token = config('services.whatsapp.token');
        $phoneNumberId = config('services.whatsapp.phone_number_id');
        $to = preg_replace('/\D+/', '', (string) data_get($this->order->delivery_address, 'phone'));

        if (! $token || ! $phoneNumberId || ! $to) {
            return;
        }

        $status = Str::headline($this->order->status);
        $message = "Order #{$this->order->number} update: {$status}. ";
        $message .= match ($this->order->status) {
            'confirmed' => 'We have confirmed your order and will prepare it shortly.',
            'processing' => 'Your order is being prepared.',
            'dispatched' => 'Your order is on its way.',
            'delivered' => 'Your order has been delivered. Thank you for shopping with us.',
            'cancelled' => 'Your order has been cancelled. Please contact us if you need help.',
            default => "Your order is now {$status}.",
        };

        Http::withToken($token)
            ->acceptJson()
            ->post("https://graph.facebook.com/{$this->whatsAppVersion()}/{$phoneNumberId}/messages", [
                'messaging_product' => 'whatsapp',
                'to' => $to,
                'type' => 'text',
                'text' => ['preview_url' => false, 'body' => $message],
            ])
            ->throw();
    }

    private function whatsAppVersion(): string
    {
        return (string) config('services.whatsapp.version', 'v22.0');
    }
}
