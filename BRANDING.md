# PRIMEBILL ISP PLATFORM — Branding

This document defines the official product naming and usage rules. The same
rules apply to the frontend (`primebill-frontend`) and backend
(`primebill-api`) repositories.

## Official terminology

| Term | Usage | Examples |
|------|-------|----------|
| **PrimeBill** | Short brand name. Safe for space-limited surfaces (sidebar, toasts, mobile headers). | Sidebar brand, login logo |
| **PrimeBill ISP Platform** | Official full product name (title case). Use in prose, footer copy, subtitles and documentation when referring to the product. | Welcome toast, signup copy |
| **PRIMEBILL ISP PLATFORM** | All-caps display form. Use in UI chrome, browser/page titles, login screens, dashboard headers and report mastheads. | `<title>`, login screen, header bars |

## Source of truth

The product name must **never** be hard-coded in user-facing code.

- **Frontend:** `src/config/brand.js` (env overrides `VITE_BRAND_NAME`,
  `VITE_PRODUCT_NAME`, `VITE_DISPLAY_NAME`, `VITE_DEFAULT_COMPANY`).
  Import `BRAND` and use `BRAND.brand`, `BRAND.product`, `BRAND.display`,
  `BRAND.company`.
- **Backend:** `config/brand.php` (env overrides `PRIMEBILL_BRAND_NAME`,
  `PRIMEBILL_PRODUCT_NAME`, `PRIMEBILL_DISPLAY_NAME`, `PRIMEBILL_DEFAULT_COMPANY`).
  Access via `config('brand.*')`.

## What NOT to rename

"Platform" has an architectural meaning in this codebase and must keep its
meaning in these contexts (unless a branding change genuinely requires it):

- Platform routes (`/platform/*`)
- Platform layout, platform users, platform settings
- Platform IDs, database tables/columns (`platform_invoices`, `platform_admin`, ...)
- Internal architecture terms: Platform Console, Platform Billing, tenants

Only user-facing product presentation changes.

## Do

- Use `PrimeBill` whenever space is tight or a filler brand is needed.
- Use `PrimeBill ISP Platform` for the first full mention of the product in
  any email, document or screen.
- Use `PRIMEBILL ISP PLATFORM` for titles, headers and chrome.
- Use the shared config values instead of literal brand strings.

## Don't

- Don't invent variants: `PrimeBilling`, `Prime Billing`, `PrimeBill ISP`,
  `PrimeBill Platform`, `Primebill` are all deprecated.
- Don't hard-code the brand in new UI strings — import from `src/config/brand.js`.
- Don't rename architectural `platform` terms that describe the multi-tenant
  platform engine, IDs, tables or scopes.