<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OnboardingProgress extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['data' => 'array', 'completed_at' => 'datetime'];
    }
}
