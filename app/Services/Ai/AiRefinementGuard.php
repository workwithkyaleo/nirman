<?php

namespace App\Services\Ai;

use App\Models\Site;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;

class AiRefinementGuard
{
    /**
     * Keep authorization at the workflow boundary as well as in the controller.
     * This prevents a future console command or job from bypassing membership.
     */
    public function assertCanManage(Site $site, int $userId): void
    {
        $user = User::query()->find($userId);

        if (! $user) {
            throw new AuthorizationException;
        }

        if ($user->is_super_admin) {
            return;
        }

        $canManage = $site->users()
            ->whereKey($user->getKey())
            ->wherePivotIn('role', ['owner', 'admin'])
            ->exists();

        if (! $canManage) {
            throw new AuthorizationException;
        }
    }
}
