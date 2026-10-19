<?php

namespace App\Http\Controllers;

use App\Models\Template;
use Inertia\Inertia;

class TemplateController extends Controller
{
    public function index()
    {
        return Inertia::render('Templates/Index', [
            'templates' => Template::query()
                ->where('is_active', true)
                ->orderBy('id')
                ->limit(10)
                ->get()
                ->map(fn (Template $template) => [
                    'id' => $template->id,
                    'name' => $template->name,
                    'slug' => $template->slug,
                    'category' => $template->category,
                    'description' => data_get($template->blueprint, 'description', $template->category.' website'),
                    'sections' => data_get($template->blueprint, 'home_sections', []),
                    'theme' => $template->theme_defaults,
                ]),
        ]);
    }
}
