<?php

namespace Tests\Feature;

use App\Actions\PublishSite;
use App\Actions\UpdateSection;
use App\Models\Section;
use App\Models\Site;
use App\Models\User;
use App\Services\SectionMedia;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use RuntimeException;
use Tests\TestCase;

class SectionElementEditingTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_save_structured_elements_safe_links_and_bounded_layouts(): void
    {
        [$owner, $site, $section] = $this->studio();
        $content = $this->customization();

        $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), ['content' => $content])
            ->assertSessionHasNoErrors()->assertSessionHas('success');

        $saved = $section->fresh()->content;
        foreach ($content as $key => $value) {
            $this->assertSame($value, $saved[$key]);
        }
        $this->assertSame('Our work', $saved['heading']);

        $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), ['content' => [
            'links' => null, 'element_layouts' => null, 'elements' => null,
        ]])->assertSessionHasNoErrors();
        foreach (['links', 'element_layouts', 'elements'] as $field) {
            $this->assertNull($section->fresh()->content[$field]);
        }
    }

    public function test_unsafe_hyperlinks_reject_the_complete_edit_before_images_are_stored(): void
    {
        Storage::fake('public');
        [$owner, $site, $section] = $this->studio();
        $original = $section->content;
        foreach (['javascript:alert(1)', '//outside.example.com', 'data:image/png;base64,abc', '/\\outside.example.com', "https://example.com/\x01"] as $link) {
            $this->actingAs($owner)->post(route('sections.update', [$site, $section]), [
                '_method' => 'PATCH',
                'content' => ['heading' => 'Must remain unchanged', 'links' => ['heading' => $link], 'elements' => [
                    ['id' => 'unsafe-button', 'type' => 'button', 'text' => 'Open', 'href' => $link],
                ]],
                'section_image' => UploadedFile::fake()->image('unchanged.jpg'),
            ])->assertSessionHasErrors(['content.links.heading', 'content.elements.0.href']);
            $this->assertSame($original, $section->fresh()->content);
            $this->assertSame([], Storage::disk('public')->allFiles());
        }
    }

    public function test_existing_elements_can_be_hidden_and_restored_without_removing_content(): void
    {
        [$owner, $site, $section] = $this->studio();
        foreach ([true, false] as $hidden) {
            $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), ['content' => [
                'element_layouts' => ['heading' => ['hidden' => $hidden], 'primary_action' => ['hidden' => $hidden]],
            ]])->assertSessionHasNoErrors()->assertSessionHas('success');
            $this->assertSame($hidden, $section->fresh()->content['element_layouts']['heading']['hidden']);
            $this->assertSame($hidden, $section->fresh()->content['element_layouts']['primary_action']['hidden']);
            $this->assertSame('Our work', $section->fresh()->content['heading']);
        }
        $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), ['content' => [
            'element_layouts' => ['heading' => ['hidden' => 'yes']],
            'elements' => [['id' => 'custom-text', 'type' => 'text', 'layout' => ['hidden' => true]]],
        ]])->assertSessionHasErrors(['content.element_layouts.heading.hidden', 'content.elements.0.layout']);
    }

    public function test_unknown_fields_and_unbounded_css_are_not_persisted(): void
    {
        [$owner, $site, $section] = $this->studio();
        $original = $section->content;
        $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), ['content' => [
            'links' => ['unknown' => 'https://example.com'],
            'element_layouts' => ['heading' => ['x' => 101, 'y' => -1001, 'width' => 101, 'height' => 1201, 'rotation' => 181, 'layer' => 31]],
            'appearance' => ['min_height' => 1601],
            'elements' => [[
                'id' => '<script>', 'type' => 'iframe', 'text' => str_repeat('a', 2501),
                'image' => 'data:image/png;base64,abc', 'font' => 'custom-css-font', 'color' => 'red',
                'shape' => 'svg', 'fill' => 'url(javascript:alert(1))', 'border_width' => 17, 'radius' => 101,
                'layout' => ['x' => -1, 'y' => 101, 'width' => 1, 'height' => 15, 'rotation' => -181, 'layer' => -1],
                'text_style' => ['size' => 121, 'animation' => 'custom', 'animation_duration' => 2001],
            ]],
        ]])->assertSessionHasErrors([
            'content.links', 'content.element_layouts.heading.x', 'content.element_layouts.heading.y',
            'content.element_layouts.heading.width', 'content.element_layouts.heading.height',
            'content.element_layouts.heading.rotation', 'content.element_layouts.heading.layer',
            'content.appearance.min_height', 'content.elements.0.id', 'content.elements.0.type',
            'content.elements.0.text', 'content.elements.0.image', 'content.elements.0.font', 'content.elements.0.color',
            'content.elements.0.shape', 'content.elements.0.fill', 'content.elements.0.border_width', 'content.elements.0.radius',
            'content.elements.0.layout.x', 'content.elements.0.layout.y', 'content.elements.0.layout.width',
            'content.elements.0.layout.height', 'content.elements.0.layout.rotation', 'content.elements.0.layout.layer',
            'content.elements.0.text_style.size', 'content.elements.0.text_style.animation', 'content.elements.0.text_style.animation_duration',
        ]);
        $this->assertSame($original, $section->fresh()->content);

        foreach ([
            ['elements' => [['id' => 'item', 'type' => 'text', 'html' => '<script>alert(1)</script>']]],
            ['elements' => [['id' => 'item', 'type' => 'text', 'layout' => ['position' => 'fixed']]]],
            ['elements' => [['id' => 'item', 'type' => 'text', 'text_style' => ['transform' => 'translate(0)']]]],
            ['element_layouts' => ['unknown' => ['x' => 1]]],
        ] as $content) {
            $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), ['content' => $content])->assertSessionHasErrors();
            $this->assertSame($original, $section->fresh()->content);
        }
    }

    public function test_element_ids_are_distinct_lists_are_dense_and_count_is_bounded(): void
    {
        [$owner, $site, $section] = $this->studio();
        $element = ['id' => 'same-id', 'type' => 'shape', 'shape' => 'circle'];
        $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), ['content' => ['elements' => [$element, $element]]])
            ->assertSessionHasErrors(['content.elements.0.id', 'content.elements.1.id']);
        $this->patch(route('sections.update', [$site, $section]), ['content' => ['elements' => [3 => $element]]])
            ->assertSessionHasErrors('content.elements');
        $many = array_map(fn (int $index): array => [...$element, 'id' => "element-{$index}"], range(0, 30));
        $this->patch(route('sections.update', [$site, $section]), ['content' => ['elements' => $many]])
            ->assertSessionHasErrors('content.elements');
        $this->patch(route('sections.update', [$site, $section]), ['content' => ['elements' => array_slice($many, 0, 30)]])
            ->assertSessionHasNoErrors()->assertSessionHas('success');
        $this->assertCount(30, $section->fresh()->content['elements']);
    }

    public function test_image_element_uploads_save_atomically_and_replaced_draft_files_are_pruned(): void
    {
        Storage::fake('public');
        [$owner, $site, $section] = $this->studio();
        $old = "sites/{$site->id}/sections/old-element.jpg";
        Storage::disk('public')->put($old, 'old draft image');
        $section->update(['content' => [...$section->content, 'elements' => [['id' => 'photo', 'type' => 'image', 'image' => '/storage/'.$old]]]]);

        $this->actingAs($owner)->post(route('sections.update', [$site, $section]), [
            '_method' => 'PATCH', 'content' => ['heading' => 'Images and text together', 'elements' => [
                ['id' => 'photo', 'type' => 'image', 'image' => '/storage/'.$old, 'image_alt' => 'Our team'],
                ['id' => 'second-photo', 'type' => 'image'],
            ]],
            'element_images' => [0 => UploadedFile::fake()->image('photo.jpg'), 1 => UploadedFile::fake()->image('second.png')],
        ])->assertSessionHasNoErrors()->assertSessionHas('success');

        $saved = $section->fresh()->content;
        $this->assertSame('Images and text together', $saved['heading']);
        foreach ($saved['elements'] as $element) {
            $this->assertStringStartsWith("/storage/sites/{$site->id}/sections/", $element['image']);
            Storage::disk('public')->assertExists(substr($element['image'], strlen('/storage/')));
        }
        Storage::disk('public')->assertMissing($old);
        $this->assertCount(2, Storage::disk('public')->allFiles());
    }

    public function test_multipart_can_delete_the_last_element_and_clean_its_unused_image(): void
    {
        Storage::fake('public');
        [$owner, $site, $section] = $this->studio();
        $old = "sites/{$site->id}/sections/removed-element.jpg";
        Storage::disk('public')->put($old, 'image');
        $section->update(['content' => [...$section->content, 'elements' => [['id' => 'photo', 'type' => 'image', 'image' => '/storage/'.$old]]]]);

        $this->actingAs($owner)->post(route('sections.update', [$site, $section]), [
            '_method' => 'PATCH', 'content' => ['heading' => 'No overlay elements'], 'elements_empty' => 1,
        ])->assertSessionHasNoErrors();

        $this->assertSame([], $section->fresh()->content['elements']);
        Storage::disk('public')->assertMissing($old);
    }

    public function test_invalid_uploads_and_upload_targets_never_change_the_draft_or_store_files(): void
    {
        Storage::fake('public');
        [$owner, $site, $section] = $this->studio();
        $original = $section->content;
        foreach ([
            [0 => UploadedFile::fake()->create('unsafe.svg', 20, 'image/svg+xml')],
            [1 => UploadedFile::fake()->image('missing.jpg')],
            ['photo' => UploadedFile::fake()->image('key.jpg')],
        ] as $uploads) {
            $this->actingAs($owner)->post(route('sections.update', [$site, $section]), [
                '_method' => 'PATCH', 'content' => ['heading' => 'Must remain unchanged', 'elements' => [['id' => 'photo', 'type' => 'image']]],
                'element_images' => $uploads,
            ])->assertSessionHasErrors();
            $this->assertSame($original, $section->fresh()->content);
            $this->assertSame([], Storage::disk('public')->allFiles());
        }
        foreach (['text', 'shape', 'button'] as $type) {
            $this->actingAs($owner)->post(route('sections.update', [$site, $section]), [
                '_method' => 'PATCH', 'content' => ['elements' => [['id' => 'target', 'type' => $type]]],
                'element_images' => [0 => UploadedFile::fake()->image('wrong-target.jpg')],
            ])->assertSessionHasErrors('element_images.0');
        }
        $this->post(route('sections.update', [$site, $section]), [
            '_method' => 'PATCH', 'content' => ['elements' => [['id' => 'photo', 'type' => 'image']]],
            'elements_empty' => true, 'element_images' => [0 => UploadedFile::fake()->image('deleted.jpg')],
        ])->assertSessionHasErrors('element_images.0');
        $this->assertSame($original, $section->fresh()->content);
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_element_edits_and_uploads_enforce_membership_roles_and_tenant_boundaries(): void
    {
        Storage::fake('public');
        [$owner, $site, $section] = $this->studio();
        [$stranger, $otherSite, $otherSection] = $this->studio();
        $staff = User::factory()->create();
        $site->users()->attach($staff, ['role' => 'staff']);
        $original = $section->content;
        $otherOriginal = $otherSection->content;
        $payload = ['_method' => 'PATCH', 'content' => $this->customization(), 'element_images' => [1 => UploadedFile::fake()->image('unauthorized.jpg')]];

        $this->actingAs($stranger)->post(route('sections.update', [$site, $section]), $payload)->assertForbidden();
        $this->actingAs($staff)->post(route('sections.update', [$site, $section]), $payload)->assertForbidden();
        $this->actingAs($owner)->post(route('sections.update', [$site, $otherSection]), $payload)->assertNotFound();
        $this->actingAs($owner)->patch(route('sections.update', [$site, $section]), ['content' => ['elements' => [
            ['id' => 'stolen', 'type' => 'image', 'image' => "/storage/sites/{$otherSite->id}/sections/private.jpg"],
        ]]])->assertSessionHasErrors('content.elements.0.image');

        $this->assertSame($original, $section->fresh()->content);
        $this->assertSame($otherOriginal, $otherSection->fresh()->content);
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_draft_layouts_links_and_elements_are_published_only_when_requested(): void
    {
        Storage::fake('public');
        [$owner, $site, $section] = $this->studio();
        $published = $this->customization();
        $old = "sites/{$site->id}/sections/published-element.jpg";
        Storage::disk('public')->put($old, 'published image');
        $published['elements'][1]['image'] = '/storage/'.$old;
        $section->update(['content' => [...$section->content, ...$published]]);
        app(PublishSite::class)->handle($site->fresh(), $owner->id);
        $draft = $published;
        $draft['links']['heading'] = '/updated';
        $draft['element_layouts']['heading']['width'] = 65;
        $draft['elements'][0]['text'] = 'New draft text';

        $this->actingAs($owner)->post(route('sections.update', [$site, $section]), [
            '_method' => 'PATCH', 'content' => $draft, 'element_images' => [1 => UploadedFile::fake()->image('new-draft.jpg')],
        ])->assertSessionHasNoErrors();
        $draft['elements'][1]['image'] = $section->fresh()->content['elements'][1]['image'];
        Storage::disk('public')->assertExists($old);

        $this->get(route('sites.preview', $site))->assertInertia(function (Assert $page) use ($draft): void {
            foreach (['links', 'element_layouts', 'elements'] as $field) {
                $page->where('page.sections.0.content.'.$field, $draft[$field]);
            }
        });
        $this->get(route('public.site', ['siteSlug' => $site->slug]))->assertInertia(function (Assert $page) use ($published): void {
            foreach (['links', 'element_layouts', 'elements'] as $field) {
                $page->where('page.sections.0.content.'.$field, $published[$field]);
            }
        });
        app(PublishSite::class)->handle($site->fresh(), $owner->id);
        $this->get(route('public.site', ['siteSlug' => $site->slug]))->assertInertia(fn (Assert $page) => $page
            ->where('page.sections.0.content.elements', $draft['elements'])
            ->where('page.sections.0.content.links', $draft['links'])
            ->where('page.sections.0.content.element_layouts', $draft['element_layouts']));
    }

    public function test_ai_copy_refinement_preserves_owner_elements_links_and_layouts(): void
    {
        [$owner, $site, $section] = $this->studio();
        $customization = $this->customization();
        $section->update(['content' => [...$section->content, ...$customization]]);
        $this->actingAs($owner)->post(route('ai.refinements.store', $site), [
            'prompt' => 'Rewrite this services section in a friendly tone.', 'scope' => 'section',
            'page_id' => $section->page_id, 'section_id' => $section->id,
        ])->assertSessionHas('success');
        $generation = $site->aiGenerations()->where('mode', 'refinement')->sole();
        $generation->update(['output' => ['summary' => 'Updated copy.', 'operations' => [[
            'op' => 'update_section', 'section_id' => $section->id, 'content' => [
                'heading' => 'A refined heading', 'items' => [['title' => 'Refined service', 'body' => 'Updated description.']],
            ],
        ]]]]);
        $this->post(route('ai.refinements.apply', [$site, $generation]))->assertSessionHas('success');

        foreach ($customization as $key => $value) {
            $this->assertSame($value, $section->fresh()->content[$key]);
        }
        $this->assertSame('A refined heading', $section->fresh()->content['heading']);
    }

    public function test_failed_multi_image_storage_rolls_back_text_and_discards_new_files(): void
    {
        Storage::fake('public');
        [$owner, $site, $section] = $this->studio();
        $original = $section->content;
        $media = new class extends SectionMedia
        {
            private int $writes = 0;

            public function store(Site $site, UploadedFile $image): string
            {
                if (++$this->writes === 2) {
                    throw new RuntimeException('Simulated storage failure');
                }

                return parent::store($site, $image);
            }
        };

        try {
            (new UpdateSection($media))->handle($site, $section, ['content' => [
                'heading' => 'Should be rolled back', 'elements' => [
                    ['id' => 'first', 'type' => 'image'], ['id' => 'second', 'type' => 'image'],
                ],
            ]], elementImages: [UploadedFile::fake()->image('first.jpg'), UploadedFile::fake()->image('second.jpg')]);
            $this->fail('The storage failure should escape the workflow.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Simulated storage failure', $exception->getMessage());
        }

        $this->assertSame($original, $section->fresh()->content);
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    private function customization(): array
    {
        return [
            'links' => ['eyebrow' => '#top', 'heading' => 'https://example.com', 'body' => 'hello@example.com', 'image' => '/gallery',
                'primary_action' => 'mailto:hello@example.com', 'secondary_action' => 'tel:+9779801234567', 'action' => '/contact',
                'decoration' => '#services', 'item_11_title' => '/services', 'item_11_description' => '#detail', 'item_11_image' => 'https://example.com/gallery'],
            'element_layouts' => ['heading' => ['x' => -100, 'y' => 1000, 'width' => 100, 'height' => 1200, 'rotation' => -180, 'layer' => 30],
                'decoration' => ['x' => 100, 'y' => -1000, 'width' => 2, 'height' => 16, 'rotation' => 180, 'layer' => 0]],
            'appearance' => ['min_height' => 240],
            'elements' => [
                ['id' => 'custom-text', 'type' => 'text', 'text' => 'Your own message', 'font' => 'Manrope', 'color' => '#123456',
                    'text_style' => ['bold' => true, 'size' => 28, 'align' => 'left', 'animation' => 'fade', 'animation_duration' => 700, 'animation_delay' => 100],
                    'layout' => ['x' => 0, 'y' => 100, 'width' => 2, 'height' => 16, 'rotation' => -180, 'layer' => 0]],
                ['id' => 'custom-image', 'type' => 'image', 'image' => 'https://example.com/photo.jpg', 'image_alt' => 'Our work', 'href' => '/gallery', 'new_tab' => true,
                    'layout' => ['x' => 100, 'y' => 0, 'width' => 100, 'height' => 1200, 'rotation' => 180, 'layer' => 30]],
                ['id' => 'custom-shape', 'type' => 'shape', 'shape' => 'star', 'fill' => '#AA3300', 'border_color' => '#123456', 'border_width' => 16, 'radius' => 100, 'href' => '#detail'],
                ['id' => 'custom-button', 'type' => 'button', 'text' => 'Contact us', 'href' => 'mailto:hello@example.com', 'new_tab' => false],
            ],
        ];
    }

    /** @return array{User, Site, Section} */
    private function studio(): array
    {
        $owner = User::factory()->create();
        $site = Site::create(['name' => 'Element Studio', 'slug' => 'elements-'.Str::lower(Str::random(8)), 'type' => 'business']);
        $site->users()->attach($owner, ['role' => 'owner']);
        $site->theme()->create(['settings' => ['style' => 'modern', 'primary' => '#0f766e', 'secondary' => '#134e4a', 'accent' => '#f59e0b',
            'background' => '#ffffff', 'text' => '#17201e', 'heading_font' => 'Manrope', 'body_font' => 'Inter', 'radius' => '16px',
            'button_style' => 'solid', 'section_spacing' => 'comfortable', 'header_layout' => 'split', 'footer_layout' => 'columns']]);
        $page = $site->pages()->create(['title' => 'Home', 'slug' => 'home', 'sort_order' => 0]);
        $section = $page->sections()->create(['site_id' => $site->id, 'key' => (string) Str::uuid(), 'type' => 'services',
            'content' => ['heading' => 'Our work', 'body' => 'What we can do.', 'items' => [['title' => 'Design', 'body' => 'Your next chapter.']]],
            'sort_order' => 0, 'is_visible' => true]);

        return [$owner, $site, $section];
    }
}
