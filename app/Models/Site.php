<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Site extends Model
{
    use HasFactory, SoftDeletes;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['social_links' => 'array', 'business_hours' => 'array', 'published_design' => 'array', 'published_at' => 'datetime'];
    }

    public function users()
    {
        return $this->belongsToMany(User::class)->withPivot('role')->withTimestamps();
    }

    public function pages()
    {
        return $this->hasMany(Page::class)->orderBy('sort_order');
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function theme()
    {
        return $this->hasOne(Theme::class);
    }

    public function template()
    {
        return $this->belongsTo(Template::class);
    }

    public function onboarding()
    {
        return $this->hasOne(OnboardingProgress::class);
    }

    public function aiGenerations()
    {
        return $this->hasMany(AiGeneration::class);
    }

    public function subscription()
    {
        return $this->hasOne(Subscription::class)->latestOfMany();
    }

    public function locations()
    {
        return $this->hasMany(Location::class);
    }
}
