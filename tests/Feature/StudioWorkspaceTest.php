<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudioWorkspaceTest extends TestCase
{
    use RefreshDatabase;

    private const PUBLIC_PRODUCT_FIELDS = [
        'id', 'name', 'slug', 'description', 'image_path',
        'price_minor', 'sale_price_minor', 'stock_quantity', 'is_featured',
    ];

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_store_workspace_exposes_only_its_active_public_product_fields_for_owner_and_staff(): void
    {
        $owner = User::factory()->create();
        $staff = User::factory()->create();
        $site = $this->siteFor($owner);
        $site->users()->attach($staff, ['role' => 'staff']);
        $otherSite = $this->siteFor(User::factory()->create());
        $featured = $this->productFor($site, [
            'name' => 'Featured product', 'is_featured' => true,
            'image_path' => "sites/{$site->id}/products/featured.png",
            'sku' => 'INTERNAL-SKU',
        ]);
        $regular = $this->productFor($site, ['name' => 'Regular product']);
        $this->productFor($site, ['name' => 'Inactive product', 'is_active' => false]);
        $this->productFor($site, ['name' => 'Deleted product'])->delete();
        $this->productFor($otherSite, ['name' => 'Foreign product', 'is_featured' => true]);
        $before = $site->only(['status', 'published_at', 'published_design', 'updated_at']);

        foreach ([[$owner, true], [$staff, false]] as [$member, $canManage]) {
            $this->actingAs($member)->get(route('sites.edit', ['site' => $site, 'panel' => 'uploads']))
                ->assertOk()->assertInertia(fn (Assert $page) => $page
                ->component('Sites/Edit')
                ->where('canManage', $canManage)
                ->where('canManageStore', true)
                ->where('initialPanel', 'uploads')
                ->has('previewProducts', 2)
                ->where('previewProducts.0', $featured->only(self::PUBLIC_PRODUCT_FIELDS))
                ->where('previewProducts.1', $regular->only(self::PUBLIC_PRODUCT_FIELDS)));
        }

        $this->assertEquals($before, $site->fresh()->only(['status', 'published_at', 'published_design', 'updated_at']));
    }

    public function test_workspace_product_preview_is_bounded_to_twenty_four_products(): void
    {
        $owner = User::factory()->create();
        $site = $this->siteFor($owner);
        $featured = $this->productFor($site, ['is_featured' => true]);
        for ($index = 0; $index < 25; $index++) {
            $this->productFor($site);
        }

        $this->actingAs($owner)->get(route('sites.edit', $site))
            ->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Sites/Edit')
            ->has('previewProducts', 24)
            ->where('previewProducts.0.id', $featured->id));
    }

    public function test_business_workspace_does_not_expose_legacy_store_products(): void
    {
        $owner = User::factory()->create();
        $site = $this->siteFor($owner, 'business');
        $this->productFor($site);

        $this->actingAs($owner)->get(route('sites.edit', $site))
            ->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Sites/Edit')
            ->where('previewProducts', [])
            ->where('canManageStore', false));
    }

    public function test_workspace_and_uploads_panel_require_site_membership(): void
    {
        $owner = User::factory()->create();
        $site = $this->siteFor($owner);
        $this->productFor($site);
        $foreignOwner = User::factory()->create();
        $this->siteFor($foreignOwner);
        $url = route('sites.edit', ['site' => $site, 'panel' => 'uploads']);

        $this->get($url)->assertRedirect(route('login'));
        $this->actingAs($foreignOwner)->get($url)->assertForbidden();
    }

    private function siteFor(User $owner, string $type = 'store'): Site
    {
        $site = Site::create([
            'name' => 'Canvas Workspace',
            'slug' => 'workspace-'.Str::lower(Str::random(8)),
            'type' => $type,
            'currency' => 'NPR',
        ]);
        $site->users()->attach($owner, ['role' => 'owner']);

        return $site->fresh();
    }

    private function productFor(Site $site, array $attributes = []): Product
    {
        return Product::create([
            'site_id' => $site->id,
            'name' => 'Canvas product',
            'slug' => 'product-'.Str::lower(Str::random(8)),
            'description' => 'Product details shown on the website.',
            'price_minor' => 125000,
            'sale_price_minor' => 115000,
            'stock_quantity' => 4,
            'is_active' => true,
            'is_featured' => false,
            ...$attributes,
        ])->fresh();
    }
}
