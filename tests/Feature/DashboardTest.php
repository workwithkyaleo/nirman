<?php

namespace Tests\Feature;

use App\Models\Page;
use App\Models\Product;
use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get(route('dashboard'))->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_view_dashboard_with_their_sites_and_counts(): void
    {
        $user = User::factory()->create();

        $site = Site::create([
            'name' => 'My Kathmandu Store',
            'slug' => 'my-kathmandu-store-'.Str::random(5),
            'type' => 'store',
            'status' => 'published',
            'currency' => 'NPR',
        ]);
        $site->users()->attach($user, ['role' => 'owner']);

        Page::create([
            'site_id' => $site->id,
            'title' => 'Home',
            'slug' => 'home',
            'sort_order' => 1,
        ]);

        Product::create([
            'site_id' => $site->id,
            'name' => 'Handmade Scarf',
            'slug' => 'handmade-scarf',
            'price_minor' => 120000,
            'is_active' => true,
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('sites', 1)
                ->where('sites.0.id', $site->id)
                ->where('sites.0.name', 'My Kathmandu Store')
                ->where('sites.0.type', 'store')
                ->where('sites.0.status', 'published')
                ->where('sites.0.pages_count', 1)
                ->where('sites.0.products_count', 1)
                ->where('sites.0.orders_count', 0)
            );
    }

    public function test_dashboard_strictly_isolates_user_sites(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $siteA = Site::create([
            'name' => 'Store A',
            'slug' => 'store-a-'.Str::random(5),
            'type' => 'store',
            'status' => 'published',
            'currency' => 'NPR',
        ]);
        $siteA->users()->attach($userA, ['role' => 'owner']);

        $siteB = Site::create([
            'name' => 'Store B',
            'slug' => 'store-b-'.Str::random(5),
            'type' => 'business',
            'status' => 'draft',
            'currency' => 'NPR',
        ]);
        $siteB->users()->attach($userB, ['role' => 'owner']);

        $this->actingAs($userA)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('sites', 1)
                ->where('sites.0.id', $siteA->id)
            );

        $this->actingAs($userB)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('sites', 1)
                ->where('sites.0.id', $siteB->id)
            );
    }
}
