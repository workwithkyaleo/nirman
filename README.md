# Nirmaan

Nirmaan is an AI-assisted, multi-tenant website and commerce builder for small businesses. It combines guided site creation, structured page editing, publishing, product management and cash-on-delivery checkout in one workspace.

Current builder capabilities include a tenant-scoped admin overview for every website and a canvas-first visual studio with a command bar, page switcher, desktop/tablet/mobile artboards, zoom, layer tree, section library, contextual section controls, selection inspector, authenticated draft preview and draft-safe publishing. It also includes ten compositionally distinct templates, template-aware site generation, page SEO/navigation settings, structured section editing, business settings, and scoped AI refinement proposals with review/apply/discard controls.

Template switching supports two safe workflows: **Restyle only** keeps the existing section order, while **Use full layout** reorganizes the Home draft around the selected template, preserves matching content, creates structured defaults for missing sections, and retains unmatched sections. Neither workflow changes the live website until it is published.

## Local development

```bash
composer install
npm install
php artisan migrate --seed
npm run dev
php artisan serve
```

SQLite is the default local database. The application name and preview domain are configured with `APP_NAME` and `SITE_DOMAIN`.

Development demo accounts use the password `password`:

- `owner@nirmaan.test`
- `admin@nirmaan.test`

Never use demo credentials in production.

## Quality checks

```bash
php artisan test
npm run build
./vendor/bin/pint
```

See [PLAN.md](PLAN.md) for the architecture, security boundaries and milestone status.

## Technology

Nirmaan is built with Laravel, Inertia, React, TypeScript, Tailwind CSS and Vite. Customer content remains structured and tenant-scoped; arbitrary customer-authored HTML or JavaScript is never rendered.
