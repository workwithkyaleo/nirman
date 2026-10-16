<?php

namespace App\Actions;

use App\Models\Section;
use App\Models\Site;
use App\Services\SectionMedia;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Throwable;

class UpdateSection
{
    public function __construct(private SectionMedia $media) {}

    /**
     * Persist text and staged images as one section edit. Filesystem writes
     * are compensated if the database update fails.
     *
     * @param  array<string, mixed>  $attributes
     * @param  array<int|string, UploadedFile>  $itemImages
     * @param  array<int|string, UploadedFile>  $elementImages
     */
    public function handle(
        Site $site,
        Section $section,
        array $attributes,
        ?UploadedFile $sectionImage = null,
        array $itemImages = [],
        ?UploadedFile $backgroundImage = null,
        array $elementImages = [],
    ): Section {
        $stored = [];
        $before = [];
        $after = [];

        try {
            $updated = DB::transaction(function () use (
                $site,
                $section,
                $attributes,
                $sectionImage,
                $itemImages,
                $backgroundImage,
                $elementImages,
                &$stored,
                &$before,
                &$after,
            ): Section {
                $locked = Section::query()
                    ->where('site_id', $site->id)
                    ->whereKey($section->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $before = (array) $locked->content;
                $after = array_replace($before, (array) ($attributes['content'] ?? []));

                if ($sectionImage) {
                    $after['image'] = $stored[] = $this->media->store($site, $sectionImage);
                }

                if ($backgroundImage) {
                    $after['background_image'] = $stored[] = $this->media->store($site, $backgroundImage);
                }

                foreach ($itemImages as $index => $image) {
                    $index = (int) $index;
                    abort_unless(isset($after['items'][$index]) && is_array($after['items'][$index]), 422);
                    $after['items'][$index]['image'] = $stored[] = $this->media->store($site, $image);
                }

                foreach ($elementImages as $index => $image) {
                    $index = (int) $index;
                    abort_unless(isset($after['elements'][$index]) && is_array($after['elements'][$index])
                        && ($after['elements'][$index]['type'] ?? null) === 'image', 422);
                    $after['elements'][$index]['image'] = $stored[] = $this->media->store($site, $image);
                }

                $locked->update([
                    ...Arr::only($attributes, ['is_visible', 'sort_order']),
                    'content' => $after,
                ]);

                return $locked->fresh();
            });
        } catch (Throwable $exception) {
            $this->media->discard($site, $stored);

            throw $exception;
        }

        try {
            $this->media->cleanupReplaced($site, $before, $after);
        } catch (Throwable $exception) {
            // Cleanup is best-effort after commit; never report a successful
            // section save as failed because an old file could not be pruned.
            report($exception);
        }

        return $updated;
    }
}
