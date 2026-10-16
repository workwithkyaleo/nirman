<?php

namespace App\Support;

use Closure;
use Illuminate\Validation\Rule;

class SectionElements
{
    /** @return list<string> */
    public static function targetKeys(): array
    {
        $keys = ['eyebrow', 'heading', 'body', 'image', 'primary_action', 'secondary_action', 'action', 'decoration'];
        for ($index = 0; $index < 12; $index++) {
            foreach (['title', 'description', 'image'] as $field) {
                $keys[] = "item_{$index}_{$field}";
            }
        }

        return $keys;
    }

    public static function rules(Closure $imageReference): array
    {
        $allowed = implode(',', self::targetKeys());
        $color = ['nullable', 'string', 'regex:/\A#[0-9a-fA-F]{6}\z/'];
        $link = ['nullable', 'string', 'max:2048', function (string $attribute, mixed $value, Closure $fail): void {
            if (is_string($value) && $value !== '' && ! SafeHyperlink::isValid($value)) {
                $fail('The :attribute must be a website address, email, phone number, page path or anchor.');
            }
        }];

        return [
            'content.links' => ['nullable', 'array:'.$allowed],
            'content.links.*' => $link,
            'content.element_layouts' => ['nullable', 'array:'.$allowed],
            'content.element_layouts.*' => ['nullable', 'array:x,y,width,height,rotation,layer,hidden'],
            'content.element_layouts.*.hidden' => ['sometimes', 'boolean'],
            'content.element_layouts.*.x' => ['nullable', 'numeric', 'between:-100,100'],
            'content.element_layouts.*.y' => ['nullable', 'numeric', 'between:-1000,1000'],
            ...self::layoutRules('content.element_layouts.*'),
            'content.elements' => ['nullable', 'array', 'list', 'max:30'],
            'content.elements.*' => ['required', 'array:id,type,text,image,image_alt,font,color,text_style,shape,fill,border_color,border_width,radius,href,new_tab,layout'],
            'content.elements.*.id' => ['required', 'string', 'max:64', 'distinct:strict', 'regex:/\A[A-Za-z0-9_-]+\z/'],
            'content.elements.*.type' => ['required', Rule::in(['text', 'image', 'shape', 'button'])],
            'content.elements.*.text' => ['nullable', 'string', 'max:2500'],
            'content.elements.*.image' => ['nullable', 'string', 'max:2048', $imageReference],
            'content.elements.*.image_alt' => ['nullable', 'string', 'max:180'],
            'content.elements.*.font' => ['nullable', 'string', Rule::in(TextFontCatalog::names())],
            'content.elements.*.color' => $color,
            ...TextStyleRules::for('content.elements.*.text_style'),
            'content.elements.*.shape' => ['nullable', Rule::in(['rectangle', 'rounded', 'circle', 'triangle', 'star', 'diamond', 'line', 'arch'])],
            'content.elements.*.fill' => $color,
            'content.elements.*.border_color' => $color,
            'content.elements.*.border_width' => ['nullable', 'numeric', 'between:0,16'],
            'content.elements.*.radius' => ['nullable', 'numeric', 'between:0,100'],
            'content.elements.*.href' => $link,
            'content.elements.*.new_tab' => ['sometimes', 'boolean'],
            'content.elements.*.layout' => ['nullable', 'array:x,y,width,height,rotation,layer'],
            'content.elements.*.layout.x' => ['nullable', 'numeric', 'between:0,100'],
            'content.elements.*.layout.y' => ['nullable', 'numeric', 'between:0,100'],
            ...self::layoutRules('content.elements.*.layout'),
        ];
    }

    private static function layoutRules(string $field): array
    {
        return [
            "{$field}.width" => ['nullable', 'numeric', 'between:2,100'],
            "{$field}.height" => ['nullable', 'numeric', 'between:16,1200'],
            "{$field}.rotation" => ['nullable', 'numeric', 'between:-180,180'],
            "{$field}.layer" => ['nullable', 'integer', 'between:0,30'],
        ];
    }
}
