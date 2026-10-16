<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Order;
use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_member_can_confirm_only_their_site_order(): void
    {
        $owner = User::factory()->create();
        $site = Site::create(['name' => 'A', 'slug' => 'a', 'type' => 'store', 'currency' => 'NPR']);
        $site->users()->attach($owner, ['role' => 'owner']);
        $customer = Customer::create(['site_id' => $site->id, 'name' => 'Sita', 'phone' => '9800000001']);
        $order = Order::create(['site_id' => $site->id, 'customer_id' => $customer->id, 'number' => 'ORD-1', 'channel' => 'online', 'status' => 'pending', 'payment_status' => 'unpaid', 'currency' => 'NPR', 'subtotal_minor' => 10000, 'total_minor' => 10000, 'delivery_address' => ['name' => 'Sita', 'phone' => '9800000001']]);

        $this->actingAs($owner)->patch(route('orders.status.update', [$site, $order]), ['status' => 'confirmed', 'notify_customer' => false])
            ->assertRedirect();

        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'confirmed']);
        $this->assertDatabaseHas('order_status_events', ['order_id' => $order->id, 'from_status' => 'pending', 'to_status' => 'confirmed']);
    }
}
