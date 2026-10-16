<?php

namespace App\Support;

class SafeHyperlink
{
    public static function isValid(string $value): bool
    {
        if ($value === '' || strlen($value) > 2048
            || preg_match('/[\x00-\x20\x7f\\\\]/', $value)
            || preg_match('/[\x00-\x1f\x7f\\\\]/', rawurldecode($value))) {
            return false;
        }

        if (str_starts_with($value, '#')) {
            return preg_match('/\A#[A-Za-z0-9_:.-]*\z/', $value) === 1;
        }

        if (str_starts_with($value, '/')) {
            return ! str_starts_with($value, '//');
        }

        if (filter_var($value, FILTER_VALIDATE_EMAIL) !== false) {
            return true;
        }

        if (strncasecmp($value, 'mailto:', 7) === 0) {
            $address = explode('?', substr($value, 7), 2)[0];

            return filter_var($address, FILTER_VALIDATE_EMAIL) !== false;
        }

        if (strncasecmp($value, 'tel:', 4) === 0) {
            return preg_match('/\A[+0-9][0-9().-]{2,40}\z/', substr($value, 4)) === 1;
        }

        if (filter_var($value, FILTER_VALIDATE_URL) === false) {
            return false;
        }

        $parts = parse_url($value);

        return is_array($parts)
            && in_array(strtolower((string) ($parts['scheme'] ?? '')), ['http', 'https'], true)
            && ! empty($parts['host']);
    }
}
