<?php

namespace App\Support;

use App\Models\Site;
use App\Models\Template;
use InvalidArgumentException;

class TemplateLayout
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
        'products',
    ];

    /** @return list<string> */
    public function homeSectionTypes(Template $template): array
    {
        $types = data_get($template->blueprint, 'home_sections');

        if (! is_array($types) || ! array_is_list($types)) {
            return [];
        }

        return collect($types)
            ->filter(fn (mixed $type) => is_string($type) && in_array($type, self::SECTION_TYPES, true))
            ->take(20)
            ->values()
            ->all();
    }

    /** @return array<string, mixed> */
    public function defaultContent(string $type, Site $site): array
    {
        $name = trim((string) $site->name) ?: 'Your business';
        $description = trim((string) $site->description) ?: 'Tell visitors what makes your business worth choosing.';

        return match ($type) {
            'hero' => [
                'eyebrow' => 'Welcome',
                'heading' => "Welcome to {$name}",
                'body' => $description,
                'background_image' => '',
                'primary_action' => $site->type === 'store' ? 'Shop now' : 'Get started',
                'secondary_action' => 'Learn more',
            ],
            'text' => [
                'heading' => "About {$name}",
                'body' => $description,
            ],
            'features' => [
                'heading' => "Why choose {$name}",
                'items' => [
                    ['title' => 'Thoughtful service', 'body' => 'Support shaped around what customers genuinely need.'],
                    ['title' => 'Dependable quality', 'body' => 'Careful work and clear communication at every step.'],
                    ['title' => 'Easy to begin', 'body' => 'A straightforward path from first question to finished result.'],
                ],
            ],
            'gallery' => [
                'heading' => 'A closer look',
                'body' => 'Show visitors the people, products and work behind your business.',
                'items' => [
                    ['title' => 'Made with care', 'body' => 'Add an image and description for your work.', 'image' => ''],
                ],
            ],
            'testimonials' => [
                'heading' => 'What customers say',
                'items' => [
                    ['title' => 'A happy customer', 'body' => 'Add a genuine customer story here before publishing.'],
                ],
            ],
            'faq' => [
                'heading' => 'Frequently asked questions',
                'items' => [
                    ['title' => 'How do I get started?', 'body' => 'Contact our team and tell us what you need.'],
                    ['title' => 'Can the service be tailored?', 'body' => 'Yes. We can recommend an approach suited to your needs.'],
                ],
            ],
            'contact' => [
                'heading' => 'Get in touch',
                'body' => 'Call, message or visit us. We would love to hear from you.',
            ],
            'map' => [
                'heading' => 'Visit us',
                'body' => trim((string) $site->address) ?: 'Add your business address.',
            ],
            'cta' => [
                'heading' => 'Ready to get started?',
                'body' => "Contact {$name} and tell us how we can help.",
                'action' => 'Contact us',
            ],
            'services' => [
                'heading' => 'How we can help',
                'items' => [
                    ['title' => 'Personal guidance', 'body' => 'A clear recommendation shaped around your needs.'],
                    ['title' => 'Dependable delivery', 'body' => 'Careful service and communication from start to finish.'],
                ],
            ],
            'sectors' => [
                'heading' => 'Who we work with',
                'body' => 'Explore the industries and communities we serve.',
                'items' => [
                    ['title' => 'Local customers', 'body' => 'Thoughtful service for people and organisations in our community.', 'image' => ''],
                ],
            ],
            'products' => [
                'heading' => 'Featured products',
                'body' => 'Explore our latest collection.',
            ],
            default => throw new InvalidArgumentException("Unsupported template section type [{$type}]."),
        };
    }
}
