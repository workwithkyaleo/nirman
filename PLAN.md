# Nirmaan MVP Plan

## Product scope

Nirmaan is a configurable, multi-tenant website-building SaaS for small businesses. The MVP supports business sites and online stores, deterministic AI-assisted setup, structured section editing, draft/publish separation, public rendering, cash-on-delivery checkout, plan entitlements, and platform administration.

The product name is read from `APP_NAME`; URLs and domain behavior are configuration-driven.

## Architecture

- Laravel modular monolith with Inertia, React, TypeScript, Tailwind, and Vite.
- Application-level tenancy: every site-owned aggregate carries `site_id`; access is resolved through authenticated membership and policies, never a browser-provided site id alone.
- Thin controllers delegate workflows to Actions and Services. Form Requests own validation. Multi-write operations use database transactions.
- Public content is a validated section schema. Customer HTML and JavaScript are never stored or rendered.
- Per-field typography and section/image appearance use allow-listed structured JSON with bounded values, shared rendering helpers, reset-to-theme behavior, and draft/publish isolation. AI text refinements preserve owner-selected fonts, colors, styles and image frames.
- Direct canvas customization uses bounded layouts and up to thirty structured text, image, shape or button elements per section. Element hyperlinks accept only HTTP(S), email, telephone, anchors and internal paths; upload targets are validated before atomic section saves, and published snapshots keep their media references.
- Text animations are optional per field: fade, rise, slide, zoom and blur play once on entering the viewport, with bounded duration/delay controls and reduced-motion support. Animation settings remain part of the allow-listed text-style JSON, preserve typography when disabled, and respect draft/publish separation.
- Theme customization is a validated semantic-token contract shared by the studio canvas, public pages and storefront. Curated template defaults establish composition, while explicit owner choices override them; palette contrast is checked in both the editor and backend.
- Draft pages/sections are separate from immutable published snapshots. Publishing atomically creates a page version and updates the public snapshot.
- AI providers implement a server-side interface. A deterministic prompt-aware local provider is the default; remote providers must return validated structured JSON. Initial generation records status, attempts, usage, and errors. Refinements use a proposal/apply workflow with scope validation, draft hashes and stale-edit protection.
- Payments implement a gateway contract. COD is complete; eSewa, Khalti, and Stripe remain safe mock/configuration adapters until verified credentials and API documentation are supplied. Callback events use unique idempotency keys.
- Files use Laravel disks and validated image uploads, allowing local development and S3-compatible production storage.
- Entitlements are enforced in backend services/policies. UI affordances mirror, but do not replace, server enforcement.
- SQLite is the local default. PostgreSQL and Redis can be enabled through environment variables without application changes.

## Domain modules

1. Identity: users, email verification, profile, password reset, platform administrator flag.
2. Tenancy: sites, memberships, roles, onboarding progress, domains.
3. Builder: templates, themes, pages, sections, page versions, media, AI generations.
4. Publishing: atomic snapshots, host/slug resolution, SEO, sitemap, robots.
5. Commerce: categories, products, variants, images, carts, customers, addresses, orders, events, payments.
   Unified commerce adds online/manual/POS sales channels, multi-location stock ledgers, shipment handoff records, provider configuration, and consolidated reporting.
6. SaaS: plans, subscriptions, usage records, entitlements.
7. Operations: enquiries, appointments, audit logs, platform settings and administration.

## Database design

- `users`: identity, verification, profile fields, `is_super_admin`.
- `sites`: owner-independent tenant root, mode, slug, locale/currency, status, onboarding and publish timestamps.
- `site_user`: membership with owner/admin/staff role; unique site/user pair.
- `onboarding_progress`: one per site, current step plus validated structured answers.
- `domains`: site domains, primary/verified state and verification token.
- `themes`, `templates`: reusable validated design tokens and sixteen distinct composition blueprints covering navigation, hero, section order, content grids, cards, calls to action and footer behavior.
- `pages`, `sections`: mutable drafts; all include tenant ownership and ordering constraints.
- `page_versions`: immutable published/draft snapshots with version number and publisher.
- `media`: validated file metadata stored through Laravel filesystem.
- `products`, `product_categories`, `product_variants`, `product_images`: soft-deletable catalogue records, integer minor-unit prices.
- `customers`, `addresses`, `carts`, `cart_items`: tenant-scoped customer and basket data.
- `orders`, `order_items`, `order_status_events`, `payments`: immutable price snapshots, status enums, timelines, idempotency keys.
- `plans`, `subscriptions`, `usage_records`: JSON entitlements plus period-based usage.
- `ai_generations`: provider/status/input/output/usage/error metadata without secrets.
- `enquiries`, `appointments`, `audit_logs`: public submissions and security-relevant events.

