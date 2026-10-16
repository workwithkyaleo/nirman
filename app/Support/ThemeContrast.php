<?php

namespace App\Support;

class ThemeContrast
{
    public static function ratio(string $first, string $second): float
    {
        $firstLuminance = self::luminance($first);
        $secondLuminance = self::luminance($second);

        if ($firstLuminance === null || $secondLuminance === null) {
            return 1.0;
        }

        return (max($firstLuminance, $secondLuminance) + 0.05)
            / (min($firstLuminance, $secondLuminance) + 0.05);
    }

    private static function luminance(string $hex): ?float
    {
        if (preg_match('/\A#(?:[0-9a-f]{3}|[0-9a-f]{6})\z/i', $hex) !== 1) {
            return null;
        }

        $value = substr($hex, 1);

        if (strlen($value) === 3) {
            $value = implode('', array_map(
                fn (string $character): string => $character.$character,
                str_split($value),
            ));
        }

        $channels = array_map(function (string $channel): float {
            $normalized = hexdec($channel) / 255;

            return $normalized <= 0.04045
                ? $normalized / 12.92
                : (($normalized + 0.055) / 1.055) ** 2.4;
        }, str_split($value, 2));

        return $channels[0] * 0.2126
            + $channels[1] * 0.7152
            + $channels[2] * 0.0722;
    }
}
