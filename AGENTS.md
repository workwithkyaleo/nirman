# SiteSajilo Agent Guide

## Commands

- `composer install` install PHP dependencies
- `npm install` install frontend dependencies
- `php artisan migrate --seed` migrate and seed local data
- `php artisan serve` run the Laravel server
- `npm run dev` run Vite in development
- `php artisan test` run backend tests
- `npm run build` build frontend assets
- `npm run lint` lint frontend code
- `npm run typecheck` typecheck frontend code when available
- `./vendor/bin/pint` format PHP
- `npm run e2e` run Playwright journeys when configured

Use SQLite for the easiest local run; use PostgreSQL for production-like development by setting the `DB_*` variables in `.env`.

## Architecture rules

- Keep controllers thin. Put workflows in Actions/Services and slow work in queued jobs.
- Every website-owned record has `site_id` and is checked through membership/role policies.
- Never trust a site id from the browser without resolving membership on the server.
- Use Form Requests for validation and transactions for publish, checkout, membership and other multi-write workflows.
- Website content is structured JSON/sections. Never render customer-authored arbitrary HTML or JavaScript.
- AI keys remain server-side. Validate provider output before persistence and record generation status/usage.
- Use integer minor currency units; never floating-point prices.
- Use Laravel filesystem abstractions and validated uploads.
- Keep the product name configurable through environment/configuration.

## Testing requirements

Add focused feature tests for every authorization or tenant boundary and unit tests for business rules. Cover draft versus published behavior, AI mock generation, cart/order totals, COD idempotency and plan entitlements. Essential journeys should be covered with Playwright once the public and dashboard flows exist.

## Definition of done

A change is complete when it has focused tests, passes formatting/lint/typecheck/build checks relevant to its surface, preserves tenant isolation and security expectations, updates `PLAN.md` when a milestone decision changes, and leaves the app runnable from the documented commands.

Do not commit secrets, demo credentials outside development documentation, or unrelated refactors.
