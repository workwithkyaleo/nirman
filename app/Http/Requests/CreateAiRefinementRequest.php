<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateAiRefinementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'prompt' => ['required', 'string', 'min:10', 'max:2000'],
            'scope' => ['required', Rule::in(['site', 'page', 'section'])],
            'page_id' => ['nullable', 'integer', 'required_if:scope,page,section'],
            'section_id' => ['nullable', 'integer', 'required_if:scope,section'],
        ];
    }

    public function messages(): array
    {
        return [
            'prompt.min' => 'Describe the change in a little more detail so the assistant can help.',
            'prompt.max' => 'Keep the instruction under 2,000 characters.',
        ];
    }
}
