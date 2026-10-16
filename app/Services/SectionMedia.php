<?php

namespace App\Services;

use App\Models\PageVersion;
use App\Models\Section;
use App\Models\Site;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class SectionMedia
{
    public function store(Site $site, UploadedFile $image): string
    {
        $path = $image->store("sites/{$site->id}/sections", 'public');

        return '/storage/'.$path;
    }

    /** @param list<string> $references */
    public function discard(Site $site, array $references): void
    {
        foreach (array_unique($references) as $reference) {
            if ($path = $this->ownedDiskPath($site, $reference)) {
                Storage::disk('public')->delete($path);
            }
        }
    }

    /**
     * Remove replaced draft files only after proving that no other draft or
     * published page version still points at them.
     *
     * @param  array<string, mixed>  $before
     * @param  array<string, mixed>  $after
     */
    public function cleanupReplaced(Site $site, array $before, array $after): void
    {
        $removed = array_values(array_diff(
            $this->managedReferences($site, $before),
            $this->managedReferences($site, $after),
        ));

        foreach (array_unique($removed) as $reference) {
            if (! $this->isReferencedBySite($site, $reference)) {
                $this->discard($site, [$reference]);
            }
        }
    }

    /** @return list<string> */
    private function managedReferences(Site $site, mixed $value): array
    {
        if (is_string($value)) {
            return $this->ownedDiskPath($site, $value) ? [$value] : [];
        }

        if (! is_array($value)) {
            return [];
        }

        $references = [];
        foreach ($value as $child) {
            array_push($references, ...$this->managedReferences($site, $child));
        }

        return array_values(array_unique($references));
    }

    private function isReferencedBySite(Site $site, string $reference): bool
    {
        foreach (Section::query()->where('site_id', $site->id)->cursor() as $section) {
            if ($this->containsReference($section->content, $reference)) {
                return true;
            }
        }

        foreach (PageVersion::query()->where('site_id', $site->id)->cursor() as $version) {
            if ($this->containsReference($version->snapshot, $reference)) {
                return true;
            }
        }

        return false;
    }

    private function containsReference(mixed $value, string $reference): bool
    {
        if (is_string($value)) {
            return hash_equals($reference, $value);
        }

        if (! is_array($value)) {
            return false;
        }

        foreach ($value as $child) {
            if ($this->containsReference($child, $reference)) {
                return true;
            }
        }

        return false;
    }

    private function ownedDiskPath(Site $site, string $reference): ?string
    {
        if (preg_match(
            '#^/storage/sites/'.preg_quote((string) $site->id, '#').'/sections/[A-Za-z0-9_-]+\.(?:jpe?g|png|webp)$#i',
            $reference,
        ) !== 1) {
            return null;
        }

        $path = substr($reference, strlen('/storage/'));

        return $path !== '' ? $path : null;
    }
}
