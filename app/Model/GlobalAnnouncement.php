<?php

namespace App\Model;

use Illuminate\Database\Eloquent\Model;

class GlobalAnnouncement extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'content', 'is_published', 'is_dismissible', 'size', 'is_global', 'expiring_at',
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
    ];
}
