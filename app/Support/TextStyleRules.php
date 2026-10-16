<?php

namespace App\Support;

use Illuminate\Validation\Rule;

class TextStyleRules
{
    public static function for(string $field): array
    {
        $rules = [
            $field => ['nullable', 'array:bold,italic,underline,strikethrough,uppercase,size,line_height,letter_spacing,align,weight,animation,animation_duration,animation_delay'],
            "{$field}.size" => ['sometimes', 'numeric', 'min:10', 'max:120'],
            "{$field}.line_height" => ['sometimes', 'numeric', 'min:0.8', 'max:2.5'],
            "{$field}.letter_spacing" => ['sometimes', 'numeric', 'min:-2', 'max:12'],
            "{$field}.align" => ['sometimes', Rule::in(['left', 'center', 'right', 'justify'])],
            "{$field}.weight" => ['sometimes', 'integer', Rule::in([300, 400, 500, 600, 700, 800, 900])],
            "{$field}.animation" => ['sometimes', 'string', Rule::in(['none', 'fade', 'rise', 'slide', 'zoom', 'blur'])],
            "{$field}.animation_duration" => ['sometimes', 'integer', 'min:200', 'max:2000'],
            "{$field}.animation_delay" => ['sometimes', 'integer', 'min:0', 'max:2000'],
        ];
        foreach (['bold', 'italic', 'underline', 'strikethrough', 'uppercase'] as $property) {
            $rules["{$field}.{$property}"] = ['sometimes', 'boolean'];
        }

        return $rules;
    }
}
