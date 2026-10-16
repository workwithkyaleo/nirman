<?php

namespace App\Services\Ai;

use App\Models\Site;

interface WebsiteGenerator
{
    public function generate(Site $site, array $brief): array;
}
