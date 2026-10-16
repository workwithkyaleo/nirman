<?php

namespace App\Support;

class TemplateCatalog
{
    /**
     * The product-owned template catalog. Content stays structured; templates
     * only control allowed section blueprints and validated design tokens.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function all(): array
    {
        return [
            self::template('Sajilo Launch', 'sajilo-launch', 'Business', 'Clean and confident', '#0f766e', '#123f38', '#f4b740', '#fffdf7', '#17201e', 'Manrope', 'Inter', '16px', 'solid', 'split', 'columns', 'generous', ['hero', 'services', 'features', 'testimonials', 'cta']),
            self::template('Everest Commerce', 'everest-commerce', 'Online store', 'Editorial product storytelling', '#1f3a34', '#d8e0d5', '#d98742', '#f5f0e8', '#202824', 'Playfair Display', 'Inter', '8px', 'solid', 'minimal', 'columns', 'comfortable', ['hero', 'products', 'features', 'testimonials', 'cta']),
            self::template('Thamel Bold', 'thamel-bold', 'Creative', 'Bright, expressive and playful', '#4f36e8', '#17133c', '#ff624d', '#fff7e9', '#18152d', 'Poppins', 'DM Sans', '24px', 'rounded', 'split', 'centered', 'generous', ['hero', 'gallery', 'services', 'testimonials', 'cta']),
            self::template('Himalayan Calm', 'himalayan-calm', 'Wellness', 'Soft and restorative', '#477a6a', '#284a41', '#d9a96c', '#f1f3ed', '#273b35', 'Playfair Display', 'Manrope', '24px', 'rounded', 'centered', 'centered', 'generous', ['hero', 'services', 'text', 'testimonials', 'contact']),
            self::template('Aangan Kitchen', 'aangan-kitchen', 'Restaurant', 'Warm, hospitable and rich', '#a33b24', '#54241c', '#e7a92f', '#fff4df', '#3c211b', 'Playfair Display', 'Manrope', '8px', 'solid', 'split', 'columns', 'comfortable', ['hero', 'services', 'gallery', 'testimonials', 'contact']),
            self::template('Summit Studio', 'summit-studio', 'Portfolio', 'Minimal work-first portfolio', '#1d2422', '#363f3c', '#98a7a2', '#f4f4ef', '#1d2422', 'DM Sans', 'Inter', '0px', 'outline', 'minimal', 'minimal', 'compact', ['hero', 'gallery', 'services', 'text', 'contact']),
            self::template('Naya Tech', 'naya-tech', 'Technology', 'Sharp, modern and conversion-led', '#175cd3', '#102a56', '#42c7b8', '#f5f8ff', '#13213a', 'Poppins', 'Inter', '16px', 'solid', 'split', 'columns', 'comfortable', ['hero', 'features', 'services', 'faq', 'cta']),
            self::template('Nyaya Professional', 'nyaya-professional', 'Professional services', 'Trustworthy and authoritative', '#243b61', '#17253f', '#c69b54', '#f8f5ef', '#202b3d', 'Playfair Display', 'Inter', '8px', 'outline', 'split', 'columns', 'comfortable', ['hero', 'services', 'text', 'features', 'contact']),
            self::template('Kanti Beauty', 'kanti-beauty', 'Beauty & fashion', 'Elegant, visual and refined', '#8d4d67', '#4d2937', '#d9ad93', '#fff7f6', '#392831', 'Playfair Display', 'DM Sans', '24px', 'rounded', 'centered', 'centered', 'generous', ['hero', 'services', 'gallery', 'testimonials', 'cta']),
            self::template('Sajha Impact', 'sajha-impact', 'Community', 'Human, open and mission-led', '#176b52', '#153f35', '#efa83b', '#f7f3e8', '#19352d', 'Manrope', 'Inter', '16px', 'solid', 'split', 'columns', 'generous', ['hero', 'text', 'features', 'gallery', 'cta']),
            self::template('Patra Editorial', 'patra-editorial', 'Stories & publishing', 'A thoughtful journal with generous typography and crisp ruled details', '#ac4528', '#3a2824', '#f0b55f', '#fcf6ed', '#2d241f', 'Lora', 'Inter', '0px', 'outline', 'centered', 'columns', 'generous', ['hero', 'text', 'gallery', 'features', 'cta'], [
                'content_width' => 'narrow',
                'hero_alignment' => 'left',
                'card_style' => 'bordered',
                'heading_scale' => 'display',
                'motion' => 'none',
                'image_shape' => 'square',
                'divider_style' => 'strong',
            ]),
            self::template('Drishti Photography', 'drishti-photography', 'Photography', 'A quiet dark gallery that gives every photograph room to breathe', '#d4ae72', '#272624', '#e5c8a2', '#151617', '#f5f2ed', 'DM Sans', 'Inter', '0px', 'outline', 'minimal', 'minimal', 'comfortable', ['hero', 'gallery', 'text', 'testimonials', 'contact'], [
                'content_width' => 'wide',
                'hero_alignment' => 'left',
                'card_style' => 'flat',
                'heading_scale' => 'display',
                'hero_height' => 'screen',
                'motion' => 'none',
                'image_shape' => 'square',
                'divider_style' => 'none',
            ]),
            self::template('Prakriti Wellness', 'prakriti-wellness', 'Health & wellbeing', 'Botanical colours, soft shapes and an unhurried introduction to your practice', '#376b53', '#244437', '#d8b98a', '#f4f6ed', '#233d2e', 'Lora', 'Manrope', '32px', 'rounded', 'centered', 'centered', 'generous', ['hero', 'text', 'services', 'faq', 'contact'], [
                'content_width' => 'narrow',
                'card_style' => 'flat',
                'image_shape' => 'rounded',
                'divider_style' => 'none',
            ]),
            self::template('Chiya Cafe', 'chiya-cafe', 'Cafe & bakery', 'Warm paper tones, a welcoming menu and a clear invitation to visit', '#6e4026', '#35251d', '#e2a24a', '#fbf0df', '#3c281f', 'Playfair Display', 'Manrope', '16px', 'rounded', 'split', 'columns', 'comfortable', ['hero', 'services', 'text', 'gallery', 'map', 'contact'], [
                'hero_alignment' => 'left',
                'card_style' => 'bordered',
                'heading_scale' => 'display',
                'header_style' => 'contrast',
            ]),
            self::template('Orbit Digital', 'orbit-digital', 'Software & digital', 'An atmospheric dark launch with luminous accents and clear feature storytelling', '#a5b4fc', '#1e2343', '#7dd3fc', '#111426', '#eef2ff', 'Manrope', 'Inter', '24px', 'rounded', 'split', 'columns', 'comfortable', ['hero', 'features', 'sectors', 'testimonials', 'faq', 'cta'], [
                'content_width' => 'wide',
                'heading_scale' => 'display',
                'hero_height' => 'screen',
                'header_style' => 'glass',
            ]),
            self::template('Doko Essentials', 'doko-essentials', 'Minimal online store', 'A simple product-first shop with clean grids and restrained typography', '#282b29', '#506457', '#b9c9ac', '#fafaf6', '#242824', 'DM Sans', 'Inter', '0px', 'outline', 'split', 'minimal', 'compact', ['hero', 'products', 'text', 'faq', 'contact'], [
                'content_width' => 'wide',
                'hero_alignment' => 'left',
                'card_style' => 'flat',
                'hero_height' => 'compact',
                'motion' => 'none',
                'image_shape' => 'square',
            ]),
        ];
    }

    /** @return array<string, mixed> */
    private static function template(string $name, string $slug, string $category, string $description, string $primary, string $secondary, string $accent, string $background, string $text, string $headingFont, string $bodyFont, string $radius, string $buttonStyle, string $headerLayout, string $footerLayout, string $spacing, array $sections, array $composition = []): array
    {
        return [
            'name' => $name,
            'slug' => $slug,
            'category' => $category,
            'blueprint' => [
                'description' => $description,
                'home_sections' => $sections,
                'visual_style' => $slug,
            ],
            'theme_defaults' => [
                'style' => self::styleFor($slug),
                'template_slug' => $slug,
                'primary' => $primary,
                'secondary' => $secondary,
                'accent' => $accent,
                'background' => $background,
                'text' => $text,
                'heading_font' => $headingFont,
                'body_font' => $bodyFont,
                'radius' => $radius,
                'button_style' => $buttonStyle,
                'section_spacing' => $spacing,
                'header_layout' => $headerLayout,
                'footer_layout' => $footerLayout,
                'content_width' => 'standard',
                'hero_alignment' => in_array($slug, ['summit-studio', 'aangan-kitchen', 'sajha-impact'], true) ? 'left' : 'center',
                'card_style' => in_array($slug, ['summit-studio', 'nyaya-professional'], true) ? 'bordered' : 'elevated',
                'heading_scale' => in_array($slug, ['thamel-bold', 'summit-studio', 'kanti-beauty'], true) ? 'display' : 'balanced',
                'hero_height' => in_array($slug, ['everest-commerce', 'naya-tech', 'sajha-impact'], true) ? 'screen' : 'standard',
                'header_style' => match ($slug) {
                    'naya-tech' => 'glass',
                    'sajha-impact' => 'contrast',
                    default => 'solid',
                },
                'motion' => in_array($slug, ['thamel-bold', 'naya-tech'], true) ? 'expressive' : 'subtle',
                'image_shape' => match ($slug) {
                    'summit-studio', 'nyaya-professional' => 'square',
                    'kanti-beauty', 'himalayan-calm' => 'rounded',
                    default => 'soft',
                },
                'divider_style' => in_array($slug, ['summit-studio', 'nyaya-professional'], true) ? 'strong' : 'subtle',
                ...$composition,
            ],
            'is_active' => true,
        ];
    }

    private static function styleFor(string $slug): string
    {
        return match ($slug) {
            'thamel-bold', 'naya-tech', 'orbit-digital' => 'bold',
            'everest-commerce', 'himalayan-calm', 'aangan-kitchen', 'nyaya-professional', 'kanti-beauty', 'patra-editorial', 'prakriti-wellness' => 'elegant',
            'summit-studio', 'drishti-photography', 'doko-essentials' => 'minimal',
            'chiya-cafe' => 'traditional',
            'sajha-impact' => 'traditional',
            default => 'modern',
        };
    }
}
