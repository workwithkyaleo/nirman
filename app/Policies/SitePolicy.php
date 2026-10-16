<?php

namespace App\Policies;

use App\Models\Site;
use App\Models\User;

class SitePolicy
{
    public function before(User $user): ?bool
    {
        return $user->is_super_admin ? true : null;
    }

    public function view(User $user, Site $site): bool
    {
        return $site->users()->whereKey($user->id)->exists();
    }

    public function update(User $user, Site $site): bool
    {
        return $site->users()->whereKey($user->id)->wherePivotIn('role', ['owner', 'admin'])->exists();
    }

    public function manageStore(User $user, Site $site): bool
    {
        return $site->users()->whereKey($user->id)->wherePivotIn('role', ['owner', 'admin', 'staff'])->exists();
    }
}
