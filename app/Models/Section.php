<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Section extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['content' => 'array', 'is_visible' => 'boolean'];
    }

    public function page()
    {
        return $this->belongsTo(Page::class);
    }
}
