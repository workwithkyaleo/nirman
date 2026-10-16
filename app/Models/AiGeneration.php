<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiGeneration extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['input' => 'array', 'output' => 'array', 'applied_at' => 'datetime'];
    }

    public function site()
    {
        return $this->belongsTo(Site::class);
    }
}
