# PrimeBill Frontend

> A modern, full-featured ISP Billing & Management System built with React, Vite, and TailwindCSS.

![React](https://img.shields.io/badge/React-18.x-blue) ![Vite](https://img.shields.io/badge/Vite-5.x-purple) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-cyan) ![License](https://img.shields.io/badge/License-Proprietary-red)

---

## Overview

PrimeBill is a comprehensive ISP billing and network management platform for small-to-mid-size ISPs in Kenya. The frontend is a single-page admin dashboard plus a client self-service portal and a public captive-portal payment flow — covering subscriber management, billing, vouchers, loyalty/referrals, FUP enforcement, MikroTik router integration, RADIUS status, and M-Pesa payments.

---

## Features

### Admin Dashboard
- **Real-time Statistics** — Income today/monthly, active users, ticket counts, traffic and top-downloader widgets
- **Client Management** — Full CRUD, account suspension/activation, account/invoice/payment/ticket history per client
- **Plans & Services** — PPPoE, Hotspot, and Static IP plan cards with FUP, burst, and upload/download speed fields
- **Vouchers** — Stats cards, status filter, per-row copy/delete, CSV export, and a generate modal (plan/quantity/expiry)
- **FUP Management** — Throttle event stats, per-account FUP status table, and manual reset action
- **Invoicing** — Filter by status, record payment inline, bulk-generate
- **Payments** — M-Pesa STK Push, cash, and bank transfer recording with daily summaries and receipts
- **Ticketing System** — Open/Pending/Solved workflow, threaded replies, assignment, and an escalate action
- **SMS Notifications** — Single and bulk SMS composer via Africa's Talking or Hostpinnacle
- **Router Management** — MikroTik RouterOS API integration with connection test and live session monitoring
- **RADIUS** — Session/status view wired to the backend RADIUS controller
- **Loyalty Points** — Client balance display, point history, manual adjust modal, and leaderboard
- **Analytics** — Monthly revenue bar chart, client growth trend, payment-method breakdown, and plan distribution (Recharts)
- **Admin Users & Roles** — User management and a permission-toggle UI backed by Spatie roles
- **Network Traffic** — Daily/weekly Tx/Rx graphs per router
- **Inventory** — Equipment tracking, assignment to clients, low-stock alerts
- **Finance & Expenditure** — Income vs expenditure summaries, sales commissions
- **Reports** — Income, clients, invoices, SMS, network, and inventory reports with CSV export
- **System Logs** — Full audit trail of admin actions
- **Settings** — Company info, M-Pesa credentials, SMS, and a RADIUS tab with per-tab test actions and sensitive-field reveal toggles

### Client Portal
- Account status and expiry countdown, balance view
- Invoice history
- M-Pesa STK Push self-payment
- Ticket submission and reply
- Profile and password management

### Public Captive Portal
- `/captive` route for hotspot users to view plans, check status, pay via M-Pesa, and redeem vouchers — no login required, matching the backend's public `portal/captive/*` endpoints

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite 5** | Build tool & dev server |
| **TailwindCSS 4** | Utility-first styling (`@custom-variant dark` strategy) |
| **React Router DOM 7** | Client-side routing |
| **TanStack Query 5** | Server state management & caching |
| **Axios** | HTTP client with auth interceptors |
| **Recharts 3** | Dashboard charts & graphs |
| **Zustand** | Lightweight global state |
| **Lucide React** | Icon library |
| **React Hot Toast** | Toast notifications |

Dev tooling includes ESLint 9, Vitest + `@vitest/ui`, Testing Library, and MSW — installed for testing, though no test files or `npm test` script exist in the repo yet (see [Known Issues](#known-issues--tech-debt)).

---

## Project Structure

```
primebill-frontend/
├── public/                     # Static assets
├── src/
│   ├── api/                    # Axios API call functions
│   │   ├── axiosInstance.js    # Base Axios config + auth interceptors
│   │   ├── auth.api.js
│   │   ├── admin.api.js
│   │   ├── clients.api.js
│   │   ├── dashboard.api.js
│   │   ├── fup.api.js
│   │   ├── invoices.api.js
│   │   ├── loyalty.api.js
│   │   ├── Logs.api.js
│   │   ├── payments.api.js
│   │   ├── plans.api.js
│   │   ├── radius.api.js
│   │   ├── routers.api.js
│   │   ├── sms.api.js
│   │   ├── tickets.api.js
│   │   └── vouchers.api.js
│   │
│   ├── components/
│   │   ├── common/             # Reusable UI components (Badge, Modal, Pagination, Spinner, Table, ...)
│   │   ├── dashboard/          # Dashboard-specific widgets (StatCard, ...)
│   │   └── layout/             # App shell components (AdminLayout, Sidebar, TopNav)
│   │
│   ├── context/
│   │   └── AuthContext.jsx     # Auth state, login, logout, permissions
│   │
│   ├── pages/                  # One folder per feature
│   │   ├── admin/               # AdminUsers, AdminRoles
│   │   ├── analytics/           # Analytics (Recharts dashboards)
│   │   ├── auth/                 # Login, ForgotPassword, ResetPassword, Unauthorized
│   │   ├── clients/               # ClientList, ClientDetail, ClientForm
│   │   ├── dashboard/             # Dashboard
│   │   ├── finance/                # FinanceOverview
│   │   ├── fup/                     # FupManagement
│   │   ├── inventory/                # InventoryList
│   │   ├── invoices/                  # InvoiceList
│   │   ├── loyalty/                    # LoyaltyPoints
│   │   ├── payments/                    # PaymentList
│   │   ├── plans/                        # PlanList (+ a stale duplicate FupManagement.jsx — see Known Issues)
│   │   ├── portal/                        # CaptivePortal (public)
│   │   ├── radius/                         # RadiusPage
│   │   ├── reports/                         # Reports
│   │   ├── routers/                          # RouterList
│   │   ├── settings/                          # Settings, RadiusTab
│   │   ├── sms/                                 # SmsDashboard
│   │   ├── tickets/                              # TicketList, TicketDetail, TicketListWithEscalate
│   │   └── vouchers/                              # VoucherList
│   │
│   ├── routes/
│   │   ├── AppRoutes.jsx       # All route definitions
│   │   └── ProtectedRoute.jsx  # Auth guard
│   │
│   ├── utils/
│   │   ├── formatCurrency.js   # KES formatting
│   │   ├── formatDate.js       # Date & time helpers
│   │   └── statusColors.js     # Badge color mapping
│   │
│   ├── App.jsx
│   ├── index.css               # Tailwind + custom component classes
│   └── main.jsx                # App entry point
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

There is no `.env.example` in the repo yet — create a `.env` file in the root yourself:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

`src/api/axiosInstance.js` already reads `import.meta.env.VITE_API_BASE_URL`, falling back to `http://127.0.0.1:8000/api` if the variable is unset — no code change needed, just set the `.env`.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Default login credentials

```
Email:    admin@primebill.co.ke
Password: Admin@123
```
(Set via `SEED_ADMIN_PASSWORD` when seeding the backend — change after first login.)

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

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

---

## Key Pages

| Route | Page | Description |
|---|---|---|
| `/login` | Login | Email + password authentication |
| `/dashboard` | Dashboard | Live stats, traffic graphs, top downloaders |
| `/clients` | Client List | Search, filter, suspend, activate clients |
| `/clients/:id` | Client Detail | Accounts, invoices, payments, tickets |
| `/plans` | Plans | PPPoE/Hotspot plan cards with pricing |
| `/vouchers` | Vouchers | Batch generation, stats, redemption, CSV export |
| `/fup` | FUP Management | Throttle stats, per-account status, manual reset |
| `/invoices` | Invoices | Filter by status, record payment inline |
| `/payments` | Payments | Daily summary, M-Pesa/cash breakdown |
| `/tickets` | Tickets | Priority-coded list with stats |
| `/tickets/:id` | Ticket Detail | Threaded replies, close/escalate |
| `/sms` | SMS | Single and bulk SMS composer |
| `/routers` | Routers | MikroTik connection status & test |
| `/inventory` | Inventory | Stock management with low-stock alerts |
| `/finance` | Finance | Income vs expenditure, net revenue |
| `/reports` | Reports | Report types with date range filter |
| `/analytics` | Analytics | Revenue/growth/payment-method/plan-distribution charts |
| `/loyalty` | Loyalty Points | Client balances, history, leaderboard |
| `/admin/users` | Admin Users | User management |
| `/admin/roles` | Admin Roles | Role & permission management |
| `/logs` | System Logs | Full audit trail |
| `/settings` | Settings | Company, M-Pesa, SMS, RADIUS config |
| `/captive` | Captive Portal | Public hotspot plan browsing, payment, and voucher redemption |

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

## Known Issues / Tech Debt

Found while auditing the codebase for this README update:

- **Duplicate FUP page:** `src/pages/fup/FupManagement.jsx` is the one actually routed in `AppRoutes.jsx`; `src/pages/plans/FupManagement.jsx` appears to be a leftover from an earlier route layout and isn't referenced anywhere. Safe to remove once confirmed unused.
- **No `.env.example`:** the repo has no committed environment template, so a fresh clone needs `VITE_API_BASE_URL` set manually (see [Getting Started](#getting-started)).
- **Testing tooling installed but unused:** Vitest, `@vitest/ui`, Testing Library, and MSW are devDependencies, but there's no `test` script in `package.json` and no `*.test.jsx` files in `src/` yet.

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