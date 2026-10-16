<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WorkspaceNavigationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_studio_panel_and_workspace_capabilities_are_role_and_site_aware(): void
    {
        $owner = User::factory()->create();
        $staff = User::factory()->create();
        $store = $this->siteFor($owner, 'store', 'Workspace Store');
        $store->users()->attach($staff, ['role' => 'staff']);
        $business = $this->siteFor($owner, 'business', 'Workspace Business');

        $this->actingAs($owner)
            ->get(route('sites.edit', ['site' => $store, 'panel' => 'templates']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Sites/Edit')
                ->where('site.id', $store->id)
                ->where('site.name', 'Workspace Store')
                ->where('site.type', 'store')
                ->where('canManage', true)
                ->where('canManageStore', true)
                ->where('initialPanel', 'templates'));

        $this->actingAs($staff)
            ->get(route('sites.edit', ['site' => $store, 'panel' => 'settings']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Sites/Edit')
                ->where('canManage', false)
                ->where('canManageStore', true)
                ->where('initialPanel', 'settings'));

        $this->actingAs($owner)
            ->get(route('sites.edit', ['site' => $business, 'panel' => 'unknown']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Sites/Edit')
                ->where('site.type', 'business')
                ->where('canManage', true)
                ->where('canManageStore', false)
                ->where('initialPanel', 'content'));
    }

    public function test_staff_can_open_store_workspaces_with_consistent_site_metadata(): void
    {
        $owner = User::factory()->create();
        $staff = User::factory()->create();
        $site = $this->siteFor($owner, 'store', 'Staff Store');
        $site->users()->attach($staff, ['role' => 'staff']);
        $product = Product::create([
            'site_id' => $site->id,
            'name' => 'Workspace Product',
            'slug' => 'workspace-product',
            'price_minor' => 12500,
        ]);

        $this->actingAs($staff)
            ->get(route('commerce.hub', $site))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $this->assertWorkspaceSite(
                $page->component('Commerce/Hub'),
                $site,
                false,
            ));

        $this->actingAs($staff)
            ->get(route('products.index', $site))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $this->assertWorkspaceSite(
                $page->component('Products/Index')
                    ->where('products.data.0.id', $product->id),
                $site,
                false,
            ));

        $this->actingAs($staff)
            ->get(route('products.create', $site))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $this->assertWorkspaceSite(
                $page->component('Products/Form')->where('product', null),
                $site,
                false,
            ));

        $this->actingAs($staff)
            ->get(route('products.edit', [$site, $product]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $this->assertWorkspaceSite(
                $page->component('Products/Form')->where('product.id', $product->id),
                $site,
                false,
            ));

        $this->actingAs($owner)
            ->get(route('commerce.hub', $site))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('site.can_manage', true));
    }

    public function test_workspace_routes_require_membership_and_commerce_routes_require_a_store(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $store = $this->siteFor($owner, 'store', 'Private Store');

        foreach ([
            route('sites.edit', $store),
            route('commerce.hub', $store),
            route('products.index', $store),
        ] as $url) {
            $this->get($url)->assertRedirect(route('login'));
        }

        $this->actingAs($stranger)->get(route('sites.edit', $store))->assertForbidden();
        $this->actingAs($stranger)->get(route('commerce.hub', $store))->assertForbidden();
        $this->actingAs($stranger)->get(route('products.index', $store))->assertForbidden();

        $business = $this->siteFor($owner, 'business', 'No Commerce Business');
        $legacyProduct = Product::create([
            'site_id' => $business->id,
            'name' => 'Legacy Product',
            'slug' => 'legacy-product',
            'price_minor' => 10000,
        ]);
        $productPayload = [
            'name' => 'Changed Product',
            'category' => null,
            'sku' => null,
            'description' => 'This update must not be accepted for a business site.',
            'price' => '100.00',
            'sale_price' => null,
            'stock_quantity' => 2,
            'is_featured' => false,
            'is_active' => true,
        ];

        $this->actingAs($owner)->get(route('commerce.hub', $business))->assertNotFound();
        $this->actingAs($owner)->get(route('products.index', $business))->assertNotFound();
        $this->actingAs($owner)->get(route('products.create', $business))->assertNotFound();
        $this->actingAs($owner)->post(route('products.store', $business), $productPayload)->assertNotFound();
        $this->actingAs($owner)->get(route('products.edit', [$business, $legacyProduct]))->assertNotFound();
        $this->actingAs($owner)->patch(route('products.update', [$business, $legacyProduct]), $productPayload)->assertNotFound();
        $this->actingAs($owner)->delete(route('products.destroy', [$business, $legacyProduct]))->assertNotFound();

        $this->assertSame('Legacy Product', $legacyProduct->fresh()->name);
        $this->assertNotSoftDeleted($legacyProduct);
        $this->assertSame(1, $business->products()->count());
    }

    private function assertWorkspaceSite(Assert $page, Site $site, bool $canManage): Assert
    {
        return $page
            ->where('site.id', $site->id)
            ->where('site.name', $site->name)
            ->where('site.type', 'store')
            ->where('site.currency', 'NPR')
            ->where('site.can_manage', $canManage);
    }

    private function siteFor(User $owner, string $type, string $name): Site
    {
        $site = Site::create([
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(5)),
            'type' => $type,
            'currency' => 'NPR',
        ]);
        $site->users()->attach($owner, ['role' => 'owner']);

        return $site;
    }
}
