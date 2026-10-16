<?php

namespace App\Support;

class TextFontCatalog
{
    /** @return array<int, string> */
    public static function names(): array
    {
        return [
            'Manrope', 'Inter', 'Poppins', 'DM Sans', 'Figtree',
            'Playfair Display', 'Lora', 'Noto Sans Devanagari', 'Noto Serif Devanagari',
            'Montserrat', 'Nunito', 'Merriweather', 'Bebas Neue', 'Dancing Script', 'Caveat',
            'Arial', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Georgia',
            'Times New Roman', 'Courier New', 'System Sans', 'System Serif', 'System Mono',
        ];
    }
}
