<?php

namespace App\Actions;

use App\Models\AiGeneration;
use App\Models\Site;
use App\Services\Ai\AiDraftSnapshot;
use App\Services\Ai\AiRefinementGuard;
use App\Services\Ai\AiRefinementProposalValidator;
use App\Services\Ai\InvalidAiRefinementException;
use App\Services\Ai\LocalWebsiteRefiner;
use Illuminate\Support\Str;

class CreateAiRefinement
{
    public function __construct(
        private AiDraftSnapshot $snapshots,
        private LocalWebsiteRefiner $refiner,
        private AiRefinementProposalValidator $validator,
        private AiRefinementGuard $guard,
    ) {}

    /**
     * Create a synchronous, deterministic proposal without mutating the draft.
     *
     * Expected input: prompt, scope, and tenant-scoped page_id/section_id when
     * required by the selected scope.
     *
     * @param  array<string, mixed>  $input
     */
    public function handle(Site $site, int $userId, array $input): AiGeneration
    {
        $this->guard->assertCanManage($site, $userId);
        $this->assertOnlySupportedInput($input);

        $prompt = $this->prompt($input['prompt'] ?? null);
        $scope = $input['scope'] ?? null;

        if (! is_string($scope) || ! in_array($scope, ['site', 'page', 'section'], true)) {
            throw new InvalidAiRefinementException('The refinement scope is invalid.');
        }

        $pageId = $this->nullableId($input['page_id'] ?? null, 'page');
        $sectionId = $this->nullableId($input['section_id'] ?? null, 'section');
        $this->validateTargetsForScope($scope, $pageId, $sectionId);

        $snapshot = $this->snapshots->capture($site, $scope, $pageId, $sectionId);
        $proposal = $this->validator->validate($this->refiner->propose($snapshot, $prompt));

        return AiGeneration::query()->create([
            'site_id' => $site->getKey(),
            'user_id' => $userId,
            'provider' => 'local',
            'mode' => 'refinement',
            'scope' => $scope,
            'target_page_id' => $snapshot['target_page_id'],
            'target_section_id' => $snapshot['target_section_id'],
            'base_hash' => $this->snapshots->hash($snapshot),
            'status' => 'proposed',
            'input' => [
                'prompt' => $prompt,
                'scope' => $scope,
                'page_id' => $snapshot['target_page_id'],
                'section_id' => $snapshot['target_section_id'],
            ],
            'output' => $proposal,
            'attempts' => 1,
            'input_tokens' => 0,
            'output_tokens' => 0,
            'error' => null,
            'applied_at' => null,
        ]);
    }

    private function prompt(mixed $value): string
    {
        if (! is_string($value)) {
            throw new InvalidAiRefinementException('A refinement prompt is required.');
        }

        $value = trim($value);

        if (Str::length($value) < 10 || Str::length($value) > 2000) {
            throw new InvalidAiRefinementException('The refinement prompt must be between 10 and 2,000 characters.');
        }

        if (preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', $value)) {
            throw new InvalidAiRefinementException('The refinement prompt contains unsupported control characters.');
        }

        return $value;
    }

    private function nullableId(mixed $value, string $field): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (! is_int($value) && ! (is_string($value) && ctype_digit($value))) {
            throw new InvalidAiRefinementException("The refinement {$field} is invalid.");
        }

        $value = (int) $value;

        if ($value < 1) {
            throw new InvalidAiRefinementException("The refinement {$field} is invalid.");
        }

        return $value;
    }

    private function validateTargetsForScope(string $scope, ?int $pageId, ?int $sectionId): void
    {
        $valid = match ($scope) {
            'site' => $pageId === null && $sectionId === null,
            'page' => $pageId !== null && $sectionId === null,
            'section' => $pageId !== null && $sectionId !== null,
        };

        if (! $valid) {
            throw new InvalidAiRefinementException('The refinement targets do not match its scope.');
        }
    }

    /** @param array<string, mixed> $input */
    private function assertOnlySupportedInput(array $input): void
    {
        if (array_diff(array_keys($input), ['prompt', 'scope', 'page_id', 'section_id']) !== []) {
            throw new InvalidAiRefinementException('The refinement request contains unsupported fields.');
        }
    }
}
