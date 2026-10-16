<?php

namespace App\Services\Ai;

use App\Support\TextFontCatalog;
use Illuminate\Support\Str;

class AiRefinementProposalValidator
{
    /** @var list<string> */
    private const SECTION_TYPES = [
        'hero',
        'text',
        'features',
        'gallery',
        'testimonials',
        'faq',
        'contact',
        'map',
        'cta',
        'services',
        'sectors',
    ];

    /** @var array<string, int> */
    private const TEXT_LIMITS = [
        'eyebrow' => 120,
        'heading' => 180,
        'body' => 2500,
        'primary_action' => 100,
        'secondary_action' => 100,
        'action' => 100,
    ];

    /** @var array<string, list<string>> */
    private const CONTENT_KEYS = [
        'hero' => ['eyebrow', 'heading', 'body', 'primary_action', 'secondary_action'],
        'text' => ['eyebrow', 'heading', 'body'],
        'features' => ['eyebrow', 'heading', 'body', 'items'],
        'gallery' => ['eyebrow', 'heading', 'body', 'items'],
        'testimonials' => ['eyebrow', 'heading', 'body', 'items'],
        'faq' => ['eyebrow', 'heading', 'body', 'items'],
        'contact' => ['eyebrow', 'heading', 'body'],
        'map' => ['eyebrow', 'heading', 'body'],
        'cta' => ['eyebrow', 'heading', 'body', 'action'],
        'services' => ['eyebrow', 'heading', 'body', 'items'],
        'sectors' => ['eyebrow', 'heading', 'body', 'items'],
        'products' => ['eyebrow', 'heading', 'body'],
    ];

    /** @var list<string> */
    private const ITEM_TYPES = ['features', 'gallery', 'testimonials', 'faq', 'services', 'sectors'];

    /** @var array<string, list<string>> */
    private const THEME_ENUMS = [
        'style' => ['modern', 'elegant', 'bold', 'minimal', 'traditional'],
        'radius' => ['0px', '8px', '16px', '24px', '32px'],
        'button_style' => ['solid', 'outline', 'rounded', 'soft'],
        'section_spacing' => ['compact', 'comfortable', 'generous'],
        'header_layout' => ['split', 'centered', 'minimal'],
        'footer_layout' => ['columns', 'centered', 'minimal'],
        'content_width' => ['narrow', 'standard', 'wide'],
        'hero_alignment' => ['left', 'center'],
        'card_style' => ['flat', 'bordered', 'elevated'],
        'heading_scale' => ['compact', 'balanced', 'display'],
        'hero_height' => ['compact', 'standard', 'screen'],
        'header_style' => ['solid', 'glass', 'contrast'],
        'motion' => ['none', 'subtle', 'expressive'],
        'image_shape' => ['square', 'soft', 'rounded'],
        'divider_style' => ['none', 'subtle', 'strong'],
    ];