Foreign keys cascade only for true aggregate children; recoverable business records use soft deletion. Tenant lookup, status, slug, SKU, timestamps, and idempotency fields receive appropriate indexes/unique constraints.

## Implementation order and status

- [x] Milestone 1: Laravel/Inertia setup, authentication, schema, tenant membership, policies, dashboard shell.
- [x] Milestone 2: five-step business-profile onboarding, logo/contact/map/hours/social details, sixteen curated template blueprints, template-aware themes, and deterministic business-aware AI generation.
- [ ] Milestone 3: tenant-scoped website overview, unified Overview/Studio/Commerce/Products/Settings navigation, Canva-style owner studio with left tool panels, a shared website canvas and selected-element controls across the top, authenticated draft preview, page title/SEO/navigation settings, structured sections, responsive artboards, direct content/item/image editing, section add/duplicate/hide/delete/reorder controls, sixteen compositionally distinct templates, non-destructive restyle/full-layout switching, business settings and validated global theme controls with studio/public/storefront parity complete; continuous autosave, undo/redo and published-page removal remain.
- [x] Studio customization: selectable text targets and live website previews, typography presets and advanced text controls, expanded font library, image framing/crop/focus/borders/shadows, section backgrounds/spacing/alignment/borders/decorations, and six additional website themes with safe additive catalog migration. Selected-element tools now appear in the workspace toolbar and property panels.
- [x] Text animation controls: optional effects for section, item and button text, duration/delay tuning, editor replay preview, public viewport playback, and reduced-motion fallback; validated saves, resets, tenant boundaries, published snapshots and AI-preservation checks cover the settings.
- [x] Canvas workspace: the website in the center uses the public renderer, with tools/uploads on the left, a top toolbar for the selected text or image, and direct plain-text editing on the website. Active store products use the same bounded public field shape as draft previews; role and tenant boundaries remain server-enforced. Save and Publish flush pending section edits before updating the design or public snapshot.
- [x] Structured element contract: allow-listed hyperlinks and bounded position/size/rotation/layer settings, reversible visibility for existing elements, section minimum height, independent text/image/shape/button elements, atomic image uploads and final-element removal. Security, tenant boundaries, upload rollback, draft/publish isolation and AI-copy preservation have focused coverage.
- [ ] Milestone 4: public route resolution, atomic publishing and SEO metadata complete; host mapping, sitemap and robots remain.
- [ ] Milestone 5: commerce schema, seeded catalogue, tenant-safe product CRUD, public shop/product pages, guest cart, server-calculated checkout, COD order/payment creation, stock deduction, confirmation, unified commerce reporting, multi-location stock ledger and logistics records complete; owner order-management UI, customer lookup, POS terminal and live provider connections remain.
- [ ] Milestone 6: plans and entitlement schema complete; enforcement, usage and super-admin UI remain.
- [ ] Milestone 7: focused feature/unit tests, accessibility/performance/security review, seed data and documentation.
- [x] Prompt refinement foundation: site/page/section-scoped prompts produce validated proposals; owners preview, apply or discard them; stale and cross-tenant operations are rejected atomically.

## Key risks and mitigations

- Tenant leakage: central membership resolver, policies, scoped route binding, negative isolation tests.
- Draft leakage: public routes read only published snapshots; the separate member-only draft preview is policy-protected and tenant-scoped; publishing is transactional and tested.
- Template switching: design-only mode preserves every section position; full-layout mode locks and reorganizes only the Home draft, preserves matching content, appends unmatched content, and never mutates published snapshots.
- Unsafe custom palettes/layouts: constrained theme options, computed foreground/surface tokens, server-enforced text contrast, reduced-motion overrides, and shared responsive composition rules keep every template usable while preserving owner choice.
- Unsafe generated/customer content: allow-listed JSON schemas, plain-text rendering, upload validation, CSP/security headers.
- Payment duplication: transactional checkout and unique idempotency keys; verified callbacks before state changes.
- AI instability/cost: provider abstraction, schema validation, retries, quotas, usage records, deterministic fallback.
- Scope pressure: reusable section types and bounded structured canvas elements keep customization manageable; arbitrary customer HTML/JavaScript and live third-party gateways remain outside the implementation.
- Local/production drift: SQLite test coverage plus production-ready PostgreSQL/Redis/S3 configuration.

## Verification gates

After each milestone, run focused PHP tests and relevant frontend checks. Before handoff run Pint, PHP tests, frontend lint/typecheck/build, and Playwright journeys where configured. The final review checks tenant isolation, draft/public separation, XSS-safe output, mobile layouts, keyboard access, useful empty/error/loading states, and secret-free configuration.
