<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['name' => 'required|string|max:120', 'phone' => 'required|string|max:30', 'email' => 'nullable|email|max:255', 'address' => 'required|string|max:500', 'city' => 'required|string|max:100', 'notes' => 'nullable|string|max:1000', 'payment_method' => 'required|in:cod'];
    }
}
