<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Template extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['blueprint' => 'array', 'theme_defaults' => 'array', 'is_active' => 'boolean'];
    }

    public function sites()
    {
        return $this->hasMany(Site::class);
    }
}
