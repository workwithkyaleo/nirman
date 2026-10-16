<?php

namespace App\Http\Requests;

use App\Models\Section;
use App\Models\Site;
use App\Support\SectionAppearance;
use App\Support\SectionElements;
use App\Support\TextFontCatalog;
use App\Support\TextStyleRules;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $site = $this->route('site');
        $section = $this->route('section');

        if (! $site instanceof Site || ! $section instanceof Section || ! $this->user()?->can('update', $site)) {
            return false;
        }

        abort_unless((int) $section->site_id === (int) $site->id, 404);

        return true;
    }

    public function rules(): array
    {
        $font = ['nullable', 'string', Rule::in(TextFontCatalog::names())];

        $styles = [];
        foreach (['eyebrow_style', 'heading_style', 'body_style', 'primary_action_style', 'secondary_action_style', 'action_style', 'items.*.title_style', 'items.*.description_style'] as $field) {
            $styles = [...$styles, ...TextStyleRules::for("content.{$field}")];
        }

        return [
            ...$styles,
            ...SectionAppearance::rules(),
            ...SectionElements::rules($this->imageReferenceRule()),
            'content' => ['required', 'array:eyebrow,heading,body,eyebrow_color,heading_color,body_color,eyebrow_font,heading_font,body_font,eyebrow_style,heading_style,body_style,image,image_alt,background_image,primary_action,secondary_action,action,primary_action_color,secondary_action_color,action_color,primary_action_font,secondary_action_font,action_font,primary_action_style,secondary_action_style,action_style,items,appearance,image_style,links,element_layouts,elements'],
            'content.eyebrow' => ['nullable', 'string', 'max:120'],
            'content.heading' => ['nullable', 'string', 'max:180'],
            'content.body' => ['nullable', 'string', 'max:2500'],
            'content.eyebrow_color' => ['nullable', 'string', 'regex:/\A#[0-9a-fA-F]{6}\z/'],
            'content.heading_color' => ['nullable', 'string', 'regex:/\A#[0-9a-fA-F]{6}\z/'],
            'content.body_color' => ['nullable', 'string', 'regex:/\A#[0-9a-fA-F]{6}\z/'],
            'content.primary_action_color' => ['nullable', 'string', 'regex:/\A#[0-9a-fA-F]{6}\z/'],
            'content.secondary_action_color' => ['nullable', 'string', 'regex:/\A#[0-9a-fA-F]{6}\z/'],
            'content.action_color' => ['nullable', 'string', 'regex:/\A#[0-9a-fA-F]{6}\z/'],
            'content.items.*.title_color' => ['nullable', 'string', 'regex:/\A#[0-9a-fA-F]{6}\z/'],
            'content.eyebrow_font' => $font,
            'content.heading_font' => $font,
            'content.body_font' => $font,
            'content.primary_action_font' => $font,
            'content.secondary_action_font' => $font,
            'content.action_font' => $font,
            'content.items.*.title_font' => $font,
            'content.items.*.description_font' => $font,
            'content.image' => ['nullable', 'string', 'max:2048', $this->imageReferenceRule()],
            'content.image_alt' => ['nullable', 'string', 'max:180'],
            'content.background_image' => ['nullable', 'string', 'max:2048', $this->imageReferenceRule()],
            'content.primary_action' => ['nullable', 'string', 'max:100'],
            'content.secondary_action' => ['nullable', 'string', 'max:100'],
            'content.action' => ['nullable', 'string', 'max:100'],
            'content.items' => ['nullable', 'array', 'list', 'max:12'],
            'content.items.*' => ['required', 'array:title,title_color,title_font,body,description_color,description_font,title_style,description_style,image,image_alt,image_style'],
            'content.items.*.title' => ['required', 'string', 'max:160'],
            'content.items.*.description_color' => ['nullable', 'string', 'regex:/\A#[0-9a-fA-F]{6}\z/'],
            'content.items.*.body' => ['nullable', 'string', 'max:1200'],
            'content.items.*.image' => ['nullable', 'string', 'max:2048', $this->imageReferenceRule()],
            'content.items.*.image_alt' => ['nullable', 'string', 'max:180'],
            'section_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120', 'dimensions:max_width=6000,max_height=6000'],
            'item_images' => ['nullable', 'array', 'max:12'],
            'item_images.*' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120', 'dimensions:max_width=6000,max_height=6000'],
            'element_images' => ['nullable', 'array', 'max:30'],
            'element_images.*' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120', 'dimensions:max_width=6000,max_height=6000'],
            'items_empty' => ['sometimes', 'boolean'],
            'elements_empty' => ['sometimes', 'boolean'],
            'is_visible' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    public function attributes(): array
    {
        $attributes = [
            'section_image' => 'section photo',
            'item_images.*' => 'item photo',
            'element_images.*' => 'element photo',
            'content.links.*' => 'element hyperlink',
            'content.elements.*.href' => 'element hyperlink',
            'content.elements.*.image' => 'element photo',
            'content.appearance.background_color' => 'background color',
            'content.appearance.border_color' => 'section border color',
            'content.appearance.border_width' => 'section border width',
            'content.appearance.radius' => 'section corner rounding',
            'content.appearance.spacing' => 'section spacing',
            'content.appearance.alignment' => 'section alignment',
            'content.appearance.decoration' => 'decorative shape',
            'content.appearance.decoration_color' => 'shape color',
            'content.appearance.min_height' => 'section height',
        ];
        foreach (['eyebrow' => 'small text', 'heading' => 'heading', 'body' => 'description', 'primary_action' => 'primary button text', 'secondary_action' => 'secondary button text', 'action' => 'button text', 'items.*.title' => 'item title', 'items.*.description' => 'item description'] as $field => $label) {
            foreach (['font', 'color', 'style'] as $setting) {
                $attributes["content.{$field}_{$setting}"] = "{$label} {$setting}";
            }
            foreach (['size', 'line_height', 'letter_spacing', 'align', 'weight', 'animation', 'animation_duration', 'animation_delay'] as $setting) {
                $attributes["content.{$field}_style.{$setting}"] = $label.' '.str_replace('_', ' ', $setting);
            }
        }
        foreach (['content.image_style' => 'photo', 'content.items.*.image_style' => 'item photo'] as $field => $label) {
            foreach (['shape', 'aspect_ratio', 'fit', 'position', 'border_color', 'border_width', 'shadow', 'opacity'] as $setting) {
                $attributes["{$field}.{$setting}"] = $label.' '.str_replace('_', ' ', $setting);
            }
        }

        return $attributes;
    }

    public function after(): array
    {
        return [function ($validator): void {
            $submittedContent = $this->input('content', []);
            foreach (['item' => 'items', 'element' => 'elements'] as $upload => $collection) {
                $uploads = $this->file("{$upload}_images", []);
                if (! is_array($uploads)) {
                    continue;
                }
                $targets = $this->boolean("{$collection}_empty")
                    ? []
                    : (is_array($submittedContent) && array_key_exists($collection, $submittedContent)
                        ? $submittedContent[$collection]
                        : $this->route('section')?->content[$collection] ?? []);
                foreach (array_keys($uploads) as $index) {
                    if (! ctype_digit((string) $index) || ! is_array($targets) || ! array_key_exists((int) $index, $targets)) {
                        $validator->errors()->add("{$upload}_images.{$index}", "The uploaded image must belong to an existing section {$upload}.");
                    } elseif ($upload === 'element' && ($targets[(int) $index]['type'] ?? null) !== 'image') {
                        $validator->errors()->add("element_images.{$index}", 'The uploaded image must belong to an image element.');
                    }
                }
            }
        }];
    }

    private function imageReferenceRule(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            if (! is_string($value) || $value === '') {
                return;
            }

            if ($this->isValidExternalImageUrl($value) || $this->isOwnedSectionImagePath($value)) {
                return;
            }

            $fail('The :attribute must be an HTTP image URL or an image uploaded to this website.');
        };
    }

    private function isValidExternalImageUrl(string $value): bool
    {
        if (filter_var($value, FILTER_VALIDATE_URL) === false) {
            return false;
        }

        $parts = parse_url($value);

        return is_array($parts)
            && in_array(strtolower((string) ($parts['scheme'] ?? '')), ['http', 'https'], true)
            && filled($parts['host'] ?? null);
    }

    private function isOwnedSectionImagePath(string $value): bool
    {
        $site = $this->route('site');

        return $site instanceof Site
            && preg_match(
                '#^/storage/sites/'.preg_quote((string) $site->id, '#').'/sections/[A-Za-z0-9_-]+\.(?:jpe?g|png|webp)$#i',
                $value,
            ) === 1;
    }
}
