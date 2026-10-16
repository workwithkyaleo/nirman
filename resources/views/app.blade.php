<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="#173f37">
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">

        <title inertia>{{ config('app.name', 'Nirmaan') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=dm-sans:400,500,600,700|figtree:400,500,600,700|inter:400,500,600,700|lora:400,500,600,700,400i,500i|manrope:400,500,600,700,800|noto-sans-devanagari:400,500,600,700|noto-serif-devanagari:400,500,600,700|playfair-display:500,600,700,500i,600i|poppins:400,500,600,700|montserrat:300,400,500,600,700,800,900,400i,700i|nunito:300,400,500,600,700,800,900,400i,700i|merriweather:300,400,700,900,400i,700i|bebas-neue:400|dancing-script:400,500,600,700|caveat:400,500,600,700&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
