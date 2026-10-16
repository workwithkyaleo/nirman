<?php

namespace Tests\Feature;

use App\Actions\GenerateWebsite;
use App\Models\Section;
use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class SectionMediaEditingTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_save_section_and_item_descriptions_with_staged_images_in_one_request(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create();
        [$site, $section] = $this->sectionFor($owner);

        $response = $this->actingAs($owner)->post(route('sections.update', [$site, $section]), [
            '_method' => 'PATCH',
            'content' => [
                'eyebrow' => 'What we do',
                'heading' => 'Our business sectors',
                'body' => 'Choose a sector to learn how our team can help.',
                'image_alt' => 'Our team working together',
                'items' => [[
                    'title' => 'Retail',
                    'body' => 'Support for growing shops and independent sellers.',
                    'image' => '',
                    'image_alt' => 'A local retail shop',
                ]],
            ],
            'section_image' => UploadedFile::fake()->image('team.jpg', 1600, 900),
            'item_images' => [0 => UploadedFile::fake()->image('retail.png', 900, 700)],
            'is_visible' => true,
        ]);

        $response->assertRedirect()->assertSessionHas('success');
        $content = $section->fresh()->content;

        $this->assertSame('Choose a sector to learn how our team can help.', $content['body']);
        $this->assertSame('Support for growing shops and independent sellers.', $content['items'][0]['body']);
        $this->assertSame('Our team working together', $content['image_alt']);
        $this->assertStringStartsWith("/storage/sites/{$site->id}/sections/", $content['image']);
        $this->assertStringStartsWith("/storage/sites/{$site->id}/sections/", $content['items'][0]['image']);
        Storage::disk('public')->assertExists(str($content['image'])->after('/storage/')->toString());
        Storage::disk('public')->assertExists(str($content['items'][0]['image'])->after('/storage/')->toString());
    }

    public function test_text_styles_can_be_saved_disabled_reset_and_reject_arbitrary_css(): void
    {
        $owner = User::factory()->create();
        [$site, $section] = $this->sectionFor($owner);

        foreach ([['bold' => true, 'italic' => true, 'underline' => true], ['bold' => false, 'italic' => false, 'underline' => false], ['italic' => true], null] as $style) {
            $content = [
                'eyebrow_style' => $style,
                'heading_style' => $style,
                'body_style' => $style,
                'items' => [['title' => 'Retail', 'title_style' => $style, 'description_style' => $style]],
            ];
            $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), [
                'content' => $content,
            ])->assertSessionHasNoErrors()->assertSessionHas('success');

            foreach ($content as $key => $value) {
                $this->assertSame($value, $section->fresh()->content[$key]);
            }
        }

        $original = $section->fresh()->content;
        foreach (['font-weight: bold', ['background' => 'url(https://example.com)']] as $style) {
            $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), [
                'content' => [
                    'eyebrow_style' => $style,
                    'heading_style' => $style,
                    'body_style' => $style,
                    'items' => [['title' => 'Retail', 'title_style' => $style, 'description_style' => $style]],
                ],
            ])->assertSessionHasErrors([
                'content.eyebrow_style', 'content.heading_style', 'content.body_style',
                'content.items.0.title_style', 'content.items.0.description_style',
            ]);
            $this->assertSame($original, $section->fresh()->content);
        }

        $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), [
            'content' => ['heading_style' => ['bold' => 'heavy', 'italic' => [], 'underline' => null]],
        ])->assertSessionHasErrors(['content.heading_style.bold', 'content.heading_style.italic', 'content.heading_style.underline']);
        $this->assertSame($original, $section->fresh()->content);
    }

    public function test_text_fonts_can_be_saved_reset_and_only_supported_fonts_are_accepted(): void
    {
        $owner = User::factory()->create();
        [$site, $section] = $this->sectionFor($owner);

        foreach (['Manrope', 'Inter', 'Playfair Display', 'Poppins', 'DM Sans', 'Figtree', 'Lora', 'Noto Sans Devanagari', 'Noto Serif Devanagari', null] as $font) {
            $content = [
                'eyebrow_font' => $font,
                'heading_font' => $font,
                'body_font' => $font,
                'items' => [['title' => 'Retail', 'title_font' => $font, 'description_font' => $font]],
            ];
            $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), [
                'content' => $content,
            ])->assertSessionHasNoErrors()->assertSessionHas('success');

            foreach ($content as $key => $value) {
                $this->assertSame($value, $section->fresh()->content[$key]);
            }
        }

        $original = $section->fresh()->content;
        foreach (['Unsupported Font', 'serif; color: red', ['Inter']] as $font) {
            $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), [
                'content' => [
                    'eyebrow_font' => $font,
                    'heading_font' => $font,
                    'body_font' => $font,
                    'items' => [['title' => 'Retail', 'title_font' => $font, 'description_font' => $font]],
                ],
            ])->assertSessionHasErrors([
                'content.eyebrow_font', 'content.heading_font', 'content.body_font',
                'content.items.0.title_font', 'content.items.0.description_font',
            ]);
            $this->assertSame($original, $section->fresh()->content);
        }
    }

    public function test_section_text_colours_can_be_saved_reset_and_reject_invalid_css(): void
    {
        $owner = User::factory()->create();
        [$site, $section] = $this->sectionFor($owner);

        foreach (['#Aa33b2', null] as $colour) {
            $content = [
                'eyebrow_color' => $colour,
                'heading_color' => $colour,
                'body_color' => $colour,
                'items' => [['title' => 'Retail', 'title_color' => $colour]],
            ];
            $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), [
                'content' => $content,
            ])->assertSessionHasNoErrors()->assertSessionHas('success');

            foreach ($content as $key => $value) {
                $this->assertSame($value, $section->fresh()->content[$key]);
            }
        }

        $original = $section->fresh()->content;
        foreach (['red', '#123', '#12345678', 'url(https://example.com)'] as $colour) {
            $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), [
                'content' => [
                    'eyebrow_color' => $colour,
                    'heading_color' => $colour,
                    'body_color' => $colour,
                    'items' => [['title' => 'Retail', 'title_color' => $colour]],
                ],
            ])->assertSessionHasErrors([
                'content.eyebrow_color', 'content.heading_color', 'content.body_color', 'content.items.0.title_color',
            ]);
            $this->assertSame($original, $section->fresh()->content);
        }
    }

    public function test_item_description_colour_can_be_saved_reset_and_rejects_invalid_css(): void
    {
        $owner = User::factory()->create();
        [$site, $section] = $this->sectionFor($owner);

        foreach (['#a33b24', null] as $colour) {
            $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), [
                'content' => ['items' => [['title' => 'Fitness Product', 'body' => 'Description', 'description_color' => $colour]]],
            ])->assertSessionHasNoErrors()->assertSessionHas('success');

            $this->assertSame($colour, $section->fresh()->content['items'][0]['description_color']);
        }

        $original = $section->fresh()->content;
        foreach (['red', '#123', '#12345678', 'url(https://example.com)'] as $colour) {
            $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), [
                'content' => ['items' => [['title' => 'Fitness Product', 'description_color' => $colour]]],
            ])->assertSessionHasErrors('content.items.0.description_color');
            $this->assertSame($original, $section->fresh()->content);
        }
    }

    public function test_atomic_section_image_uses_the_existing_background_field_for_a_hero(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create();
        [$site, $section] = $this->sectionFor($owner);
        $section->update([
            'type' => 'hero',
            'content' => [
                'heading' => 'Original hero',
                'body' => 'Original description.',
                'background_image' => '',
            ],
        ]);

        $this->actingAs($owner)->post(route('sections.update', [$site, $section]), [
            '_method' => 'PATCH',
            'content' => [
                'heading' => 'Updated hero',
                'body' => 'Updated hero description.',
                'background_image' => '',
            ],
            'section_image' => UploadedFile::fake()->image('hero.jpg', 1800, 1000),
        ])->assertSessionHas('success');

        $content = $section->fresh()->content;
        $this->assertSame('Updated hero description.', $content['body']);
        $this->assertArrayNotHasKey('image', $content);
        $this->assertStringStartsWith("/storage/sites/{$site->id}/sections/", $content['background_image']);
        Storage::disk('public')->assertExists(str($content['background_image'])->after('/storage/')->toString());
    }

    public function test_multipart_save_can_remove_the_final_item_when_form_data_omits_the_empty_array(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create();
        [$site, $section] = $this->sectionFor($owner);

        $this->actingAs($owner)->post(route('sections.update', [$site, $section]), [
            '_method' => 'PATCH',
            'content' => [
                'heading' => 'No sectors yet',
                'body' => 'We are preparing a new list of sectors.',
                // Inertia intentionally omits content.items when it is [].
            ],
            'items_empty' => 1,
            'section_image' => UploadedFile::fake()->image('empty-state.jpg', 1200, 800),
        ])->assertSessionHas('success');

        $content = $section->fresh()->content;
        $this->assertSame('We are preparing a new list of sectors.', $content['body']);
        $this->assertSame([], $content['items']);
        $this->assertStringStartsWith("/storage/sites/{$site->id}/sections/", $content['image']);
        Storage::disk('public')->assertExists(str($content['image'])->after('/storage/')->toString());
    }

    public function test_item_upload_must_target_an_item_in_the_submitted_content_before_any_file_is_stored(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create();
        [$site, $section] = $this->sectionFor($owner);

        $this->actingAs($owner)->from(route('sites.edit', $site))->post(route('sections.update', [$site, $section]), [
            '_method' => 'PATCH',
            'content' => [
                'heading' => 'One item only',
                'items' => [['title' => 'First', 'body' => 'First description', 'image' => '']],
            ],
            'item_images' => [4 => UploadedFile::fake()->image('orphan.jpg')],
        ])->assertRedirect(route('sites.edit', $site))->assertSessionHasErrors('item_images.4');

        $this->assertSame([], Storage::disk('public')->allFiles());
        $this->assertSame('Business sectors', $section->fresh()->content['heading']);
    }

    public function test_invalid_section_file_prevents_the_description_and_file_from_partially_saving(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create();
        [$site, $section] = $this->sectionFor($owner);
        $original = $section->content;

        $this->actingAs($owner)->from(route('sites.edit', $site))->post(route('sections.update', [$site, $section]), [
            '_method' => 'PATCH',
            'content' => [
                'heading' => 'Should not be saved',
                'body' => 'This description must not be partially persisted.',
            ],
            'section_image' => UploadedFile::fake()->create('unsafe.svg', 20, 'image/svg+xml'),
        ])->assertRedirect(route('sites.edit', $site))->assertSessionHasErrors('section_image');

        $this->assertSame($original, $section->fresh()->content);
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_legacy_upload_endpoint_supports_general_section_images_and_rejects_missing_items_without_orphans(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create();
        [$site, $section] = $this->sectionFor($owner);

        $this->actingAs($owner)->post(route('sections.image', [$site, $section]), [
            'image' => UploadedFile::fake()->image('section.webp'),
            'target' => 'section',
        ])->assertSessionHas('success');

        $path = $section->fresh()->content['image'];
        Storage::disk('public')->assertExists(str($path)->after('/storage/')->toString());
        $fileCount = count(Storage::disk('public')->allFiles());

        $this->actingAs($owner)->post(route('sections.image', [$site, $section]), [
            'image' => UploadedFile::fake()->image('missing.jpg'),
            'target' => 'item',
            'item_index' => 9,
        ])->assertSessionHasErrors('item_index');

        $this->assertCount($fileCount, Storage::disk('public')->allFiles());
    }

    public function test_replacing_an_unpublished_draft_image_removes_the_unreferenced_old_file(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create();
        [$site, $section] = $this->sectionFor($owner);
        $oldDiskPath = "sites/{$site->id}/sections/old.jpg";
        Storage::disk('public')->put($oldDiskPath, 'old image');
        $section->update(['content' => [...$section->content, 'image' => '/storage/'.$oldDiskPath]]);

        $this->actingAs($owner)->post(route('sections.update', [$site, $section]), [
            '_method' => 'PATCH',
            'content' => $section->fresh()->content,
            'section_image' => UploadedFile::fake()->image('replacement.jpg'),
        ])->assertSessionHas('success');

        Storage::disk('public')->assertMissing($oldDiskPath);
        $newPath = str($section->fresh()->content['image'])->after('/storage/')->toString();
        Storage::disk('public')->assertExists($newPath);
    }

    public function test_replacing_an_image_keeps_the_old_file_when_a_published_snapshot_still_uses_it(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create();
        [$site, $section] = $this->sectionFor($owner);
        $page = $section->page;
        $oldDiskPath = "sites/{$site->id}/sections/published.jpg";
        $oldReference = '/storage/'.$oldDiskPath;
        Storage::disk('public')->put($oldDiskPath, 'published image');
        $section->update(['content' => [...$section->content, 'image' => $oldReference]]);
        $page->versions()->create([
            'site_id' => $site->id,
            'created_by' => $owner->id,
            'version' => 1,
            'snapshot' => [
                'title' => $page->title,
                'slug' => $page->slug,
                'sections' => [['key' => $section->key, 'type' => $section->type, 'content' => $section->fresh()->content]],
            ],
            'published_at' => now(),
        ]);

        $this->actingAs($owner)->post(route('sections.update', [$site, $section]), [
            '_method' => 'PATCH',
            'content' => $section->fresh()->content,
            'section_image' => UploadedFile::fake()->image('new-draft.jpg'),
        ])->assertSessionHas('success');

        Storage::disk('public')->assertExists($oldDiskPath);
    }

    public function test_deleting_a_section_removes_only_its_unreferenced_draft_media(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create();
        [$site, $section] = $this->sectionFor($owner);
        $diskPath = "sites/{$site->id}/sections/delete-me.jpg";
        Storage::disk('public')->put($diskPath, 'draft image');
        $section->update(['content' => [...$section->content, 'image' => '/storage/'.$diskPath]]);

        $this->actingAs($owner)
            ->delete(route('sections.destroy', [$site, $section]))
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('sections', ['id' => $section->id]);
        Storage::disk('public')->assertMissing($diskPath);
    }

    public function test_regenerating_page_sections_prunes_replaced_unpublished_media(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create();
        [$site, $section] = $this->sectionFor($owner);
        $diskPath = "sites/{$site->id}/sections/replaced-by-ai.jpg";
        Storage::disk('public')->put($diskPath, 'old draft image');
        $section->update(['content' => [...$section->content, 'image' => '/storage/'.$diskPath]]);

        $this->actingAs($owner);
        app(GenerateWebsite::class)->handle($site);

        Storage::disk('public')->assertMissing($diskPath);
    }

    public function test_ai_item_copy_refinement_preserves_manually_uploaded_images_and_alt_text(): void
    {
        $owner = User::factory()->create();
        [$site, $section] = $this->sectionFor($owner);
        $section->update([
            'type' => 'services',
            'content' => [
                'heading' => 'Current services',
                'items' => [[
                    'title' => 'Old title',
                    'body' => 'Old description',
                    'image' => "/storage/sites/{$site->id}/sections/service.jpg",
                    'image_alt' => 'A specialist helping a customer',
                    'description_color' => '#a33b24',
                ]],
            ],
        ]);

        $this->actingAs($owner)->post(route('ai.refinements.store', $site), [
            'prompt' => 'Rewrite this services section with a professional and detailed description.',
            'scope' => 'section',
            'page_id' => $section->page_id,
            'section_id' => $section->id,
        ])->assertSessionHas('success');

        $generation = $site->aiGenerations()->where('mode', 'refinement')->sole();
        $generation->update(['output' => [
            'summary' => 'Updated service copy.',
            'operations' => [[
                'op' => 'update_section',
                'section_id' => $section->id,
                'content' => [
                    'items' => [['title' => 'New title', 'body' => 'New AI-written description']],
                ],
            ]],
        ]]);

        $this->actingAs($owner)
            ->post(route('ai.refinements.apply', [$site, $generation]))
            ->assertSessionHas('success');

        $item = $section->fresh()->content['items'][0];
        $this->assertSame('#a33b24', $item['description_color']);
        $this->assertSame('New title', $item['title']);
        $this->assertSame('New AI-written description', $item['body']);
        $this->assertSame("/storage/sites/{$site->id}/sections/service.jpg", $item['image']);
        $this->assertSame('A specialist helping a customer', $item['image_alt']);
    }

    public function test_section_media_is_tenant_scoped_and_cross_site_local_paths_are_rejected(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        [$site, $section] = $this->sectionFor($owner);
        [$otherSite, $otherSection] = $this->sectionFor($stranger);
        $original = $section->content;

        $this->actingAs($stranger)->post(route('sections.update', [$site, $section]), [
            '_method' => 'PATCH',
            'content' => ['heading' => 'Stolen edit'],
            'section_image' => UploadedFile::fake()->image('foreign.jpg'),
        ])->assertForbidden();

        $this->actingAs($owner)->post(route('sections.update', [$site, $otherSection]), [
            '_method' => 'PATCH',
            'content' => ['heading' => 'Cross-tenant edit'],
        ])->assertNotFound();

        $this->actingAs($owner)->from(route('sites.edit', $site))->patch(route('sections.update', [$site, $section]), [
            'content' => [
                'heading' => 'Invalid image reference',
                'image' => "/storage/sites/{$otherSite->id}/sections/private.jpg",
            ],
        ])->assertRedirect(route('sites.edit', $site))->assertSessionHasErrors('content.image');

        $this->assertSame($original, $section->fresh()->content);
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    /** @return array{Site, Section} */
    private function sectionFor(User $owner): array
    {
        $site = Site::create([
            'name' => fake()->company(),
            'slug' => fake()->unique()->slug(),
            'type' => 'business',
        ]);
        $site->users()->attach($owner, ['role' => 'owner']);
        $page = $site->pages()->create([
            'title' => 'Home',
            'slug' => 'home',
            'sort_order' => 0,
        ]);
        $section = $page->sections()->create([
            'site_id' => $site->id,
            'key' => (string) Str::uuid(),
            'type' => 'sectors',
            'content' => [
                'heading' => 'Business sectors',
                'body' => 'Original section description.',
                'items' => [[
                    'title' => 'Hospitality',
                    'body' => 'Original item description.',
                    'image' => '',
                ]],
            ],
            'sort_order' => 0,
        ]);

        return [$site, $section];
    }
}
