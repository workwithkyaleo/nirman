<?php

namespace App\Services\Ai;

use Illuminate\Support\Str;

class LocalWebsiteRefiner
{
    /**
     * Produce deterministic, text-only operations from a user's instruction.
     * It never emits deletes, arbitrary HTML, URLs, scripts, or image fields.
     *
     * @param  array<string, mixed>  $snapshot
     * @return array{summary: string, operations: list<array<string, mixed>>}
     */
    public function propose(array $snapshot, string $prompt): array
    {
        $scope = (string) ($snapshot['scope'] ?? '');
        $site = (array) data_get($snapshot, 'context.site', []);
        $pages = $this->pages($snapshot);
        $normalizedPrompt = Str::lower($prompt);
        $operations = [];

        $themeChanges = $scope === 'site' ? $this->themeChanges($normalizedPrompt) : [];
        if ($themeChanges !== []) {
            $operations[] = ['op' => 'update_theme', 'changes' => $themeChanges];
        }

        $addition = $scope !== 'section'
            ? $this->sectionAddition($pages, $site, $normalizedPrompt)
            : null;
        if ($addition) {
            $operations[] = $addition;
        }

        $directHeading = $this->directValue($prompt, ['heading', 'headline', 'title'], 180);
        $directBody = $this->directValue($prompt, ['body', 'description', 'paragraph', 'copy'], 1200);
        $tone = $this->tone($normalizedPrompt);
        $copyIntent = (bool) preg_match('/\b(rewrite|improve|refine|copy|wording|message|content|clearer|tone|voice)\b/u', $normalizedPrompt);
        $copyRequested = $directHeading !== null
            || $directBody !== null
            || $copyIntent
            || ($tone !== 'default' && $themeChanges === []);

        if ($copyRequested || $operations === []) {
            $sections = $this->targetSections($pages, $normalizedPrompt, $scope);
            $limit = $scope === 'site' && $directHeading === null && $directBody === null ? 4 : 1;

            foreach (array_slice($sections, 0, $limit) as $section) {
                $content = $this->copyPatch($section, $site, $prompt, $tone, $directHeading, $directBody);

                if ($content !== []) {
                    $operations[] = [
                        'op' => 'update_section',
                        'section_id' => (int) $section['id'],
                        'content' => $content,
                    ];
                }
            }
        }

        if ($operations === []) {
            throw new InvalidAiRefinementException('There is no editable content in this scope.');
        }

        $parts = [];
        if ($themeChanges !== []) {
            $parts[] = 'design';
        }
        if ($addition) {
            $parts[] = 'a new section';
        }
        if (collect($operations)->contains(fn (array $operation) => $operation['op'] === 'update_section')) {
            $parts[] = 'website copy';
        }

        return [
            'summary' => 'Prepared '.Str::of(implode(', ', $parts))->replaceLast(', ', ' and ')->toString().' updates for review.',
            'operations' => $operations,
        ];
    }

    /**
     * @param  array<string, mixed>  $snapshot
     * @return list<array<string, mixed>>
     */
    private function pages(array $snapshot): array
    {
        return match ($snapshot['scope'] ?? null) {
            'site' => array_values((array) data_get($snapshot, 'draft.pages', [])),
            'page' => [data_get($snapshot, 'draft.page', [])],
            'section' => [[
                ...(array) ($snapshot['page'] ?? []),
                'sections' => [data_get($snapshot, 'draft.section', [])],
            ]],
            default => [],
        };
    }

