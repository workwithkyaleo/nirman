<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Page extends Model
{
    use SoftDeletes;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['show_in_navigation' => 'boolean'];
    }

    public function site()
    {
        return $this->belongsTo(Site::class);
    }

    public function sections()
    {
        return $this->hasMany(Section::class)->orderBy('sort_order');
    }

    public function versions()
    {
        return $this->hasMany(PageVersion::class);
    }
}
