<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ApplyTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'template_id' => ['required', 'integer', Rule::exists('templates', 'id')->where('is_active', true)],
            'mode' => ['sometimes', 'string', Rule::in(['design', 'layout'])],
        ];
    }
}