    /**
     * @param  list<array<string, mixed>>  $pages
     * @return list<array<string, mixed>>
     */
    private function targetSections(array $pages, string $prompt, string $scope): array
    {
        $sections = collect($pages)
            ->flatMap(fn (array $page) => (array) ($page['sections'] ?? []))
            ->filter(fn (mixed $section) => is_array($section) && isset($section['id'], $section['type']))
            ->values();

        if ($sections->isEmpty()) {
            return [];
        }

        $mentionedType = $this->mentionedSectionType($prompt);
        if ($mentionedType) {
            $matching = $sections->where('type', $mentionedType)->values();
            if ($matching->isNotEmpty()) {
                return $matching->all();
            }
        }

        if ($scope === 'section') {
            return [$sections->first()];
        }

        return $sections
            ->sortBy(fn (array $section) => $section['type'] === 'hero' ? -1 : (int) ($section['sort_order'] ?? 0))
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $section
     * @param  array<string, mixed>  $site
     * @return array<string, mixed>
     */
    private function copyPatch(
        array $section,
        array $site,
        string $prompt,
        string $tone,
        ?string $directHeading,
        ?string $directBody,
    ): array {
        $name = $this->clean((string) ($site['name'] ?? 'Your business'), 120) ?: 'Your business';
        $category = $this->clean((string) ($site['category'] ?? 'service'), 100) ?: 'service';
        $type = (string) ($section['type'] ?? 'text');
        $current = (array) ($section['content'] ?? []);
        $focus = $this->focus($prompt);

        if ($directHeading !== null || $directBody !== null) {
            return array_filter([
                'heading' => $directHeading,
                'body' => $directBody,
            ], fn (mixed $value) => is_string($value) && $value !== '');
        }

        if ($tone === 'concise') {
            $heading = $this->shorten((string) ($current['heading'] ?? $this->heading($type, 'default', $name, $category)), 72);
            $body = $this->shorten((string) ($current['body'] ?? "{$name} offers dependable {$category} with friendly local service."), 180);

            return ['heading' => $heading, 'body' => $body];
        }

        $heading = $this->heading($type, $tone, $name, $category);
        $body = $focus
            ? "{$name} puts {$focus} at the heart of every experience, with clear guidance and thoughtful service from start to finish."
            : $this->body($type, $tone, $name, $category);

        return [
            'heading' => $this->clean($heading, 180),
            'body' => $this->clean($body, 1200),
        ];
    }

    private function heading(string $type, string $tone, string $name, string $category): string
    {
        if ($type === 'hero') {
            return match ($tone) {
                'professional' => "Dependable {$category}, delivered by {$name}",
                'friendly' => "Welcome to {$name} — we’re glad you’re here",
                'bold' => "{$name}. Built to make an impact.",
                'elegant' => "Thoughtful {$category}, beautifully delivered",
                default => "A better way to experience {$category}",
            };
        }

        return match ($type) {
            'services' => 'Services designed around you',
            'features' => "Why choose {$name}",
            'sectors' => 'Experience across the work that matters',
            'testimonials' => 'Trusted by the people we serve',
            'faq' => 'Helpful answers, all in one place',
            'gallery' => 'A closer look at our work',
            'contact' => 'Let’s start a conversation',
            'map' => 'Come and visit us',
            'cta' => 'Ready to take the next step?',
            default => "The {$name} story",
        };
    }

    private function body(string $type, string $tone, string $name, string $category): string
    {
        $ending = match ($tone) {
            'professional' => 'Expect clear communication, dependable delivery and careful attention to detail.',
            'friendly' => 'Tell us what you need—we’ll be happy to help and make the next step easy.',
            'bold' => 'Clear value, confident ideas and results you can feel from day one.',
            'elegant' => 'Every detail is considered to create an experience that feels personal and refined.',
            default => 'We keep every step clear, thoughtful and easy to understand.',
        };

        return match ($type) {
            'contact' => "Have a question or an idea? The {$name} team is ready to listen and help. {$ending}",
            'faq' => "Find straightforward answers about working with {$name}. {$ending}",
            'testimonials' => "Real experiences from customers who chose {$name}. {$ending}",
            'services', 'features', 'sectors' => "Explore {$category} shaped around real customer needs. {$ending}",
            'cta' => "Talk with {$name} about what you want to achieve. {$ending}",
            default => "{$name} brings care and practical expertise to {$category}. {$ending}",
        };
    }

    /**
     * @param  list<array<string, mixed>>  $pages
     * @param  array<string, mixed>  $site
     * @return array<string, mixed>|null
     */
    private function sectionAddition(array $pages, array $site, string $prompt): ?array
    {
        if (! preg_match('/\b(add|create|include|insert)\b/u', $prompt)) {
            return null;
        }

        $type = $this->mentionedSectionType($prompt);
        if (! $type) {
            return null;
        }

        $page = collect($pages)->firstWhere('slug', 'home') ?? ($pages[0] ?? null);
        if (! is_array($page) || ! isset($page['id'])) {
            return null;
        }

        return [
            'op' => 'add_section',
            'page_id' => (int) $page['id'],
            'type' => $type,
            'content' => $this->newSectionContent($type, $site),
        ];
    }

    /** @param array<string, mixed> $site */
    private function newSectionContent(string $type, array $site): array
    {
        $name = $this->clean((string) ($site['name'] ?? 'Our business'), 120) ?: 'Our business';

        return match ($type) {
            'hero' => ['eyebrow' => 'Welcome', 'heading' => "Discover {$name}", 'body' => 'Thoughtful service, clear value and a team ready to help.'],
            'features' => ['heading' => "Why choose {$name}", 'items' => [['title' => 'Thoughtful service', 'body' => 'Support shaped around what customers genuinely need.'], ['title' => 'Dependable quality', 'body' => 'Careful work and clear communication at every step.'], ['title' => 'Easy to begin', 'body' => 'A straightforward path from first question to finished result.']]],
            'gallery' => ['heading' => 'A closer look at our work', 'items' => [['title' => 'Made with care', 'body' => 'A showcase of thoughtful details and recent work.']]],
            'testimonials' => ['heading' => 'What customers say', 'items' => [['title' => 'A wonderful experience', 'body' => 'Add a genuine customer story here before publishing.']]],
            'faq' => ['heading' => 'Frequently asked questions', 'items' => [['title' => 'How do I get started?', 'body' => 'Contact our team and tell us what you need. We will guide you through the next step.'], ['title' => 'Can you tailor the service?', 'body' => 'Yes. We can discuss your needs and recommend the most suitable approach.']]],
            'contact' => ['heading' => 'Let’s talk', 'body' => "Contact {$name} and tell us how we can help."],
            'map' => ['heading' => 'Visit us', 'body' => 'Find our location and plan your visit.'],
            'cta' => ['heading' => 'Ready to get started?', 'body' => "Take the next step with {$name} today.", 'action' => 'Contact us'],
            'services' => ['heading' => 'How we can help', 'items' => [['title' => 'Personal guidance', 'body' => 'A clear recommendation shaped around your needs.'], ['title' => 'Dependable delivery', 'body' => 'Careful service and communication from start to finish.']]],
            'sectors' => ['heading' => 'Who we work with', 'items' => [['title' => 'Local customers', 'body' => 'Thoughtful service for people and organisations in our community.']]],
            default => ['heading' => "About {$name}", 'body' => "Learn what guides {$name} and the care behind every customer experience."],
        };
    }

    /** @return array<string, string> */
    private function themeChanges(string $prompt): array
    {
        $changes = [];
        $designIntent = (bool) preg_match('/\b(colou?r|palette|theme|design|style|font|layout|corner|button|look|spacing|motion|hero|header|card|image)\b/u', $prompt);
        $palettes = [
            'blue' => ['primary' => '#2563eb', 'secondary' => '#1e3a8a', 'accent' => '#f59e0b'],
            'green' => ['primary' => '#0f766e', 'secondary' => '#134e4a', 'accent' => '#f59e0b'],
            'purple' => ['primary' => '#7c3aed', 'secondary' => '#3b1d66', 'accent' => '#ec4899'],
            'red' => ['primary' => '#b42318', 'secondary' => '#5f1b16', 'accent' => '#f59e0b'],
            'orange' => ['primary' => '#c2410c', 'secondary' => '#7c2d12', 'accent' => '#facc15'],
            'dark' => ['primary' => '#1f2937', 'secondary' => '#111827', 'accent' => '#f59e0b', 'background' => '#111827', 'text' => '#f9fafb'],
        ];

        foreach ($palettes as $word => $palette) {
            if (preg_match('/\b'.preg_quote($word, '/').'\b/u', $prompt)
                && preg_match('/\b(colou?r|palette|theme|design|style|make|use|change)\b/u', $prompt)) {
                $changes = [...$changes, ...$palette];
                break;
            }
        }

        if ($designIntent && preg_match('/\bminimal(?:ist)?\b/u', $prompt)) {
            $changes = [...$changes, 'style' => 'minimal', 'heading_font' => 'DM Sans', 'body_font' => 'Inter', 'radius' => '0px', 'button_style' => 'outline', 'header_layout' => 'minimal', 'footer_layout' => 'minimal', 'section_spacing' => 'comfortable', 'card_style' => 'flat', 'heading_scale' => 'compact', 'motion' => 'none', 'image_shape' => 'square', 'divider_style' => 'subtle'];
        } elseif ($designIntent && preg_match('/\b(elegant|luxury|luxurious|refined)\b/u', $prompt)) {
            $changes = [...$changes, 'style' => 'elegant', 'heading_font' => 'Playfair Display', 'body_font' => 'Inter', 'radius' => '8px', 'button_style' => 'outline', 'card_style' => 'bordered', 'heading_scale' => 'balanced', 'motion' => 'subtle'];
        } elseif ($designIntent && preg_match('/\b(bold|energetic|vibrant)\b/u', $prompt)) {
            $changes = [...$changes, 'style' => 'bold', 'heading_font' => 'Poppins', 'body_font' => 'DM Sans', 'radius' => '24px', 'button_style' => 'rounded', 'card_style' => 'elevated', 'heading_scale' => 'display', 'motion' => 'expressive'];
        } elseif ($designIntent && preg_match('/\btraditional\b/u', $prompt)) {
            $changes = [...$changes, 'style' => 'traditional', 'heading_font' => 'Playfair Display', 'body_font' => 'Manrope', 'radius' => '8px', 'button_style' => 'solid', 'heading_scale' => 'balanced', 'motion' => 'subtle'];
        } elseif ($designIntent && preg_match('/\bmodern\b/u', $prompt)) {
            $changes = [...$changes, 'style' => 'modern', 'heading_font' => 'Manrope', 'body_font' => 'Inter', 'radius' => '16px', 'button_style' => 'solid', 'card_style' => 'elevated', 'heading_scale' => 'balanced', 'motion' => 'subtle'];
        }

        if ($designIntent && preg_match('/\brounded\b/u', $prompt)) {
            $changes = [...$changes, 'radius' => '24px', 'button_style' => 'rounded', 'image_shape' => 'rounded'];
        } elseif ($designIntent && preg_match('/\b(square|sharp)\b/u', $prompt)) {
            $changes = [...$changes, 'radius' => '0px', 'image_shape' => 'square'];
        }

        if ($designIntent && preg_match('/\b(no motion|disable animations?|static)\b/u', $prompt)) {
            $changes['motion'] = 'none';
        }

        if ($designIntent && preg_match('/\b(full[- ]?screen|full height|tall hero)\b/u', $prompt)) {
            $changes['hero_height'] = 'screen';
        } elseif ($designIntent && preg_match('/\b(short|compact) hero\b/u', $prompt)) {
            $changes['hero_height'] = 'compact';
        }

        return $changes;
    }

    private function tone(string $prompt): string
    {
        return match (true) {
            (bool) preg_match('/\b(short|shorter|concise|brief|simplify)\b/u', $prompt) => 'concise',
            (bool) preg_match('/\b(professional|formal|credible|trustworthy)\b/u', $prompt) => 'professional',
            (bool) preg_match('/\b(friendly|warm|welcoming|approachable|casual)\b/u', $prompt) => 'friendly',
            (bool) preg_match('/\b(bold|strong|energetic|confident)\b/u', $prompt) => 'bold',
            (bool) preg_match('/\b(elegant|luxury|luxurious|premium|refined)\b/u', $prompt) => 'elegant',
            default => 'default',
        };
    }

    private function mentionedSectionType(string $prompt): ?string
    {
        $types = [
            'faq' => '/\b(faq|frequently asked|questions? and answers?)\b/u',
            'testimonials' => '/\b(testimonials?|reviews?|customer stories)\b/u',
            'services' => '/\b(services?|offerings?)\b/u',
            'features' => '/\b(features?|benefits?|why choose)\b/u',
            'gallery' => '/\b(gallery|portfolio|showcase)\b/u',
            'contact' => '/\b(contact|reach us|get in touch)\b/u',
            'map' => '/\b(map|location|visit us)\b/u',
            'cta' => '/\b(cta|call to action)\b/u',
            'sectors' => '/\b(sectors?|industries)\b/u',
            'hero' => '/\b(hero|banner|top section)\b/u',
            'text' => '/\b(about|story|team|text section)\b/u',
        ];

        foreach ($types as $type => $pattern) {
            if (preg_match($pattern, $prompt)) {
                return $type;
            }
        }

        return null;
    }

    /** @param list<string> $labels */
    private function directValue(string $prompt, array $labels, int $maximum): ?string
    {
        $labelPattern = implode('|', array_map(fn (string $label) => preg_quote($label, '/'), $labels));

        if (preg_match('/\b(?:'.$labelPattern.')\s*(?:to|as|:)\s*["“‘\']([^"”’\']{2,500})["”’\']/iu', $prompt, $match)) {
            return $this->clean($match[1], $maximum) ?: null;
        }

        if (preg_match('/\b(?:'.$labelPattern.')\s*(?:to|as|:)\s*([^\n.!?]{2,500})/iu', $prompt, $match)) {
            return $this->clean($match[1], $maximum) ?: null;
        }

        return null;
    }

    private function focus(string $prompt): ?string
    {
        if (! preg_match('/\b(?:focus|emphasize|emphasise|highlight)\s+(?:on\s+)?([^.!?\n]{3,100})/iu', $prompt, $match)) {
            return null;
        }

        return $this->clean($match[1], 100) ?: null;
    }

    private function shorten(string $value, int $maximum): string
    {
        $value = $this->clean($value, $maximum);

        return $value !== '' ? $value : 'Clear, thoughtful service made simple.';
    }

    private function clean(string $value, int $maximum): string
    {
        $value = strip_tags($value);
        $value = preg_replace('/(?:https?:\/\/|www\.|javascript\s*:|data\s*:)[^\s]+/iu', '', $value) ?? '';
        $value = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $value) ?? '';
        $value = preg_replace('/\s+/u', ' ', $value) ?? '';

        return trim(Str::limit(trim($value), $maximum, ''));
    }
}
