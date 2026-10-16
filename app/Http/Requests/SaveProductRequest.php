<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'], 'category' => ['nullable', 'string', 'max:100'],
            'sku' => ['nullable', 'string', 'max:80', Rule::unique('products', 'sku')->where('site_id', $this->route('site')->id)->ignore($this->route('product'))], 'description' => ['nullable', 'string', 'max:3000'],
            'price' => ['required', 'decimal:0,2', 'min:0', 'max:99999999'], 'sale_price' => ['nullable', 'decimal:0,2', 'min:0', 'lte:price'],
            'stock_quantity' => ['required', 'integer', 'min:0', 'max:1000000'],
            'is_featured' => ['required', 'boolean'], 'is_active' => ['required', 'boolean'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'colors' => ['nullable', 'array', 'max:20'],
            'colors.*.id' => ['nullable', 'integer'],
            'colors.*.name' => ['required', 'string', 'max:80'],
            'colors.*.color_hex' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'colors.*.image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ];
    }
}