    /**
     * Validate and normalize provider output before either persistence or use.
     *
     * @param  array<string, mixed>  $proposal
     * @return array{summary: string, operations: list<array<string, mixed>>}
     */
    public function validate(array $proposal): array
    {
        $this->assertOnlyKeys($proposal, ['summary', 'operations'], 'proposal');

        $summary = $this->plainText($proposal['summary'] ?? null, 'summary', 240);
        $operations = $proposal['operations'] ?? null;

        if (! is_array($operations) || ! array_is_list($operations) || $operations === [] || count($operations) > 25) {
            throw new InvalidAiRefinementException('The refinement must contain between one and 25 operations.');
        }

        $normalized = [];
        foreach ($operations as $index => $operation) {
            if (! is_array($operation)) {
                throw new InvalidAiRefinementException("Refinement operation {$index} is invalid.");
            }

            $normalized[] = $this->validateOperation($operation, $index);
        }

        $result = ['summary' => $summary, 'operations' => $normalized];
        $encoded = json_encode($result, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        if (strlen($encoded) > 65536) {
            throw new InvalidAiRefinementException('The refinement proposal is too large.');
        }

        return $result;
    }

    /**
     * Apply-time validation can additionally enforce the existing section's
     * concrete schema, which a provider operation does not get to declare.
     *
     * @param  array<string, mixed>  $content
     * @return array<string, mixed>
     */
    public function validateSectionPatch(string $sectionType, array $content): array
    {
        if (! array_key_exists($sectionType, self::CONTENT_KEYS)) {
            throw new InvalidAiRefinementException('A refinement targets an unsupported section type.');
        }

        return $this->validateContent($content, $sectionType, false);
    }

    /**
     * @param  array<string, mixed>  $operation
     * @return array<string, mixed>
     */
    private function validateOperation(array $operation, int $index): array
    {
        $type = $operation['op'] ?? null;

        return match ($type) {
            'update_section' => $this->validateSectionUpdate($operation, $index),
            'add_section' => $this->validateSectionAddition($operation, $index),
            'update_theme' => $this->validateThemeUpdate($operation, $index),
            default => throw new InvalidAiRefinementException("Refinement operation {$index} has an unsupported type."),
        };
    }

    /** @param array<string, mixed> $operation */
    private function validateSectionUpdate(array $operation, int $index): array
    {
        $this->assertOnlyKeys($operation, ['op', 'section_id', 'content'], "operation {$index}");
        $sectionId = $this->positiveInteger($operation['section_id'] ?? null, "operation {$index} section");

        if (! isset($operation['content']) || ! is_array($operation['content'])) {
            throw new InvalidAiRefinementException("Refinement operation {$index} has invalid section content.");
        }

        return [
            'op' => 'update_section',
            'section_id' => $sectionId,
            'content' => $this->validateContent($operation['content'], null, false),
        ];
    }

    /** @param array<string, mixed> $operation */
    private function validateSectionAddition(array $operation, int $index): array
    {
        $this->assertOnlyKeys($operation, ['op', 'page_id', 'type', 'content'], "operation {$index}");
        $pageId = $this->positiveInteger($operation['page_id'] ?? null, "operation {$index} page");
        $type = $operation['type'] ?? null;

        if (! is_string($type) || ! in_array($type, self::SECTION_TYPES, true)) {
            throw new InvalidAiRefinementException("Refinement operation {$index} has an unsupported section type.");
        }

        if (! isset($operation['content']) || ! is_array($operation['content'])) {
            throw new InvalidAiRefinementException("Refinement operation {$index} has invalid section content.");
        }

        return [
            'op' => 'add_section',
            'page_id' => $pageId,
            'type' => $type,
            'content' => $this->validateContent($operation['content'], $type, true),
        ];
    }

    /** @param array<string, mixed> $operation */
    private function validateThemeUpdate(array $operation, int $index): array
    {
        $this->assertOnlyKeys($operation, ['op', 'changes'], "operation {$index}");
        $changes = $operation['changes'] ?? null;

        if (! is_array($changes) || $changes === []) {
            throw new InvalidAiRefinementException("Refinement operation {$index} has invalid theme changes.");
        }

        $allowed = [...array_keys(self::THEME_ENUMS), 'heading_font', 'body_font', 'primary', 'secondary', 'accent', 'background', 'text'];
        $this->assertOnlyKeys($changes, $allowed, "operation {$index} theme");
        $normalized = [];

        foreach ($changes as $key => $value) {
            if (in_array($key, ['primary', 'secondary', 'accent', 'background', 'text'], true)) {
                if (! is_string($value) || ! preg_match('/^#[0-9a-fA-F]{6}$/', $value)) {
                    throw new InvalidAiRefinementException("Refinement operation {$index} has an invalid colour.");
                }

                $normalized[$key] = strtolower($value);

                continue;
            }

            $options = in_array($key, ['heading_font', 'body_font'], true)
                ? TextFontCatalog::names()
                : self::THEME_ENUMS[$key];

            if (! is_string($value) || ! in_array($value, $options, true)) {
                throw new InvalidAiRefinementException("Refinement operation {$index} has an invalid theme value.");
            }

            $normalized[$key] = $value;
        }

        return ['op' => 'update_theme', 'changes' => $normalized];
    }

    /**
     * @param  array<string, mixed>  $content
     * @return array<string, mixed>
     */
    private function validateContent(array $content, ?string $sectionType, bool $complete): array
    {
        if ($content === []) {
            throw new InvalidAiRefinementException('A section content patch cannot be empty.');
        }

        $allowed = $sectionType ? self::CONTENT_KEYS[$sectionType] : [...array_keys(self::TEXT_LIMITS), 'items'];
        $this->assertOnlyKeys($content, $allowed, 'section content');

        if ($complete && ! array_key_exists('heading', $content)) {
            throw new InvalidAiRefinementException('A new section must have a heading.');
        }

        if ($complete && in_array($sectionType, self::ITEM_TYPES, true) && ! array_key_exists('items', $content)) {
            throw new InvalidAiRefinementException('This new section must have content items.');
        }

        $normalized = [];
        foreach ($content as $key => $value) {
            if ($key !== 'items') {
                $normalized[$key] = $this->plainText($value, $key, self::TEXT_LIMITS[$key]);

                continue;
            }

            if (! is_array($value) || ! array_is_list($value) || $value === [] || count($value) > 8) {
                throw new InvalidAiRefinementException('Section items must contain between one and eight entries.');
            }

            $normalized['items'] = array_map(function (mixed $item): array {
                if (! is_array($item)) {
                    throw new InvalidAiRefinementException('A section item is invalid.');
                }

                $this->assertOnlyKeys($item, ['title', 'body'], 'section item');

                return [
                    'title' => $this->plainText($item['title'] ?? null, 'item title', 160),
                    'body' => $this->plainText($item['body'] ?? null, 'item body', 1200),
                ];
            }, $value);
        }

        return $normalized;
    }

    private function plainText(mixed $value, string $field, int $maximum): string
    {
        if (! is_string($value)) {
            throw new InvalidAiRefinementException("The {$field} must be text.");
        }

        $value = trim($value);

        if ($value === '' || Str::length($value) > $maximum) {
            throw new InvalidAiRefinementException("The {$field} has an invalid length.");
        }

        if (preg_match('/<[^>]*>/u', $value)
            || preg_match('/(?:https?:\/\/|www\.|javascript\s*:|data\s*:)/iu', $value)
            || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', $value)) {
            throw new InvalidAiRefinementException("The {$field} contains unsupported content.");
        }

        return $value;
    }

    private function positiveInteger(mixed $value, string $field): int
    {
        if (! is_int($value) && ! (is_string($value) && ctype_digit($value))) {
            throw new InvalidAiRefinementException("The {$field} is invalid.");
        }

        $value = (int) $value;

        if ($value < 1) {
            throw new InvalidAiRefinementException("The {$field} is invalid.");
        }

        return $value;
    }

    /**
     * @param  array<string, mixed>  $value
     * @param  list<string>  $allowed
     */
    private function assertOnlyKeys(array $value, array $allowed, string $field): void
    {
        if (array_diff(array_keys($value), $allowed) !== []) {
            throw new InvalidAiRefinementException("The {$field} contains unsupported fields.");
        }
    }
}
