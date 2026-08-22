# PrimeBill ISP Platform — Frontend/Backend Parity Matrix

Produced from direct source inspection (not the README): backend has 62 `app/Http/Controllers/Api/*` (plus `Portal/*`) and ~390 unique API URIs (via `artisan route:list`), 168 models, ~150 migrations. Frontend has 27 `src/api/*` modules, 24 page directories, 12 generic `{resource}` catalog groups.

Legend: ✅ COMPLETE · 🟡 PARTIAL · 🔴 MISSING · ⚠️ BROKEN

## Matrix (frontend status verified against source, not README)

| # | DOMAIN | API | PAGE | ROUTE | CRUD | ACT | STATUS |
|---|--------|-----|------|-------|------|-----|:-------|
| 1 | Authentication (login/me/logout/change-password, pwd reset) | auth.api.js | Login/Forgot/Reset | /login,/forgot-password,/reset-password | – | – | ✅ (⚠️ MFA step below) |
| 2 | MFA | mfa.api.js | MfaSettings | /mfa | – | ✅ | 🟡 (self-service ✅; login MFA challenge = backend auth flow, not wired) |
| 3 | Admin users & roles | admin.api.js | AdminUsers/AdminRoles | /admin/* | ✅ | ✅ | ✅ |
| 4 | API keys | security.api.js ✅ | in SecurityCenter | /security ✅ | ✅ | ✅ | ✅ (verified in source) |
| 5 | Clients | clients.api.js | ClientList/Detail | /clients,/clients/:id | 🟡 | ✅ | 🟡 |
| 6 | Client accounts/services | clients.api.js | in ClientDetail | – | 🟡 | partial | 🟡 |
| 7 | Notes/tags/custom-fields | clients.api.js | components | in ClientDetail | ✅ | ✅ | ✅ |
| 8 | Plans | plans.api.js | PlanList | /plans | ✅ | partial | ✅ |
| 9 | Invoices | invoices.api.js | InvoiceList | /invoices | 🟡 | partial | 🟡 |
| 10 | Payments | payments.api.js | PaymentList | /payments | 🟡 | partial | 🟡 |
| 11 | Payment allocations | payment-allocations.api.js ✅ | PaymentAllocationsPage ✅ | /payment-allocations ✅ | ✅ | ✅ | ✅ (implemented in parity pass) |
| 12 | Finance (wallet/notes/refunds/tax/discount/usage/statements/collections) | finance.api.js | FinanceOverview | /finance | 🟡 | 🟡 | 🟡 |
| 13 | Ledger (double-entry/verify) | finance.api.js | FinanceOverview | /finance | 🟡 | 🟡 | 🟡 |
| 14 | Expenditures | expenditures.api.js ✅ | ExpendituresPage ✅ | /expenditures ✅ | ✅ | ✅ | ✅ (verified in source) |
| 15 | Commissions | commissions.api.js ✅ tests | CommissionsPage | /commissions ✅ | 🟡 | ✅ | ✅ |
| 16 | Referrals | referrals.api.js ✅ tests | ReferralsPage | /referrals ✅ | 🟡 | ✅ | ✅ |
| 17 | Routers | routers.api.js | RouterList | /routers | ✅ | partial | ✅ |
| 18 | Router interfaces/templates/config/backups/logs | catalog(router-config) | CatalogPage | /catalog | 🟡 | – | 🟡 |
| 19 | RADIUS settings/sessions/accounting | radius.api.js | RadiusPage/Settings | /radius | 🟡 | partial | 🟡 |
| 20 | RADIUS profiles/CoA/disconnect | catalog(radius-advanced) | CatalogPage | /catalog | 🟡 | 🔴 | 🟡 |
| 21 | IPAM | ipam.api.js ✅ | IpamPage ✅ | /ipam ✅ | ✅ | partial | ✅ (verified in source) |
| 22 | NOC | noc.api.js | NocDashboard/Devices/Alerts/Links | /noc/* | ✅ | ✅ | ✅ |
| 23 | Network incidents | incidents.api.js ✅ | IncidentsPage ✅ | /incidents ✅ | ✅ | ✅ | ✅ (verified in source) |
| 24 | OLT/PON/ONT | fiber.api.js | OltList/OltDetail | /fiber/olts | ✅ | partial | 🟡 |
| 25 | ONT signals/events/fiber connections | catalog(fiber-ext) | CatalogPage | /catalog | 🟡 | – | 🟡 |
| 26 | Fiber routes/splitters/cabinets/distribution | 🔴 | 🔴 | – | – | – | 🔴 |
| 27 | Tickets | tickets.api.js | TicketList/Detail(+Escalate) | /tickets | ✅ | ✅ | ✅ |
| 28 | Ticket queues/categories/SLA/escalation | catalog(support-catalog) | CatalogPage | /catalog | 🟡 | – | 🟡 |
| 29 | KB/announcements/maintenance | catalog(support-catalog) | CatalogPage | /catalog | 🟡 | – | 🟡 |
| 30 | Communications/campaigns/webhooks | catalog(communications) | CatalogPage | /catalog | 🟡 | partial | 🟡 |
| 31 | Customer experience | catalog(customer-experience) | CatalogPage | /catalog | 🟡 | – | 🟡 |
| 32 | Inventory | inventory.api.js | InventoryList | /inventory | ✅ | partial | 🟡 |
| 33 | Warehouses/suppliers/PO workflow | catalog(inventory-ext) | CatalogPage | /catalog | 🟡 | 🔴 | 🟡 |
| 34 | Equipment & warranties | catalog(equipment) | CatalogPage | /catalog | 🟡 | – | 🟡 |
| 35 | Work orders | work-orders.api.js | WorkOrdersPage | /work-orders | ✅ | partial | ✅ |
| 36 | WO templates/checklists; technician workload | catalog(field-ops) | CatalogPage | /catalog | 🟡 | – | 🟡 |
| 37 | Technician locations/availability | 🔴 | 🔴 | – | – | – | 🔴 |
| 38 | Leads | leads.api.js | LeadList/Detail | /leads | 🟡 | ✅ | 🟡 |
| 39 | Prospects | leads.api.js | ProspectList/Detail/Form | /prospects | ✅ | ✅ | ✅ |
| 40 | Loyalty | loyalty.api.js | LoyaltyPoints | /loyalty | 🟡 | partial | 🟡 |
| 41 | Vouchers | vouchers.api.js | VoucherList | /vouchers | ✅ | partial | ✅ |
| 42 | Login history & security events | security.api.js ✅ | SecurityCenter (tab) ✅ | /security ✅ | ✅ | ✅ | ✅ (verified in source) |
| 43 | Sessions | security.api.js ✅ | SecurityCenter (tab) ✅ | /security ✅ | ✅ | ✅ | ✅ (verified in source) |
| 44 | Reports/saved/schedules | reports.api.js + catalog(reporting) | Reports | /reports | 🟡 | – | 🟡 |
| 45 | SMS | sms.api.js | SmsDashboard | /sms | ✅ | partial | ✅ |
| 46 | FUP | fup.api.js | FupManagement | /fup | ✅ | partial | ✅ |
| 47 | Platform licensing subscriptions | subscription.api.js | SubscriptionPage/TenantSubscriptionPage | /subscription/* | 🟡 | partial | 🟡 |
| 48 | Customer subscriptions | customer-subscription.api.js | ClientSubscriptions | in ClientDetail | ✅ | ✅ | ✅ |
| 49 | Service management | catalog(service-catalog) | CatalogPage | /catalog | 🟡 | – | 🟡 |
| 50 | Platform administration | platform.api.js | Platform* pages | /platform/* | ✅ | ✅ | ✅ |
| 51 | Portal (captive/invoices/tickets/profile) | via axios | CaptivePortal | /captive/:slug | 🟡 | partial | 🟡 |

## Parity v5 — recently wired (verified by `vitest` + `npm run build` + `eslint`)

| Domain | API module + tests | Page | Route | Notes |
|--------|--------------------|------|-------|-------|
| MFA (self-service) | mfa.api.js + mfa.api.test.js (4 tests) | MfaSettings | /mfa | getMfaStatus, generateMfaSecret, enableMfa(code), disableMfa(password), regenerateBackupCodes(code) posts to /mfa/backup-codes, challengeMfa, verifyMfaCode. Controller has no index route; endpoints are flat /mfa/*. Login MFA challenge is a backend auth concern. |
| Commissions | commissions.api.js + commissions.api.test.js (5 tests) | CommissionsPage | /commissions | Backend uses the singular /commissions prefix; list/approve/pay + summary. |
| Referrals | referrals.api.js + referrals.api.test.js (3 tests) | ReferralsPage | /referrals | Backend uses the singular /referral prefix (/referral/code, /referral/join, /referral/stats). |
| Duplicate route | AppRoutes.jsx | — | — | Removed the duplicate /settings route. |
| Sidebar nav | Sidebar.jsx | — | — | Added Referrals, Commissions and MFA entries against the flat /mfa route. |

Verification snapshot:

- npx vitest run -> 61 passed across 9 test files (3 new: referrals=3, commissions=5, mfa=4).
- npm run build -> success (2539 modules transformed; only pre-existing PostCSS gradient warnings).
- npx eslint on all new/changed source -> 0 errors. One pre-existing lint note: an `Icon` false-positive in Sidebar.jsx's untouched render block ({items.map(({ to, icon: Icon, label }) => <Icon/>)}) because the flat config enables no-unused-vars with varsIgnorePattern ^[A-Z_] but not react/jsx-uses-vars; a destructured prop-component referenced only as a JSX element is flagged. Out of scope for this parity pass.

## Parity pass (source-audited corrections + fixes)

Fresh source inspection corrected several stale 🔴 entries — the items below already had functional
frontend (API module + page + route) that the earlier matrix had marked MISSING:

- API keys, Sessions, Login history & security events -> live inside `security.api.js` +
  `SecurityCenter.jsx` (`/security`).
- Expenditures -> `expenditures.api.js` + `ExpendituresPage.jsx` (`/expenditures`).
- IPAM -> `ipam.api.js` + `IpamPage.jsx` (`/ipam`).
- Network incidents -> `incidents.api.js` + `IncidentsPage.jsx` (`/incidents`).
- Technician locations/availability -> exposed via the `field-ops` catalog group in `CatalogPage.jsx` (`/catalog`).

### Implemented in this pass

| # | Change | Evidence |
|---|--------|----------|
| 11 | **Payment Allocations page** (was the one genuinely missing UI piece for this domain). Created `src/pages/payment-allocations/PaymentAllocationsPage.jsx` wired to the existing `payment-allocations.api.js` (`GET/POST /payment-allocations`, `POST /payment-allocations/{id}/reverse`), added `/payment-allocations` route + "Allocations" sidebar entry. Added `payment-allocations.api.test.js` (4 tests). | backend `PaymentAllocationController`/`PaymentAllocationService` verified |
| 1 (auth) | **Fixed password-reset/catalog endpoints** in `auth.api.js`. The frontend was calling `/auth/forgot-password` and `/auth/reset-password`, but the backend routes are `/auth/password/forgot` and `/auth/password/reset` (PasswordResetController) -> password reset returned 404. Added `auth.api.test.js` (5 tests) locking the contract. | `routes_full.txt` L41–42 |
| GE | **Fixed CatalogPage `switchGroup` bug** – the JSX `return (` was trapped inside `switchGroup()`, leaving stray `setState` calls that ran during render (`react-hooks/set-state-in-render`), breaking group switching and filling the console with render-time setState errors. Restructured so the return belongs to the component. `eslint` on CatalogPage is now clean. | eslint before/after |

### Verification (this pass)

- npx vitest run -> **70 passed across 11 test files** (+4 payment-allocations, +5 auth.api).
- npm run build -> success (2541 modules transformed; only pre-existing PostCSS gradient + chunk-size warnings).
- npx eslint on all new/changed files -> 0 errors.

### Remaining known lint noise (pre-existing, not functional regressions)

- `react-hooks/set-state-in-effect` warnings/errors in `ClientCustomFields.jsx`, `ClientNotes.jsx`,
  `WorkOrdersPage.jsx` (data-load via `useEffect`+local state rather than TanStack Query).
- `no-unused-vars` *Icon* reports in several page files (flat-config `react/jsx-uses-vars` not enabled).
- `no-unused-vars` for destructured-but-unused values in `RadiusTab.jsx`, `VoucherList.jsx`,
  `CaptivePortal.jsx`.
