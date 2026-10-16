<?php

namespace App\Services\Ai;

use App\Models\Site;

class LocalWebsiteGenerator implements WebsiteGenerator
{
    public function generate(Site $site, array $brief): array
    {
        $name = $site->name;
        $category = $site->category ?: 'local business';
        $services = collect(preg_split('/\r\n|\r|\n|,/', $brief['services'] ?? 'Personal service,Trusted quality,Local expertise'))->filter()->take(6)->values()->map(fn ($service) => ['title' => trim($service), 'body' => "A thoughtfully delivered offering from {$name}."])->all();
        $promise = $brief['unique_value'] ?? 'Careful work, honest value and friendly local support.';
        $contact = collect([$site->address, $site->phone, $site->email, data_get($site->business_hours, 'display')])->filter()->join(' · ');

        $sectorItems = collect($services)->map(fn (array $service) => [
            ...$service,
            'image' => '',
        ])->all();

        $sectionContent = [
            'hero' => ['eyebrow' => $brief['style'] ?? 'Made with purpose', 'heading' => "Welcome to {$name}", 'body' => $site->description, 'background_image' => '', 'primary_action' => $site->type === 'store' ? 'Shop now' : 'Get started', 'secondary_action' => 'Learn more'],
            'services' => ['heading' => $site->type === 'store' ? 'Explore what we make' : 'How we can help', 'items' => $services],
            'features' => ['heading' => 'Why people choose us', 'items' => [['title' => 'Our promise', 'body' => $promise], ['title' => 'Made for you', 'body' => 'A personal experience shaped around the people we serve.'], ['title' => 'Easy to reach', 'body' => $site->whatsapp ? 'Call or WhatsApp us whenever you need help.' : 'Friendly support whenever you need help.']]],
            'text' => ['heading' => "A little about {$name}", 'body' => "We created {$name} for ".($brief['target_customers'] ?? 'our community').". {$promise}"],
            'gallery' => ['heading' => 'A closer look', 'body' => 'A glimpse of the care, craft and people behind our work.', 'items' => collect($services)->take(4)->map(fn (array $service) => [...$service, 'image' => ''])->all()],
            'testimonials' => ['heading' => 'Why our customers return', 'items' => [['title' => 'Trusted locally', 'body' => "{$name} is built around thoughtful service and lasting relationships."], ['title' => 'Made with care', 'body' => $promise]]],
            'faq' => ['heading' => 'Questions, answered', 'items' => [['title' => 'How do I get started?', 'body' => 'Contact us with what you need and we will guide you through the next step.'], ['title' => 'Who do you work with?', 'body' => 'We help '.($brief['target_customers'] ?? 'people throughout our community').'.']]],
            'contact' => ['heading' => 'Let’s start a conversation', 'body' => $contact ?: 'Call, message or visit us. We would love to hear from you.'],
            'map' => ['heading' => 'Visit us', 'body' => $site->address ?: 'Find our business location.'],
            'cta' => ['heading' => 'Ready to take the next step?', 'body' => 'Tell us what you need and we will be happy to help.', 'action' => 'Contact us'],
            'sectors' => ['eyebrow' => 'What we do', 'heading' => 'Our business sectors', 'body' => "Explore the services, industries and markets served by {$name}.", 'items' => $sectorItems],
            'products' => ['eyebrow' => 'Selected for you', 'heading' => 'Featured products', 'body' => 'Discover featured products chosen and made with care.', 'featured_only' => true],
        ];

        $homeTypes = data_get($site->template?->blueprint, 'home_sections', ['hero', 'services', 'features', 'cta']);
        if ($site->type === 'store' && ! in_array('products', $homeTypes, true)) {
            array_splice($homeTypes, min(1, count($homeTypes)), 0, ['products']);
        }
        $homeSections = collect($homeTypes)
            ->filter(fn (string $type) => isset($sectionContent[$type]))
            ->map(fn (string $type) => ['type' => $type, 'content' => $sectionContent[$type]])
            ->values()
            ->all();

        $pages = [
            [
                'title' => 'Home',
                'slug' => 'home',
                'sections' => $homeSections,
            ],
            [
                'title' => 'About',
                'slug' => 'about',
                'sections' => [['type' => 'text', 'content' => ['heading' => "About {$name}", 'body' => "We built {$name} for ".($brief['target_customers'] ?? 'our community').". {$promise}"]]],
            ],
            [
                'title' => 'Contact',
                'slug' => 'contact',
                'sections' => [['type' => 'contact', 'content' => ['heading' => 'Let’s start a conversation', 'body' => $contact ?: 'Call, message or visit us. We would love to hear from you.']], ['type' => 'map', 'content' => ['heading' => 'Visit us', 'body' => $site->address ?: 'Find our business location.']]],
            ],
        ];
        $runsMultipleCompanies = $site->type === 'business'
            && (! array_key_exists('company_count', $brief) || (int) $brief['company_count'] > 1);
        if ($runsMultipleCompanies) {
            array_splice($pages, 2, 0, [[
                'title' => 'Our Businesses',
                'slug' => 'business',
                'sections' => [['type' => 'sectors', 'content' => ['eyebrow' => 'Our companies', 'heading' => 'Our businesses', 'body' => "Explore the companies, services and markets led by {$name}.", 'items' => $sectorItems]]],
            ]]);
        }
        if ($site->type === 'store') {
            array_splice($pages, 1, 0, [[
                'title' => 'Shop', 'slug' => 'shop',
                'sections' => [['type' => 'products', 'content' => ['heading' => 'Shop our collection', 'body' => 'Discover products chosen and made with care.']]],
            ]]);
        }

        return ['title' => $name, 'tagline' => "Thoughtful {$category}, made simple.", 'seo' => ['title' => "{$name} | {$category}", 'description' => str($site->description)->limit(155)->toString()], 'pages' => $pages];
    }
}
