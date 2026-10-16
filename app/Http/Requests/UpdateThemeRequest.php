<?php

namespace App\Http\Requests;

use App\Support\TextFontCatalog;
use App\Support\ThemeContrast;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateThemeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $colour = ['required', 'string', 'regex:/\A#[0-9a-fA-F]{6}\z/'];

        return [
            'style' => 'required|in:modern,elegant,bold,minimal,traditional',
            'primary' => $colour,
            'secondary' => $colour,
            'accent' => $colour,
            'background' => $colour,
            'text' => $colour,
            'heading_font' => ['required', 'string', Rule::in(TextFontCatalog::names())],
            'body_font' => ['required', 'string', Rule::in(TextFontCatalog::names())],
            'radius' => 'required|in:0px,8px,16px,24px,32px',
            'button_style' => 'required|in:solid,outline,rounded,soft',
            'section_spacing' => 'required|in:compact,comfortable,generous',
            'header_layout' => 'required|in:split,centered,minimal',
            'footer_layout' => 'required|in:columns,centered,minimal',
            'content_width' => 'sometimes|in:narrow,standard,wide',
            'hero_alignment' => 'sometimes|in:left,center',
            'card_style' => 'sometimes|in:flat,bordered,elevated',
            'heading_scale' => 'sometimes|in:compact,balanced,display',
            'hero_height' => 'sometimes|in:compact,standard,screen',
            'header_style' => 'sometimes|in:solid,glass,contrast',
            'motion' => 'sometimes|in:none,subtle,expressive',
            'image_shape' => 'sometimes|in:square,soft,rounded',
            'divider_style' => 'sometimes|in:none,subtle,strong',
        ];
    }

    /** @return array<int, callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $background = $this->input('background');
            $text = $this->input('text');

            if ($validator->errors()->has('background') || $validator->errors()->has('text')) {
                return;
            }

            if (is_string($background) && is_string($text)
                && ThemeContrast::ratio($background, $text) < 4.5) {
                $validator->errors()->add(
                    'text',
                    'Text and background colours must have at least 4.5:1 contrast.',
                );
            }
        }];
    }
}
