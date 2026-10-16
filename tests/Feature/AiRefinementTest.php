<?php

namespace Tests\Feature;

use App\Models\AiGeneration;
use App\Models\Page;
use App\Models\Section;
use App\Models\Site;
use App\Models\Template;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AiRefinementTest extends TestCase
{
    use RefreshDatabase;

    public function test_refinement_prompt_is_required_and_length_limited(): void
    {
        $owner = User::factory()->create();
        $site = $this->siteFor($owner);

        foreach ([null, 'Too short', str_repeat('a', 2001)] as $prompt) {
            $payload = ['scope' => 'site'];
            if ($prompt !== null) {
                $payload['prompt'] = $prompt;
            }

            $this->actingAs($owner)
                ->from(route('sites.edit', $site))
                ->post(route('ai.refinements.store', $site), $payload)
                ->assertRedirect(route('sites.edit', $site))
                ->assertSessionHasErrors('prompt');
        }

        $this->assertDatabaseCount('ai_generations', 0);
    }

    public function test_owner_creates_a_deterministic_proposal_without_mutating_the_draft(): void
    {
        $owner = User::factory()->create();
        $site = $this->siteFor($owner);
        [$page, $section] = $this->pageWithSection($site);
        $originalContent = $section->content;
        $originalTheme = $site->theme->settings;

        $this->actingAs($owner)
            ->post(route('ai.refinements.store', $site), [
                'prompt' => 'Rewrite the hero copy in a friendly and welcoming voice.',
                'scope' => 'section',
                'page_id' => $page->id,
                'section_id' => $section->id,
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $generation = AiGeneration::query()->sole();
        $this->assertSame($site->id, $generation->site_id);
        $this->assertSame($owner->id, $generation->user_id);
        $this->assertSame('local', $generation->provider);
        $this->assertSame('refinement', $generation->mode);
        $this->assertSame('section', $generation->scope);
        $this->assertSame($page->id, $generation->target_page_id);
        $this->assertSame($section->id, $generation->target_section_id);
        $this->assertSame('proposed', $generation->status);
        $this->assertNull($generation->applied_at);
        $this->assertSame(64, strlen($generation->base_hash));
        $this->assertSame('update_section', data_get($generation->output, 'operations.0.op'));
        $this->assertSame($section->id, data_get($generation->output, 'operations.0.section_id'));
        $this->assertNotSame(
            $originalContent['heading'],
            data_get($generation->output, 'operations.0.content.heading'),
        );

        $this->assertSame($originalContent, $section->fresh()->content);
        $this->assertSame($originalTheme, $site->theme()->firstOrFail()->settings);
        $this->assertSame(1, $page->sections()->count());
    }

    public function test_apply_changes_only_the_requested_page_and_keeps_the_published_snapshot_unchanged(): void
    {
        $owner = User::factory()->create();
        $otherOwner = User::factory()->create();
        $site = $this->siteFor($owner, 'Scoped Studio');
        [$home, $homeHero] = $this->pageWithSection($site, 'Home', 'home', 'Original published headline', 0);
        [$about, $aboutSection] = $this->pageWithSection($site, 'About', 'about', 'Untouched about headline', 1);
        $otherSite = $this->siteFor($otherOwner, 'Other Tenant');
        [, $otherSection] = $this->pageWithSection($otherSite, 'Home', 'home', 'Other tenant headline');
        $originalTheme = $site->theme->settings;

        $this->actingAs($owner)
            ->post(route('sites.publish', $site))
            ->assertRedirect()
            ->assertSessionHas('success');

        $home->refresh();
        $publishedVersion = $home->versions()
            ->where('version', $home->published_version)
            ->firstOrFail();
        $publishedSnapshot = $publishedVersion->snapshot;

        $this->actingAs($owner)
            ->post(route('ai.refinements.store', $site), [
                'prompt' => 'Change the hero heading to "Refined target headline".',
                'scope' => 'page',
                'page_id' => $home->id,
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $generation = $site->aiGenerations()->where('mode', 'refinement')->sole();
        $this->actingAs($owner)
            ->post(route('ai.refinements.apply', [$site, $generation]))
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertSame('Refined target headline', $homeHero->fresh()->content['heading']);
        $this->assertSame('Original body copy.', $homeHero->fresh()->content['body']);
        $this->assertSame('Untouched about headline', $aboutSection->fresh()->content['heading']);
        $this->assertSame('Other tenant headline', $otherSection->fresh()->content['heading']);
        $this->assertSame(1, $about->sections()->count());
        $this->assertSame($originalTheme, $site->theme()->firstOrFail()->settings);

        $generation->refresh();
        $this->assertSame('applied', $generation->status);
        $this->assertNotNull($generation->applied_at);
        $this->assertSame($publishedSnapshot, $publishedVersion->fresh()->snapshot);
        $this->assertSame('Original published headline', data_get($publishedVersion->fresh()->snapshot, 'sections.0.content.heading'));

        $this->get(route('public.site', ['siteSlug' => $site->slug]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Public/Site')
                ->where('page.sections.0.content.heading', 'Original published headline'));
    }

    public function test_cross_tenant_generation_page_and_section_targets_are_blocked(): void
    {
        $firstOwner = User::factory()->create();
        $secondOwner = User::factory()->create();
        $firstSite = $this->siteFor($firstOwner, 'First Tenant');
        [$firstPage] = $this->pageWithSection($firstSite);
        $secondSite = $this->siteFor($secondOwner, 'Second Tenant');
        [$secondPage, $secondSection] = $this->pageWithSection(
            $secondSite,
            'Home',
            'home',
            'Second tenant original',
        );

        $this->actingAs($secondOwner)
            ->post(route('ai.refinements.store', $secondSite), [
                'prompt' => 'Change the hero heading to "Private tenant proposal".',
                'scope' => 'section',
                'page_id' => $secondPage->id,
                'section_id' => $secondSection->id,
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $foreignGeneration = $secondSite->aiGenerations()->where('mode', 'refinement')->sole();

        $this->actingAs($firstOwner)
            ->post(route('ai.refinements.apply', [$firstSite, $foreignGeneration]))
            ->assertNotFound();

        $this->actingAs($firstOwner)
            ->post(route('ai.refinements.store', $firstSite), [
                'prompt' => 'Rewrite this page with a clearer professional voice.',
                'scope' => 'page',
                'page_id' => $secondPage->id,
            ])
            ->assertNotFound();

        $this->actingAs($firstOwner)
            ->post(route('ai.refinements.store', $firstSite), [
                'prompt' => 'Rewrite this hero with a clearer professional voice.',
                'scope' => 'section',
                'page_id' => $firstPage->id,
                'section_id' => $secondSection->id,
            ])
            ->assertNotFound();

        $this->assertSame('proposed', $foreignGeneration->fresh()->status);
        $this->assertSame('Second tenant original', $secondSection->fresh()->content['heading']);
        $this->assertSame(1, AiGeneration::query()->count());
    }

    public function test_stale_proposal_is_rejected_after_a_manual_draft_edit(): void
    {
        $owner = User::factory()->create();
        $site = $this->siteFor($owner);
        [$page, $section] = $this->pageWithSection($site);

        $this->actingAs($owner)
            ->post(route('ai.refinements.store', $site), [
                'prompt' => 'Change the hero heading to "AI proposal headline".',
                'scope' => 'section',
                'page_id' => $page->id,
                'section_id' => $section->id,
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $generation = $site->aiGenerations()->where('mode', 'refinement')->sole();
        $manualContent = ['heading' => 'Manual owner edit', 'body' => 'The owner changed this after generating the proposal.'];
        $section->update(['content' => $manualContent]);
        $this->assertSame($manualContent, $section->fresh()->content);

        $this->actingAs($owner)
            ->post(route('ai.refinements.apply', [$site, $generation]))
            ->assertRedirect()
            ->assertSessionHas('error');

        $generation->refresh();
        $this->assertSame('stale', $generation->status);
        $this->assertNull($generation->applied_at);
        $this->assertStringContainsString('draft changed', $generation->error);
        $this->assertSame($manualContent, $section->fresh()->content);
    }

    public function test_owner_can_discard_a_proposal(): void
    {
        $owner = User::factory()->create();
        $site = $this->siteFor($owner);
        [$page, $section] = $this->pageWithSection($site);
        $originalContent = $section->content;

        $this->actingAs($owner)
            ->post(route('ai.refinements.store', $site), [
                'prompt' => 'Rewrite the hero copy to sound concise and direct.',
                'scope' => 'section',
                'page_id' => $page->id,
                'section_id' => $section->id,
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $generation = $site->aiGenerations()->where('mode', 'refinement')->sole();
        $this->actingAs($owner)
            ->delete(route('ai.refinements.destroy', [$site, $generation]))
            ->assertRedirect()
            ->assertSessionHas('success');

        $generation->refresh();
        $this->assertSame('cancelled', $generation->status);
        $this->assertNull($generation->applied_at);
        $this->assertSame($originalContent, $section->fresh()->content);
    }

    public function test_staff_cannot_create_or_apply_ai_refinements(): void
    {
        $owner = User::factory()->create();
        $staff = User::factory()->create();
        $site = $this->siteFor($owner);
        $site->users()->attach($staff, ['role' => 'staff']);
        [$page, $section] = $this->pageWithSection($site);
        $originalContent = $section->content;
        $payload = [
            'prompt' => 'Change the hero heading to "Owner-only proposal".',
            'scope' => 'section',
            'page_id' => $page->id,
            'section_id' => $section->id,
        ];

        $this->actingAs($staff)
            ->post(route('ai.refinements.store', $site), $payload)
            ->assertForbidden();

        $this->assertDatabaseCount('ai_generations', 0);

        $this->actingAs($owner)
            ->post(route('ai.refinements.store', $site), $payload)
            ->assertRedirect()
            ->assertSessionHas('success');

        $generation = $site->aiGenerations()->where('mode', 'refinement')->sole();
        $this->actingAs($staff)
            ->post(route('ai.refinements.apply', [$site, $generation]))
            ->assertForbidden();

        $this->assertSame('proposed', $generation->fresh()->status);
        $this->assertNull($generation->fresh()->applied_at);
        $this->assertSame($originalContent, $section->fresh()->content);
    }

    private function siteFor(User $owner, string $name = 'AI Studio'): Site
    {
        $template = Template::query()->where('is_active', true)->firstOrFail();
        $site = Site::create([
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(6)),
            'type' => 'business',
            'category' => 'Professional services',
            'description' => 'Thoughtful local expertise for growing teams.',
            'template_id' => $template->id,
        ]);
        $site->users()->attach($owner, ['role' => 'owner']);
        $site->theme()->create(['settings' => $template->theme_defaults]);

        return $site->load('theme');
    }

    /** @return array{Page, Section} */
    private function pageWithSection(
        Site $site,
        string $title = 'Home',
        string $slug = 'home',
        string $heading = 'Original headline',
        int $sortOrder = 0,
    ): array {
        $page = $site->pages()->create([
            'title' => $title,
            'slug' => $slug,
            'sort_order' => $sortOrder,
        ]);
        $section = $page->sections()->create([
            'site_id' => $site->id,
            'key' => (string) Str::uuid(),
            'type' => 'hero',
            'content' => ['heading' => $heading, 'body' => 'Original body copy.'],
            'sort_order' => 0,
        ]);

        return [$page, $section];
    }
}
