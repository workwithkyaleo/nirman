<?php

namespace Tests\Unit;

use App\Support\SafeHyperlink;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class SafeHyperlinkTest extends TestCase
{
    #[DataProvider('links')]
    public function test_only_supported_hyperlinks_are_accepted(string $link, bool $expected): void
    {
        $this->assertSame($expected, SafeHyperlink::isValid($link));
    }

    /** @return array<string, array{string, bool}> */
    public static function links(): array
    {
        return [
            'https website' => ['https://example.com/path?query=yes#detail', true],
            'http website' => ['http://example.com', true],
            'mixed case scheme' => ['HTTPS://example.com', true],
            'email address' => ['hello@example.com', true],
            'email link' => ['mailto:hello@example.com', true],
            'email subject' => ['mailto:hello@example.com?subject=New%20enquiry', true],
            'telephone' => ['tel:+977-9801234567', true],
            'internal path' => ['/about?source=home#team', true],
            'anchor' => ['#our-services', true],
            'page top anchor' => ['#', true],
            'javascript scheme' => ['javascript:alert(1)', false],
            'mixed javascript' => ['JaVaScRiPt:alert(1)', false],
            'data scheme' => ['data:text/html,<script>alert(1)</script>', false],
            'vbscript scheme' => ['vbscript:alert(1)', false],
            'protocol relative' => ['//example.com', false],
            'backslash relative' => ['/\\example.com', false],
            'encoded backslash' => ['/%5cexample.com', false],
            'literal control' => ["https://example.com/\x01", false],
            'encoded control' => ['mailto:hello@example.com?subject=x%0aBcc:attacker@example.com', false],
            'tab obscured scheme' => ["java\tscript:alert(1)", false],
            'leading space' => [' https://example.com', false],
            'internal literal spaces' => ['/my page', false],
            'relative without slash' => ['about', false],
            'invalid email' => ['mailto:hello', false],
            'invalid telephone' => ['tel:alert(1)', false],
            'invalid anchor markup' => ['#<script>', false],
            'missing host' => ['https://', false],
            'unsupported file scheme' => ['file:///etc/passwd', false],
            'empty' => ['', false],
            'too long' => ['https://example.com/'.str_repeat('a', 2048), false],
        ];
    }
}
