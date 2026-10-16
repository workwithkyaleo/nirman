<?php

namespace Tests\Feature;

use App\Models\Page;
use App\Models\Product;
use App\Models\Site;
use App\Models\Template;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SiteDraftPreviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_site_member_can_preview_current_draft_without_changing_published_state(): void
    {
        $owner = User::factory()->create();
        $staff = User::factory()->create();
        $template = Template::query()->where('is_active', true)->firstOrFail();
        $publishedAt = now()->subDay()->startOfSecond();
        $publishedDesign = [
            'template_slug' => 'previous-template',
            'theme' => ['primary' => '#111111'],
            'navigation' => [['title' => 'Old home', 'slug' => 'home']],
            'profile' => ['name' => 'Published business'],
        ];
        $site = Site::create([
            'name' => 'Current draft business',
            'slug' => 'current-draft-business',
            'type' => 'store',
            'status' => 'published',
            'template_id' => $template->id,
            'currency' => 'NPR',
            'phone' => '+977 9800000000',
            'published_at' => $publishedAt,
            'published_design' => $publishedDesign,
        ]);
        $site->users()->attach($owner, ['role' => 'owner']);
        $site->users()->attach($staff, ['role' => 'staff']);
        $site->theme()->create(['settings' => [
            ...$template->theme_defaults,
            'primary' => '#2f6bff',
        ]]);

        $home = $this->pageFor($site, 'Draft home', 'home', 0, true, 1);
        $home->versions()->create([
            'site_id' => $site->id,
            'created_by' => $owner->id,
            'version' => 1,
            'snapshot' => [
                'title' => 'Published home',
                'slug' => 'home',
                'sections' => [['key' => (string) Str::uuid(), 'type' => 'hero', 'content' => ['heading' => 'Published headline']]],
            ],
            'published_at' => $publishedAt,
        ]);
        $home->sections()->create([
            'site_id' => $site->id,
            'key' => (string) Str::uuid(),
            'type' => 'hero',
            'content' => ['heading' => 'Unpublished draft headline'],
            'sort_order' => 0,
            'is_visible' => true,
        ]);
        $home->sections()->create([
            'site_id' => $site->id,
            'key' => (string) Str::uuid(),
            'type' => 'cta',
            'content' => ['heading' => 'Hidden draft section'],
            'sort_order' => 1,
            'is_visible' => false,
        ]);
        $about = $this->pageFor($site, 'About the draft', 'about', 1);
        $about->sections()->create([
            'site_id' => $site->id,
            'key' => (string) Str::uuid(),
            'type' => 'story',
            'content' => ['heading' => 'Our current story'],
            'sort_order' => 0,
        ]);
        $this->pageFor($site, 'Hidden navigation page', 'private', 2, false);

        Product::create([
            'site_id' => $site->id,
            'name' => 'Current active product',
            'slug' => 'current-active-product',
            'price_minor' => 125000,
            'stock_quantity' => 4,
            'is_active' => true,
        ]);
        Product::create([
            'site_id' => $site->id,
            'name' => 'Inactive product',
            'slug' => 'inactive-product',
            'price_minor' => 95000,
            'stock_quantity' => 2,
            'is_active' => false,
        ]);
        $otherSite = Site::create([
            'name' => 'Other store',
            'slug' => 'other-store',
            'type' => 'store',
        ]);
        Product::create([
            'site_id' => $otherSite->id,
            'name' => 'Foreign product',
            'slug' => 'foreign-product',
            'price_minor' => 10000,
            'is_active' => true,
        ]);

        $unchangedSiteState = $site->only(['status', 'published_at', 'published_design', 'updated_at']);
        $unchangedPublishedVersion = $home->published_version;
        $unchangedVersionCount = $home->versions()->count();

        $this->actingAs($owner)
            ->get(route('sites.preview', $site))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Public/Site')
                ->where('isPreview', true)
                ->where('site.id', $site->id)
                ->where('site.name', 'Current draft business')
                ->where('site.phone', '+977 9800000000')
                ->where('theme.primary', '#2f6bff')
                ->where('template', $template->slug)
                ->where('page.title', 'Draft home')
                ->where('page.sections.0.content.heading', 'Unpublished draft headline')
                ->has('page.sections', 1)
                ->has('navigation', 2)
                ->where('navigation.0.slug', 'home')
                ->where('navigation.1.slug', 'about')
                ->has('products', 1)
                ->where('products.0.name', 'Current active product'));

        $this->actingAs($staff)
            ->get(route('sites.preview', ['site' => $site, 'pageSlug' => 'about']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Public/Site')
                ->where('isPreview', true)
                ->where('page.slug', 'about')
                ->where('page.sections.0.content.heading', 'Our current story'));

        $site->refresh();
        $home->refresh();
        $this->assertEquals($unchangedSiteState, $site->only(['status', 'published_at', 'published_design', 'updated_at']));
        $this->assertSame($unchangedPublishedVersion, $home->published_version);
        $this->assertSame($unchangedVersionCount, $home->versions()->count());
    }

    public function test_guest_and_non_member_cannot_access_a_site_draft_preview(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $site = $this->siteFor($owner);
        $this->pageFor($site, 'Home', 'home');

        $this->get(route('sites.preview', $site))
            ->assertRedirect(route('login'));

        $this->actingAs($stranger)
            ->get(route('sites.preview', $site))
            ->assertForbidden();
    }

    public function test_store_member_can_browse_the_draft_shop_without_publishing(): void
    {
        $owner = User::factory()->create();
        $site = $this->siteFor($owner, 'Draft store');
        $site->update(['type' => 'store']);
        Product::create(['site_id' => $site->id, 'name' => 'Draft product', 'slug' => 'draft-product', 'price_minor' => 10000, 'stock_quantity' => 2, 'is_active' => true]);

        $this->actingAs($owner)->get(route('sites.preview.shop', $site))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Storefront/Shop')->where('isPreview', true)->where('products.data.0.name', 'Draft product'));

        $this->actingAs($owner)->get(route('sites.preview.product', [$site, 'draft-product']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Storefront/Product')->where('isPreview', true)->where('product.name', 'Draft product'));

        $this->get(route('storefront.product', [$site->slug, 'draft-product']))->assertNotFound();
    }

    public function test_preview_page_slug_is_resolved_only_within_the_authorized_site(): void
    {
        $owner = User::factory()->create();
        $otherOwner = User::factory()->create();
        $site = $this->siteFor($owner, 'Owner site');
        $otherSite = $this->siteFor($otherOwner, 'Other site');
        $this->pageFor($site, 'Home', 'home');
        $this->pageFor($otherSite, 'Other private page', 'other-private');

        $this->actingAs($owner)
            ->get(route('sites.preview', ['site' => $site, 'pageSlug' => 'other-private']))
            ->assertNotFound();
    }

    private function siteFor(User $owner, string $name = 'Preview site'): Site
    {
        $site = Site::create([
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(6)),
            'type' => 'business',
        ]);
        $site->users()->attach($owner, ['role' => 'owner']);
        $site->theme()->create(['settings' => []]);

        return $site;
    }

    private function pageFor(
        Site $site,
        string $title,
        string $slug,
        int $sortOrder = 0,
        bool $showInNavigation = true,
        ?int $publishedVersion = null,
    ): Page {
        return $site->pages()->create([
            'title' => $title,
            'slug' => $slug,
            'sort_order' => $sortOrder,
            'show_in_navigation' => $showInNavigation,
            'published_version' => $publishedVersion,
        ]);
    }
}
