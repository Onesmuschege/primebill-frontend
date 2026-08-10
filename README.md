# PrimeBill Frontend

> The admin dashboard, client portal, and public captive-portal for PrimeBill — a multi-tenant ISP billing and network management platform.

![React](https://img.shields.io/badge/React-18.x-blue) ![Vite](https://img.shields.io/badge/Vite-8.x-purple) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-cyan) ![License](https://img.shields.io/badge/License-Proprietary-red)

---

## Overview

PrimeBill Frontend is a React SPA that provides:
- **Tenant Admin Dashboard** — subscriber management, billing, network operations, NOC, fiber/OLT, field operations, CRM, and platform subscription management
- **Client Portal** — self-service account view, invoices, M-Pesa payments, and tickets
- **Public Captive Portal** — hotspot plan browsing, payment, and voucher redemption without login

The app talks to the [PrimeBill Laravel API](https://github.com/Onesmuschege/primebill-api) via a token-authenticated Axios client.

---

## Features

### Admin Dashboard
- **Real-time Statistics** — Income today/monthly, active users, ticket counts, traffic and top-downloader widgets
- **Client Management** — Full CRUD, account suspension/activation, notes, tags, custom fields, account/invoice/payment/ticket history per client
- **Plans & Services** — PPPoE, Hotspot, and Static IP plan cards with FUP, burst, and upload/download speed fields
- **Vouchers** — Stats cards, status filter, per-row copy/delete, CSV export, and a generate modal (plan/quantity/expiry)
- **FUP Management** — Throttle event stats, per-account FUP status table, and manual reset action
- **Invoicing** — Filter by status, record payment inline, bulk-generate, PDF export
- **Payments** — M-Pesa STK Push, cash, and bank transfer recording with daily summaries and receipts
- **Ticketing System** — Open/Pending/Solved workflow, threaded replies, assignment, escalate and close actions
- **SMS Notifications** — Single and bulk SMS composer via Africa's Talking or Hostpinnacle
- **Router Management** — MikroTik RouterOS API integration with connection test and live session monitoring
- **RADIUS** — Session/status view wired to the backend RADIUS controller; advanced RADIUS profiles
- **Loyalty Points** — Client balance display, point history, manual adjust modal, and leaderboard
- **Analytics** — Monthly revenue bar chart, client growth trend, payment-method breakdown, plan distribution, and finance overview (Recharts)
- **Admin Users & Roles** — User management and a permission-toggle UI backed by Spatie roles
- **Network Traffic** — Daily/weekly Tx/Rx graphs per router
- **Inventory** — Equipment tracking, assignment to clients, low-stock alerts, purchase orders
- **Finance & Expenditure** — Income vs expenditure summaries, sales commissions
- **Reports** — Income, clients, invoices, SMS, network, and inventory reports with CSV export
- **System Logs** — Full audit trail of admin actions with export
- **Settings** — Company info, M-Pesa credentials, SMS, Email, RADIUS, and system tabs with sensitive-field reveal toggles
- **Catalog** — Generic REST browser for service catalog, equipment, router config, RADIUS advanced, fiber extensions, inventory extensions, support catalog, communications, customer experience, security, field ops, and reporting resources

### Client Portal
- Account status and expiry countdown, balance view
- Invoice history
- M-Pesa STK Push self-payment
- Ticket submission and reply
- Profile and password management

### Public Captive Portal
- `/captive/:tenantSlug` route for hotspot users to view plans, check status, pay via M-Pesa, and redeem vouchers — no login required, matching the backend's public `portal/captive/*` endpoints

### NOC & Fiber
- **NOC Dashboard** — Overview, devices with metrics, alert management (acknowledge/resolve), and topology links
- **Fiber / OLT** — OLT list and detail views, fiber route map with splitters, cabinets, and distribution points
- **Incidents** — Outage and incident management with status tracking

### Field Operations
- **Work Orders** — Stats, list view, technician assignment, and status tracking

### CRM
- **Leads** — Lead list and detail, stats, convert to prospect, mark as lost
- **Prospects** — Sales pipeline with stage advancement, mark won/lost, convert to client

### Platform Subscription (PrimeBill Licensing)
- **Plans & Pricing** — View available PrimeBill subscription plans
- **My Subscription** — Current plan, usage, trial/convert/cancel, invoices

### Platform Admin (cross-tenant)
- **Dashboard** — Cross-tenant stats
- **Tenants** — Tenant CRUD, configuration (company, branding, localization), lifecycle, quotas, feature flags
- **Subscriptions** — Platform-level subscription management
- **Analytics** — Subscription analytics
- **Audit Log** — Platform-wide audit trail

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| **React** | 18 | UI framework |
| **Vite** | 8 | Build tool & dev server |
| **TailwindCSS** | 4 | Utility-first styling (`@custom-variant dark` strategy) |
| **React Router DOM** | 7 | Client-side routing |
| **TanStack Query** | 5 | Server state management & caching |
| **Axios** | 1.x | HTTP client with auth interceptors |
| **Recharts** | 3 | Dashboard charts & graphs |
| **Zustand** | 5 | Lightweight global state (auth) |
| **Lucide React** | 1.x | Icon library |
| **React Hot Toast** | 2.x | Toast notifications |
| **Lucide React** | 1.x | Icon library |
| **React Hot Toast** | 2.x | Toast notifications |

Dev tooling includes ESLint 9, Vitest, `@vitest/ui`, Testing Library, and MSW.

---

## Project Structure

```
primebill-frontend/
├── src/
│   ├── api/                     # Axios instance + domain API modules
│   │   ├── axiosInstance.js     # Base client, auth interceptor, 401 handler
│   │   ├── catalog.api.js       # Generic REST for catalog domains
│   │   ├── clients.api.js
│   │   ├── invoices.api.js
│   │   ├── platform.api.js      # Cross-tenant platform-admin endpoints
│   │   ├── subscription.api.js
│   │   ├── work-orders.api.js
│   │   └── ...
│   ├── components/
│   │   ├── layout/              # AdminLayout, PlatformLayout, Sidebar
│   │   ├── common/              # Spinner, etc.
│   │   ├── work-orders/         # WorkOrderList, etc.
│   │   └── field-operations/    # WorkOrders component
│   ├── contexts/
│   │   └── AuthContext.jsx      # Auth state, login, logout, permissions
│   ├── layouts/
│   │   ├── PlatformLayout.jsx   # Platform admin shell
│   │   └── ...
│   ├── pages/                   # One folder per feature
│   │   ├── auth/                # Login, TenantSignup, ForgotPassword, ResetPassword, Unauthorized
│   │   ├── dashboard/           # Dashboard
│   │   ├── clients/             # ClientList, ClientDetail
│   │   ├── plans/               # PlanList
│   │   ├── fup/                 # FupManagement
│   │   ├── invoices/            # InvoiceList
│   │   ├── payments/            # PaymentList
│   │   ├── tickets/             # TicketList, TicketDetail
│   │   ├── sms/                 # SmsDashboard
│   │   ├── routers/             # RouterList
│   │   ├── inventory/           # InventoryList
│   │   ├── radius/              # RadiusPage
│   │   ├── noc/                 # NocDashboard, NocDevices, NocAlerts, NocLinks
│   │   ├── fiber/               # OltList, OltDetail, FiberMap
│   │   ├── work-orders/         # WorkOrdersPage
│   │   ├── subscription/        # SubscriptionPage, TenantSubscriptionPage
│   │   ├── finance/             # FinanceOverview
│   │   ├── reports/             # Reports
│   │   ├── analytics/           # Analytics
│   │   ├── loyalty/             # LoyaltyPoints
│   │   ├── vouchers/            # VoucherList
│   │   ├── leads/               # LeadList, LeadDetail
│   │   ├── prospects/           # ProspectList, ProspectDetail
│   │   ├── admin/               # AdminUsers, AdminRoles
│   │   ├── logs/                # SystemLogs
│   │   ├── settings/            # Settings, RadiusTab
│   │   ├── catalog/             # CatalogPage
│   │   ├── portal/              # CaptivePortal (public)
│   │   └── platform/            # PlatformDashboard, PlatformTenants, PlatformTenantDetail, PlatformSubscriptions, PlatformSubscriptionAnalytics, PlatformAuditLog
│   ├── routes/
│   │   ├── AppRoutes.jsx        # All route definitions
│   │   └── ProtectedRoute.jsx   # Auth guard + role guard
│   ├── utils/
│   │   ├── formatCurrency.js    # KES formatting
│   │   ├── formatDate.js        # Date & time helpers
│   │   └── statusColors.js      # Badge color mapping
│   ├── App.jsx
│   ├── index.css                # Tailwind + custom component classes
│   └── main.jsx                 # App entry point
│
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

---

## Prerequisites

- **Node.js** v20.x or higher
- **npm** v10.x or higher
- **PrimeBill API** (Laravel backend) running on `http://127.0.0.1:8000`

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Onesmuschege/primebill-frontend.git
cd primebill-frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

`src/api/axiosInstance.js` reads `import.meta.env.VITE_API_BASE_URL`, falling back to `http://127.0.0.1:8000/api` if the variable is unset.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Run tests

```bash
npm test
# or
npm run test:watch
```

### 6. Default login credentials

After running `php artisan migrate --seed` on the backend, each demo tenant gets 5 staff accounts:

```text
Tenant: PrimeNet ISP (primenet-isp)
  Email:    primenet-isp.admin@primebill.test
  Email:    primenet-isp.staff@primebill.test
  Email:    primenet-isp.support@primebill.test
  Email:    primenet-isp.technician@primebill.test
  Email:    primenet-isp.finance@primebill.test
  Password: Demo@1234  (set via SEED_DEMO_PASSWORD in backend .env)

Tenant: SwiftLink Communications (swiftlink-communications)
  Email:    swiftlink-communications.admin@primebill.test
  Email:    swiftlink-communications.staff@primebill.test
  Email:    swiftlink-communications.support@primebill.test
  Email:    swiftlink-communications.technician@primebill.test
  Email:    swiftlink-communications.finance@primebill.test
  Password: Demo@1234

Tenant: MetroWave Internet (metrowave-internet)
  Email:    metrowave-internet.admin@primebill.test
  Email:    metrowave-internet.staff@primebill.test
  Email:    metrowave-internet.support@primebill.test
  Email:    metrowave-internet.technician@primebill.test
  Email:    metrowave-internet.finance@primebill.test
  Password: Demo@1234
```

The **Platform Admin** (`is_platform_admin = true`) is NOT seeded automatically. Create it manually after seeding with:

```bash
php artisan platform:make-admin platform@primebill.co.ke
```

Change all demo passwords after first login.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:ui` | Open Vitest UI |
| `npm run coverage` | Generate coverage report |

---

## Backend API

This frontend connects to the **PrimeBill Laravel API**. Make sure the backend is running before starting the frontend.

Backend repository: [github.com/Onesmuschege/primebill-api](https://github.com/Onesmuschege/primebill-api)

The Axios instance is pre-configured with:
- **Base URL** — `VITE_API_BASE_URL`, defaulting to `http://127.0.0.1:8000/api`
- **Auth interceptor** — Automatically attaches Bearer token from `localStorage`
- **401 handler** — Clears token and redirects to login on session expiry

---

## Authentication

Authentication is handled via **Laravel Sanctum** token-based auth. On login, the token is stored in `localStorage` and automatically attached to all subsequent API requests via the Axios interceptor.

Roles supported (matching the backend's Spatie roles):
- `super_admin` — Full access to all modules
- `admin` — Most modules except system settings
- `staff` — Client management, billing, tickets
- `client` — Self-service portal only

Platform admins use a separate `is_platform_admin` flag and are routed to the `/platform/*` console.

---

## Key Pages

| Route | Page | Description |
|---|---|---|
| `/login` | Login | Email + password authentication |
| `/signup` | Tenant Signup | New tenant registration |
| `/forgot-password` | Forgot Password | Password reset request |
| `/reset-password` | Reset Password | Password reset form |
| `/unauthorized` | Unauthorized | Access denied page |
| `/dashboard` | Dashboard | Live stats, traffic graphs, top downloaders |
| `/clients` | Client List | Search, filter, suspend, activate clients |
| `/clients/:id` | Client Detail | Accounts, invoices, payments, tickets, notes, tags, custom fields |
| `/plans` | Plans | PPPoE/Hotspot plan cards with pricing |
| `/vouchers` | Vouchers | Batch generation, stats, redemption, CSV export |
| `/fup` | FUP Management | Throttle stats, per-account status, manual reset |
| `/invoices` | Invoices | Filter by status, record payment inline |
| `/payments` | Payments | Daily summary, M-Pesa/cash breakdown |
| `/tickets` | Tickets | Priority-coded list with stats |
| `/tickets/:id` | Ticket Detail | Threaded replies, close/escalate |
| `/sms` | SMS | Single and bulk SMS composer |
| `/routers` | Routers | MikroTik connection status & test |
| `/radius` | RADIUS | Session/status view |
| `/inventory` | Inventory | Stock management with low-stock alerts, purchase orders |
| `/noc` | NOC Dashboard | Overview, devices, alerts, topology |
| `/noc/devices` | NOC Devices | Device list with metrics |
| `/noc/alerts` | NOC Alerts | Alert list with acknowledge/resolve |
| `/noc/links` | NOC Links | Topology link management |
| `/fiber/olts` | OLT List | OLT management |
| `/fiber/olts/:id` | OLT Detail | OLT detail with PON ports and ONTs |
| `/fiber/map` | Fiber Map | Fiber infrastructure map |
| `/work-orders` | Work Orders | Work order stats and list |
| `/subscription/plans` | Subscription Plans | PrimeBill licensing plans |
| `/subscription/my` | My Subscription | Current plan, usage, invoices |
| `/finance` | Finance | Income vs expenditure, net revenue |
| `/reports` | Reports | Report types with date range filter |
| `/analytics` | Analytics | Revenue/growth/payment-method/plan-distribution charts |
| `/loyalty` | Loyalty Points | Client balances, history, leaderboard |
| `/leads` | Leads | Lead list, stats, convert |
| `/leads/:id` | Lead Detail | Lead detail with conversion to prospect |
| `/prospects` | Prospects | Sales pipeline |
| `/prospects/:id` | Prospect Detail | Prospect detail with stage advancement |
| `/admin/users` | Admin Users | User management |
| `/admin/roles` | Admin Roles | Role & permission management |
| `/logs` | System Logs | Full audit trail with export |
| `/settings` | Settings | Company, Billing, M-Pesa, SMS, Email, RADIUS, System |
| `/catalog` | Catalog | Generic REST browser for catalog domains |
| `/captive/:tenantSlug` | Captive Portal | Public hotspot plan browsing, payment, and voucher redemption |
| `/platform` | Platform Dashboard | Cross-tenant stats |
| `/platform/tenants` | Platform Tenants | Tenant management |
| `/platform/tenants/:id` | Platform Tenant Detail | Tenant config and lifecycle |
| `/platform/subscriptions` | Platform Subscriptions | Subscription management |
| `/platform/analytics` | Platform Analytics | Subscription analytics |
| `/platform/audit-log` | Platform Audit Log | Cross-tenant audit trail |

---

## Production Build

```bash
npm run build
```

The production-ready files will be in the `dist/` folder. Serve them with Nginx:

```nginx
server {
    listen 80;
    server_name app.primebill.com;
    root /var/www/primebill-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Deployment target: **Vercel** (with the backend on Railway) — set `VITE_API_BASE_URL` as a Vercel environment variable pointing at the Railway backend URL.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000/api` | Laravel API base URL |

---

## Known Issues

- **No `.env.example`:** the repo has no committed environment template, so a fresh clone needs `VITE_API_BASE_URL` set manually (see [Getting Started](#getting-started)).
- **Duplicate FUP page:** `src/pages/fup/FupManagement.jsx` is the one actually routed in `AppRoutes.jsx`; `src/pages/plans/FupManagement.jsx` appears to be a leftover from an earlier route layout and isn't referenced anywhere. Safe to remove once confirmed unused.
- **Frontend catalog pages are minimal:** the generic `CatalogPage` exists and the backend exposes 12+ catalog domains, but most lack dedicated list/detail pages in the frontend. The `CatalogPage` provides a basic browser.
- **Platform Security & System Health placeholders:** `/platform/security` and `/platform/system` routes render the dashboard placeholder until those modules are built.

---

## Contributing

This is a proprietary project. For feature requests or bug reports, please contact the development team.

---

## Related Repositories

- **Backend API:** [github.com/Onesmuschege/primebill-api](https://github.com/Onesmuschege/primebill-api)
- **Frontend:** [github.com/Onesmuschege/primebill-frontend](https://github.com/Onesmuschege/primebill-frontend)

---

## License

Proprietary — All rights reserved. Unauthorized copying, distribution, or use of this software is strictly prohibited.

---

## Author

**Onesmus Chege**
Built for Kenyan ISPs

---

*PrimeBill Frontend — DarkOpsHub*