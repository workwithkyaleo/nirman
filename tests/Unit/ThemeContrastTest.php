<?php

namespace Tests\Unit;

use App\Support\ThemeContrast;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class ThemeContrastTest extends TestCase
{
    #[DataProvider('ratios')]
    public function test_it_calculates_wcag_contrast_ratios(string $first, string $second, float $expected): void
    {
        $this->assertEqualsWithDelta($expected, ThemeContrast::ratio($first, $second), 0.01);
        $this->assertEqualsWithDelta($expected, ThemeContrast::ratio($second, $first), 0.01);
    }

    #[DataProvider('invalidColours')]
    public function test_invalid_or_alpha_colours_fail_conservatively(string $invalid): void
    {
        $this->assertSame(1.0, ThemeContrast::ratio($invalid, '#ffffff'));
        $this->assertSame(1.0, ThemeContrast::ratio('#ffffff', $invalid));
    }

    /** @return array<string, array{string, string, float}> */
    public static function ratios(): array
    {
        return [
            'black and white' => ['#000000', '#ffffff', 21],
            'three digit hex' => ['#000', '#fff', 21],
            'threshold-adjacent grey' => ['#777777', '#ffffff', 4.48],
            'same colour' => ['#14532d', '#14532d', 1],
        ];
    }

    /** @return array<string, array{string}> */
    public static function invalidColours(): array
    {
        return [
            'eight digit alpha hex' => ['#00000000'],
            'four digit alpha hex' => ['#0000'],
            'missing hash' => ['ffffff'],
            'invalid digit' => ['#fffffg'],
            'empty value' => [''],
        ];
    }
}
