<?php

namespace Tests\Feature;

use App\Models\AiGeneration;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Page;
use App\Models\Product;
use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SiteAdminTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_guest_and_non_member_cannot_open_a_site_admin(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $site = $this->siteFor($owner);

        $this->get(route('sites.admin', $site))->assertRedirect(route('login'));
        $this->actingAs($stranger)->get(route('sites.admin', $site))->assertForbidden();
    }

    public function test_site_member_can_view_overview_with_role_appropriate_actions(): void
    {
        $owner = User::factory()->create();
        $staff = User::factory()->create();
        $site = $this->siteFor($owner);
        $site->users()->attach($staff, ['role' => 'staff']);

        $this->actingAs($staff)
            ->get(route('sites.admin', $site))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Sites/Admin')
                ->where('site.id', $site->id)
                ->where('site.can_manage', false)
                ->where('site.can_manage_store', true));
    }

    public function test_overview_metrics_and_activity_are_strictly_site_scoped(): void
    {
        $owner = User::factory()->create();
        $otherOwner = User::factory()->create();
        $site = $this->siteFor($owner, 'Primary Store', 'primary-store');
        $otherSite = $this->siteFor($otherOwner, 'Other Store', 'other-store');

        $home = $site->pages()->create([
            'title' => 'Home',
            'slug' => 'home',
            'sort_order' => 0,
            'published_version' => 1,
        ]);
        $about = $site->pages()->create([
            'title' => 'About',
            'slug' => 'about',
            'sort_order' => 1,
        ]);
        $deletedPage = $site->pages()->create([
            'title' => 'Old campaign',
            'slug' => 'old-campaign',
            'sort_order' => 2,
        ]);

        $this->addSection($site, $home, 'hero', 0);
        $this->addSection($site, $home, 'features', 1);
        $this->addSection($site, $about, 'text', 0);
        $this->addSection($site, $deletedPage, 'cta', 0);
        $deletedPage->delete();

        Product::create(['site_id' => $site->id, 'name' => 'Tea', 'slug' => 'tea', 'price_minor' => 120000]);
        Product::create(['site_id' => $site->id, 'name' => 'Coffee', 'slug' => 'coffee', 'price_minor' => 180000]);
        Product::create(['site_id' => $otherSite->id, 'name' => 'Private item', 'slug' => 'private-item', 'price_minor' => 999999]);

        $this->addOrder($site, 'ORD-100', 'pending', 120000);
        $this->addOrder($site, 'ORD-101', 'completed', 340000, 'paid');
        $this->addOrder($site, 'ORD-102', 'cancelled', 990000);
        $this->addOrder($otherSite, 'OTHER-1', 'completed', 5000000, 'paid');

        $this->addProposal($site, $owner, 'proposed', 'Make the hero friendlier');
        $this->addProposal($site, $owner, 'applied', 'Use a confident tone');
        $this->addProposal($site, $owner, 'stale', 'Add a stronger call to action');
        AiGeneration::create([
            'site_id' => $site->id,
            'user_id' => $owner->id,
            'provider' => 'local',
            'mode' => 'initial',
            'status' => 'completed',
            'input' => [],
            'output' => [],
        ]);
        $this->addProposal($otherSite, $otherOwner, 'proposed', 'Private prompt');

        $this->actingAs($owner)
            ->get(route('sites.admin', $site))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Sites/Admin')
                ->where('site.id', $site->id)
                ->where('site.name', 'Primary Store')
                ->where('site.can_manage', true)
                ->where('site.can_manage_store', true)
                ->where('stats.pages', 2)
                ->where('stats.published_pages', 1)
                ->where('stats.sections', 3)
                ->where('stats.products', 2)
                ->where('stats.orders', 3)
                ->where('stats.revenue_minor', 460000)
                ->where('stats.ai_proposals.total', 3)
                ->where('stats.ai_proposals.proposed', 1)
                ->where('stats.ai_proposals.applied', 1)
                ->where('stats.ai_proposals.stale', 1)
                ->where('stats.ai_proposals.cancelled', 0)
                ->has('recentOrders', 3)
                ->where('recentOrders.0.number', 'ORD-102')
                ->has('recentAi', 3)
                ->where('recentAi.0.status', 'stale')
                ->where('recentAi.0.prompt', 'Add a stronger call to action'));
    }

    private function siteFor(
        User $owner,
        string $name = 'Store',
        string $slug = 'store',
    ): Site {
        $site = Site::create([
            'name' => $name,
            'slug' => $slug.'-'.Str::lower(Str::random(5)),
            'type' => 'store',
            'currency' => 'NPR',
            'status' => 'draft',
        ]);
        $site->users()->attach($owner, ['role' => 'owner']);

        return $site;
    }

    private function addSection(Site $site, Page $page, string $type, int $sortOrder): void
    {
        $page->sections()->create([
            'site_id' => $site->id,
            'key' => (string) Str::uuid(),
            'type' => $type,
            'content' => ['heading' => Str::headline($type)],
            'sort_order' => $sortOrder,
        ]);
    }

    private function addOrder(
        Site $site,
        string $number,
        string $status,
        int $totalMinor,
        string $paymentStatus = 'unpaid',
    ): Order {
        $customer = Customer::create([
            'site_id' => $site->id,
            'name' => 'Customer '.$number,
            'phone' => '9800000000',
        ]);

        return Order::create([
            'site_id' => $site->id,
            'customer_id' => $customer->id,
            'number' => $number,
            'channel' => 'online',
            'status' => $status,
            'payment_status' => $paymentStatus,
            'currency' => 'NPR',
            'subtotal_minor' => $totalMinor,
            'delivery_minor' => 0,
            'total_minor' => $totalMinor,
            'delivery_address' => ['city' => 'Kathmandu'],
        ]);
    }

    private function addProposal(Site $site, User $user, string $status, string $prompt): AiGeneration
    {
        return AiGeneration::create([
            'site_id' => $site->id,
            'user_id' => $user->id,
            'provider' => 'local',
            'mode' => 'refinement',
            'scope' => 'site',
            'status' => $status,
            'input' => ['prompt' => $prompt, 'scope' => 'site'],
            'output' => ['summary' => 'Prepared website updates for review.', 'operations' => []],
            'applied_at' => $status === 'applied' ? now() : null,
        ]);
    }
}
