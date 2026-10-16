<?php

namespace App\Support;

use Illuminate\Validation\Rule;

class SectionAppearance
{
    public static function rules(): array
    {
        $color = ['nullable', 'string', 'regex:/\A#[0-9a-fA-F]{6}\z/'];
        $rules = [
            'content.appearance' => ['nullable', 'array:background_color,border_color,border_width,radius,spacing,alignment,decoration,decoration_color,min_height'],
            'content.appearance.min_height' => ['nullable', 'integer', 'between:240,1600'],
            'content.appearance.background_color' => $color,
            'content.appearance.border_color' => $color,
            'content.appearance.border_width' => ['nullable', 'integer', 'between:0,8'],
            'content.appearance.radius' => ['nullable', 'integer', 'between:0,64'],
            'content.appearance.spacing' => ['nullable', Rule::in(['compact', 'comfortable', 'spacious'])],
            'content.appearance.alignment' => ['nullable', Rule::in(['left', 'center', 'right'])],
            'content.appearance.decoration' => ['nullable', Rule::in(['none', 'circle', 'arch', 'diagonal'])],
            'content.appearance.decoration_color' => $color,
        ];

        foreach (['content.image_style', 'content.items.*.image_style'] as $field) {
            $rules[$field] = ['nullable', 'array:shape,aspect_ratio,fit,position,border_color,border_width,shadow,opacity'];
            $rules["{$field}.shape"] = ['nullable', Rule::in(['rectangle', 'rounded', 'circle', 'arch', 'diamond'])];
            $rules["{$field}.aspect_ratio"] = ['nullable', Rule::in(['auto', 'landscape', 'square', 'portrait', 'wide'])];
            $rules["{$field}.fit"] = ['nullable', Rule::in(['cover', 'contain'])];
            $rules["{$field}.position"] = ['nullable', Rule::in(['center', 'top', 'bottom', 'left', 'right'])];
            $rules["{$field}.border_color"] = $color;
            $rules["{$field}.border_width"] = ['nullable', 'integer', 'between:0,8'];
            $rules["{$field}.shadow"] = ['nullable', Rule::in(['none', 'soft', 'strong'])];
            $rules["{$field}.opacity"] = ['nullable', 'integer', 'between:20,100'];
        }

        return $rules;
    }
}
