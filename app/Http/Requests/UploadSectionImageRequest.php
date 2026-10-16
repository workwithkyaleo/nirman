<?php

namespace App\Http\Requests;

use App\Models\Section;
use App\Models\Site;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UploadSectionImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        $site = $this->route('site');
        $section = $this->route('section');

        if (! $site instanceof Site || ! $section instanceof Section || ! $this->user()?->can('update', $site)) {
            return false;
        }

        abort_unless((int) $section->site_id === (int) $site->id, 404);

        return true;
    }

    public function rules(): array
    {
        return [
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120', 'dimensions:max_width=6000,max_height=6000'],
            'target' => ['required', Rule::in(['section', 'background', 'hero', 'item'])],
            'item_index' => ['nullable', 'required_if:target,item', 'prohibited_unless:target,item', 'integer', 'min:0', 'max:11'],
        ];
    }

    public function after(): array
    {
        return [function ($validator): void {
            if ($this->input('target') !== 'item' || $validator->errors()->has('item_index')) {
                return;
            }

            $index = $this->integer('item_index');
            $items = $this->route('section')?->content['items'] ?? [];

            if (! is_array($items) || ! array_key_exists($index, $items)) {
                $validator->errors()->add('item_index', 'The selected section item no longer exists.');
            }
        }];
    }
}
