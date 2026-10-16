<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['delivery_address' => 'array'];
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function site()
    {
        return $this->belongsTo(Site::class);
    }

    public function events()
    {
        return $this->hasMany(OrderStatusEvent::class);
    }
}
