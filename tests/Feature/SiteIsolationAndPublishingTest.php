<?php

namespace Tests\Feature;

use App\Actions\GenerateWebsite;
use App\Actions\PublishSite;
use App\Models\Site;
use App\Models\Template;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SiteIsolationAndPublishingTest extends TestCase
{
    use RefreshDatabase;

    private function siteFor(User $user): Site
    {
        $site = Site::create(['name' => 'Acme', 'slug' => fake()->unique()->slug(), 'type' => 'business']);
        $site->users()->attach($user, ['role' => 'owner']);
        $site->theme()->create(['settings' => []]);

        return $site;
    }

    public function test_tenant_cannot_view_another_site(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $site = $this->siteFor($owner);
        $this->actingAs($stranger)->get(route('sites.edit', $site))->assertForbidden();
    }

    public function test_mock_generation_is_deterministic_and_publish_uses_snapshot(): void
    {
        $user = User::factory()->create();
        $site = $this->siteFor($user);
        app(GenerateWebsite::class)->handle($site);
        $page = $site->pages()->with('sections')->first();
        $this->assertSame('Welcome to Acme', $page->sections->first()->content['heading']);
        app(PublishSite::class)->handle($site, $user->id);
        $original = $page->fresh()->versions()->first()->snapshot;
        $page->sections()->first()->update(['content' => ['heading' => 'Unpublished change']]);
        $this->assertSame('Welcome to Acme', $original['sections'][0]['content']['heading']);
    }

    public function test_owner_can_create_site(): void
    {
        $user = User::factory()->create();
        $template = Template::where('is_active', true)->firstOrFail();
        $this->actingAs($user)->post(route('sites.store'), ['name' => 'New Co', 'type' => 'store', 'template_id' => $template->id, 'category' => 'Retail', 'description' => 'Local goods for modern homes.', 'target_customers' => 'Families in Kathmandu', 'address' => 'Lalitpur, Nepal', 'phone' => '+977 9800000000', 'email' => 'hello@newco.test', 'services' => 'Homeware, Gifts', 'unique_value' => 'Made locally with care.', 'primary' => '#0f766e', 'secondary' => '#134e4a', 'accent' => '#f59e0b', 'style' => 'modern', 'language' => 'en', 'currency' => 'NPR', 'ordering' => true])->assertRedirect();
        $this->assertTrue($user->sites()->where('name', 'New Co')->wherePivot('role', 'owner')->exists());
    }

    public function test_ai_regeneration_records_success_and_uses_saved_business_brief(): void
    {
        $user = User::factory()->create();
        $site = $this->siteFor($user);
        $site->onboarding()->create(['step' => 5, 'data' => ['services' => "Brand strategy\nWeb design", 'unique_value' => 'Ten years of local experience.']]);

        $this->actingAs($user)->post(route('sites.generate', $site))->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('ai_generations', ['site_id' => $site->id, 'status' => 'completed']);
        $services = $site->pages()->where('slug', 'home')->firstOrFail()->sections()->where('type', 'services')->firstOrFail();
        $this->assertSame('Brand strategy', $services->content['items'][0]['title']);
        $business = $site->pages()->where('slug', 'business')->firstOrFail();
        $sectors = $business->sections()->where('type', 'sectors')->firstOrFail();
        $this->assertSame('Brand strategy', $sectors->content['items'][0]['title']);
        $this->assertArrayHasKey('image', $sectors->content['items'][0]);
    }

    public function test_business_page_is_generated_only_for_multiple_companies(): void
    {
        $user = User::factory()->create();
        $single = $this->siteFor($user);
        app(GenerateWebsite::class)->handle($single, ['company_count' => 1]);
        $this->assertFalse($single->pages()->where('slug', 'business')->exists());

        $multiple = $this->siteFor($user);
        app(GenerateWebsite::class)->handle($multiple, ['company_count' => 3]);
        $this->assertSame('Our Businesses', $multiple->pages()->where('slug', 'business')->firstOrFail()->title);
    }

    public function test_owner_can_add_edit_duplicate_reorder_and_remove_sections(): void
    {
        $user = User::factory()->create();
        $site = $this->siteFor($user);
        app(GenerateWebsite::class)->handle($site);
        $page = $site->pages()->firstOrFail();

        $this->actingAs($user)->post(route('sections.store', [$site, $page]), ['type' => 'faq'])->assertSessionHas('success');
        $this->actingAs($user)->post(route('sections.store', [$site, $page]), ['type' => 'sectors'])->assertSessionHas('success');
        $this->assertDatabaseHas('sections', ['site_id' => $site->id, 'page_id' => $page->id, 'type' => 'sectors']);
        $section = $page->sections()->where('type', 'faq')->firstOrFail();
        $this->patch(route('sections.update', [$site, $section]), ['content' => ['heading' => 'Helpful answers'], 'is_visible' => false])->assertSessionHas('success');
        $this->assertSame('Helpful answers', $section->fresh()->content['heading']);
        $this->post(route('sections.duplicate', [$site, $section]))->assertSessionHas('success');
        $ids = $page->sections()->orderByDesc('sort_order')->pluck('id')->all();
        $this->patch(route('sections.reorder', [$site, $page]), ['sections' => $ids])->assertSessionHas('success');
        $this->delete(route('sections.destroy', [$site, $section]))->assertSessionHas('success');

        $this->assertDatabaseMissing('sections', ['id' => $section->id]);
    }

    public function test_owner_can_upload_an_image_for_a_section_item(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $site = $this->siteFor($user);
        app(GenerateWebsite::class)->handle($site);
        $section = $site->pages()->where('slug', 'business')->firstOrFail()->sections()->where('type', 'sectors')->firstOrFail();

        $this->actingAs($user)->post(route('sections.image', [$site, $section]), [
            'image' => UploadedFile::fake()->image('automotive.jpg', 1200, 800),
            'target' => 'item',
            'item_index' => 0,
        ])->assertSessionHas('success');

        $path = str($section->fresh()->content['items'][0]['image'])->after('/storage/')->toString();
        Storage::disk('public')->assertExists($path);
    }
}
