// ─────────────────────────────────────────────────────────────────────────────
// BRANDING — single source of truth for the product's public name.
//
// Import `BRAND` from here wherever the product name is shown to a user
// instead of hard-coding it. See BRANDING.md for the full terminology rules.
//
//   - brand:    short brand name (space-limited surfaces: sidebar, toasts)
//   - product:  official full product name, title case (emails, prose, docs)
//   - display:  all-caps display form (page titles, login screen, headers)
//   - company:  default company name fallback for branded portals/pages
// ─────────────────────────────────────────────────────────────────────────────
const BRAND = {
  brand:   import.meta.env.VITE_BRAND_NAME   || 'PrimeBill',
  product: import.meta.env.VITE_PRODUCT_NAME || 'PrimeBill ISP Platform',
  display: import.meta.env.VITE_DISPLAY_NAME || 'PRIMEBILL ISP PLATFORM',
  company: import.meta.env.VITE_DEFAULT_COMPANY || 'PrimeBill ISP',
}

export default BRAND