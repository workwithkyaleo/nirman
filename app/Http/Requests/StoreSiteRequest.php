<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSiteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'], 'type' => ['required', 'in:business,store'],
            'company_count' => ['nullable', 'required_if:type,business', 'integer', 'min:1', 'max:50'],
            'template_id' => ['required', 'integer', Rule::exists('templates', 'id')->where('is_active', true)],
            'category' => ['required', 'string', 'max:100'], 'description' => ['required', 'string', 'max:1500'],
            'target_customers' => ['required', 'string', 'max:500'], 'address' => ['required', 'string', 'max:500'],
            'map_url' => ['nullable', 'url', 'max:1000'], 'phone' => ['required', 'string', 'max:30'],
            'email' => ['required', 'email', 'max:255'], 'whatsapp' => ['nullable', 'string', 'max:30'],
            'facebook' => ['nullable', 'url', 'max:500'], 'instagram' => ['nullable', 'url', 'max:500'],
            'tiktok' => ['nullable', 'url', 'max:500'], 'website' => ['nullable', 'url', 'max:500'],
            'opening_hours' => ['nullable', 'string', 'max:500'], 'services' => ['required', 'string', 'max:1000'],
            'unique_value' => ['required', 'string', 'max:1000'], 'primary' => ['required', 'hex_color'],
            'secondary' => ['required', 'hex_color'], 'accent' => ['required', 'hex_color'],
            'style' => ['required', 'in:modern,elegant,bold,minimal,traditional'], 'language' => ['required', 'in:en,ne,bilingual'],
            'currency' => ['required', 'in:NPR,USD,INR'], 'ordering' => ['required', 'boolean'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,svg', 'max:3072'],
        ];
    }
}
