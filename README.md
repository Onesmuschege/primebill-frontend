# PrimeBill ISP Platform — Frontend

> **PrimeBill ISP Platform** (short brand: **PrimeBill**) is the React-based web application for the PRIMEBILL ISP PLATFORM multi-tenant ISP OSS/BSS platform. It provides tenant administration, client self-service, public captive portal functionality, network/NOC operations, billing, support, CRM, inventory, reporting, security, and PrimeBill ISP Platform administration.

[Branding & nomenclature → BRANDING.md](BRANDING.md)

![React](https://img.shields.io/badge/React-18.x-blue)
![Vite](https://img.shields.io/badge/Vite-8.x-purple)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-cyan)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-5.x-red)
![License](https://img.shields.io/badge/License-Proprietary-red)

---

# 1. Product Overview

PrimeBill ISP Platform (the frontend) is the presentation and interaction layer for the PrimeBill ISP Platform backend.

It provides three primary experiences:

1. **Tenant Admin Dashboard**
2. **Client Portal**
3. **Public Captive Portal**

It also provides a separate **Platform Administration Console** for cross-tenant PrimeBill operations.

---

# 2. Platform Scope

| Phase | Domain | Frontend Coverage |
|---|---|---|
| 01 | Platform | Admin, roles, permissions, tenants, SaaS plans, subscriptions, settings |
| 02 | Network Foundation | Routers, RADIUS, NOC, OLT, Fiber, ONT, IPAM interfaces |
| 03 | Customer Foundation | ISP plans, clients, accounts, wallets, enrichment |
| 04 | Billing | Taxes, discounts, invoices, payments, allocations, ledger, usage, refunds, notes, dunning |
| 05 | Inventory | Warehouses, suppliers, stock, purchase orders, assignments |
| 06 | Support | Departments, queues, categories, SLA, KB, tickets, maintenance, work orders |
| 07 | CRM / Communication | Leads, campaigns, CX, templates, communications, notifications, announcements, webhooks |
| 08 | Operations | RADIUS sessions, traffic, ONT history/events, SMS logs |
| 09 | Reporting | Dashboards, saved reports, report schedules |
| 10 | Security | Security events, devices, login history, MFA recovery |

---

# 3. Frontend Architecture

```mermaid
flowchart TB
    USER["Browser User"]

    subgraph APP["PrimeBill React SPA"]
        ROUTER["React Router"]
        GUARD["Protected Routes"]
        LAYOUT["Application Layouts"]
        PAGES["Feature Pages"]
        COMPONENTS["Reusable Components"]
        STATE["Zustand State"]
        QUERY["TanStack Query"]
        API["Axios API Client"]
    end

    subgraph BACKEND["PrimeBill Laravel API"]
        AUTH["Authentication"]
        DOMAIN["Domain API"]
    end

    subgraph SERVICES["External Services"]
        MPESA["M-Pesa"]
        SMS["SMS"]
        NETWORK["Network Infrastructure"]
    end

    USER --> ROUTER
    ROUTER --> GUARD
    GUARD --> LAYOUT
    LAYOUT --> PAGES
    PAGES --> COMPONENTS
    PAGES --> QUERY
    QUERY --> API
    STATE --> PAGES
    API --> AUTH
    API --> DOMAIN
    DOMAIN --> MPESA
    DOMAIN --> SMS
    DOMAIN --> NETWORK
```

---

# 4. Application Experiences

```mermaid
flowchart TB
    APP["PrimeBill Frontend"]

    ADMIN["Tenant Admin Dashboard"]
    CLIENT["Client Portal"]
    CAPTIVE["Public Captive Portal"]
    PLATFORM["Platform Admin Console"]

    APP --> ADMIN
    APP --> CLIENT
    APP --> CAPTIVE
    APP --> PLATFORM

    ADMIN --> BILLING["Billing"]
    ADMIN --> NETWORK["Network / NOC"]
    ADMIN --> CUSTOMER["Customers"]
    ADMIN --> SUPPORT["Support"]
    ADMIN --> INVENTORY["Inventory"]
    ADMIN --> CRM["CRM"]
    ADMIN --> REPORTING["Reporting"]
    ADMIN --> SECURITY["Security"]

    CLIENT --> SELF["Self-Service"]
    CAPTIVE --> HOTSPOT["Hotspot Access"]
    PLATFORM --> TENANTS["Cross-Tenant Administration"]
```

---

# 5. Phase 01 — Platform UI

```mermaid
flowchart TB
    ADMIN["Platform Admin"]
    DASH["Platform Dashboard"]
    TENANTS["Tenants"]
    SUBS["Subscriptions"]
    ANALYTICS["Subscription Analytics"]
    AUDIT["Platform Audit Log"]
    CONFIG["Tenant Configuration"]

    ADMIN --> DASH
    ADMIN --> TENANTS
    ADMIN --> SUBS
    ADMIN --> ANALYTICS
    ADMIN --> AUDIT
    TENANTS --> CONFIG
```

Relevant routes include:

| Route | Purpose |
|---|---|
| `/platform` | Platform dashboard |
| `/platform/tenants` | Tenant administration |
| `/platform/tenants/:id` | Tenant details/configuration |
| `/platform/subscriptions` | SaaS subscriptions |
| `/platform/analytics` | Subscription analytics |
| `/platform/audit-log` | Platform audit log |

---

# 6. Phase 02 — Network Foundation UI

```mermaid
flowchart TB
    NETWORK["Network Foundation"]

    ROUTERS["Routers"]
    RADIUS["RADIUS"]
    IPAM["IPAM"]
    NOC["NOC"]
    OLT["OLT"]
    FIBER["Fiber"]
    ONT["ONT"]

    NETWORK --> ROUTERS
    NETWORK --> RADIUS
    NETWORK --> IPAM
    NETWORK --> NOC
    NETWORK --> OLT
    NETWORK --> FIBER
    NETWORK --> ONT

    NOC --> ALERTS["Alerts"]
    NOC --> DEVICES["Devices"]
    NOC --> LINKS["Topology Links"]
    OLT --> PON["PON / ONTs"]
```

---

# 7. Phase 03 — Customer Foundation UI

```mermaid
flowchart TB
    CUSTOMER["Customer Foundation"]
    PLANS["ISP Plans"]
    CLIENTS["Clients"]
    ACCOUNTS["Client Accounts"]
    WALLET["Wallet"]
    ENRICH["Client Enrichment"]

    CUSTOMER --> PLANS
    CUSTOMER --> CLIENTS
    CLIENTS --> ACCOUNTS
    CLIENTS --> WALLET
    CLIENTS --> ENRICH
    PLANS --> ACCOUNTS
```

---

# 8. Phase 04 — Billing UI

```mermaid
flowchart LR
    BILLING["Billing"]
    TAX["Taxes"]
    DISCOUNT["Discounts"]
    INVOICE["Invoices"]
    PAYMENT["Payments"]
    ALLOCATION["Allocations"]
    LEDGER["Ledger"]
    USAGE["Usage"]
    REFUND["Refunds"]
    NOTES["Credit / Debit Notes"]
    DUNNING["Dunning"]

    BILLING --> TAX
    BILLING --> DISCOUNT
    BILLING --> INVOICE
    INVOICE --> PAYMENT
    PAYMENT --> ALLOCATION
    ALLOCATION --> LEDGER
    BILLING --> USAGE
    BILLING --> REFUND
    BILLING --> NOTES
    INVOICE --> DUNNING
```

---

# 9. Phase 05 — Inventory UI

```mermaid
flowchart TB
    INVENTORY["Inventory"]
    WAREHOUSE["Warehouses"]
    SUPPLIER["Suppliers"]
    ITEMS["Inventory Items"]
    MOVEMENTS["Stock Movements"]
    PO["Purchase Orders"]
    ASSIGN["Assignments"]

    INVENTORY --> WAREHOUSE
    INVENTORY --> SUPPLIER
    INVENTORY --> ITEMS
    ITEMS --> MOVEMENTS
    INVENTORY --> PO
    ITEMS --> ASSIGN
```

---

# 10. Phase 06 — Support UI

```mermaid
flowchart TB
    SUPPORT["Support"]
    DEPT["Departments"]
    QUEUE["Queues"]
    CATEGORY["Categories"]
    SLA["SLA Policies"]
    KB["Knowledge Base"]
    TICKETS["Tickets"]
    MAINT["Maintenance"]
    WO["Work Orders"]
    PARTS["Work Order Parts"]

    SUPPORT --> DEPT
    SUPPORT --> QUEUE
    SUPPORT --> CATEGORY
    SUPPORT --> SLA
    SUPPORT --> KB
    SUPPORT --> TICKETS
    SUPPORT --> MAINT
    SUPPORT --> WO
    WO --> PARTS
```

---

# 11. Phase 07 — CRM / Communication UI

```mermaid
flowchart TB
    CRM["CRM / Communication"]
    LEADS["Leads"]
    CAMPAIGNS["Campaigns"]
    CX["Customer Experience"]
    TEMPLATES["Templates"]
    LOGS["Communication Logs"]
    NOTIFICATIONS["Notifications"]
    ANNOUNCEMENTS["Announcements"]
    WEBHOOKS["Webhooks"]

    CRM --> LEADS
    CRM --> CAMPAIGNS
    CRM --> CX
    CRM --> TEMPLATES
    CRM --> LOGS
    CRM --> NOTIFICATIONS
    CRM --> ANNOUNCEMENTS
    CRM --> WEBHOOKS
```

---

# 12. Phase 08 — Operations UI

```mermaid
flowchart TB
    OPERATIONS["Operations"]
    SESSIONS["RADIUS Sessions"]
    TRAFFIC["Network Traffic"]
    SIGNAL["ONT Signal History"]
    EVENTS["ONT Events"]
    SMS["SMS Logs"]

    OPERATIONS --> SESSIONS
    OPERATIONS --> TRAFFIC
    OPERATIONS --> SIGNAL
    OPERATIONS --> EVENTS
    OPERATIONS --> SMS
```

---

# 13. Phase 09 — Reporting UI

```mermaid
flowchart TB
    DATA["Platform Data"]

    DASH["Dashboards"]
    SAVED["Saved Reports"]
    SCHEDULED["Report Schedules"]

    DATA --> DASH
    DATA --> SAVED
    SAVED --> SCHEDULED
```

---

# 14. Phase 10 — Security UI

```mermaid
flowchart TB
    SECURITY["Security"]
    EVENTS["Security Events"]
    DEVICES["User Devices"]
    LOGINS["Login History"]
    MFA["MFA"]
    RECOVERY["Recovery Codes"]

    SECURITY --> EVENTS
    SECURITY --> DEVICES
    SECURITY --> LOGINS
    SECURITY --> MFA
    MFA --> RECOVERY
```

---

# 15. Admin Navigation Map

```mermaid
flowchart LR
    DASH["Dashboard"]
    CUSTOMERS["Customers"]
    BILLING["Billing"]
    NETWORK["Network"]
    SUPPORT["Support"]
    INVENTORY["Inventory"]
    CRM["CRM"]
    REPORTS["Reports"]
    SETTINGS["Settings"]

    DASH --> CUSTOMERS
    DASH --> BILLING
    DASH --> NETWORK
    DASH --> SUPPORT
    DASH --> INVENTORY
    DASH --> CRM
    DASH --> REPORTS
    DASH --> SETTINGS
```

---

# 16. Key Admin Features

### Dashboard

- Income today/month
- Active clients
- Ticket statistics
- Network traffic
- Top downloaders
- Revenue and growth charts

### Client Management

- Client CRUD
- Client details
- Service accounts
- Account status
- Notes
- Tags
- Custom fields
- Invoice/payment/ticket history

### Plans & Services

- PPPoE
- Hotspot
- Static IP
- Upload/download speeds
- FUP
- Burst profiles

### Vouchers

- Generate batches
- Plan assignment
- Expiry
- Status filtering
- Copy/delete
- CSV export

### Billing

- Invoice management
- Payment recording
- M-Pesa
- Cash
- Bank transfer
- Bulk invoice generation
- PDF export

### Network

- Router management
- MikroTik connection testing
- RADIUS sessions
- Network traffic
- NOC
- OLTs
- Fiber
- ONTs

### Support

- Tickets
- Replies
- Assignment
- Escalation
- SLA
- Work orders
- Technicians

### Inventory

- Stock
- Low-stock alerts
- Purchase orders
- Assignments
- Returns

### CRM

- Leads
- Prospects
- Pipeline
- Conversion
- Campaigns
- Customer experience

---

# 17. Client Portal

```mermaid
flowchart TB
    CLIENT["Client"]
    LOGIN["Login"]
    DASH["Client Dashboard"]
    INVOICES["Invoices"]
    PAYMENTS["Payments"]
    TICKETS["Tickets"]
    PROFILE["Profile"]

    CLIENT --> LOGIN
    LOGIN --> DASH
    DASH --> INVOICES
    DASH --> PAYMENTS
    DASH --> TICKETS
    DASH --> PROFILE
```

Client portal capabilities include:

- Account status
- Expiry countdown
- Balance
- Invoice history
- M-Pesa self-payment
- Ticket submission
- Ticket replies
- Profile management
- Password management

---

# 18. Public Captive Portal

Route:

```text
/captive/:tenantSlug
```

```mermaid
sequenceDiagram
    participant C as Hotspot Client
    participant UI as Captive Portal
    participant API as PrimeBill API
    participant MP as M-Pesa
    participant R as Network

    C->>UI: Open tenant captive portal
    UI->>API: Load public plans
    API-->>UI: Plans / theme / status
    C->>UI: Select plan
    UI->>API: Initiate payment
    API->>MP: STK Push
    MP-->>C: Payment prompt
    MP->>API: Callback
    API->>R: Provision / authorize access
    API-->>UI: Updated status
```

Capabilities:

- Public plan browsing
- Tenant branding
- Status checking
- M-Pesa payment
- Voucher redemption
- No authenticated admin session required

---

# 19. Authentication Architecture

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React App
    participant API as Laravel API
    participant AUTH as Auth Layer

    U->>UI: Submit credentials
    UI->>API: Login request
    API->>AUTH: Authenticate
    AUTH-->>API: Token / session
    API-->>UI: Authentication response
    UI->>UI: Store auth state
    UI->>API: Authenticated request
    API-->>UI: Protected response
```

The Axios client handles:

- Base API URL
- Bearer token attachment
- Authentication headers
- 401 handling
- Session expiry redirect

---

# 20. API Data Flow

```mermaid
flowchart LR
    PAGE["Page"]
    COMPONENT["Component"]
    QUERY["TanStack Query"]
    AXIOS["Axios"]
    API["Laravel API"]
    DB["Database"]

    PAGE --> COMPONENT
    COMPONENT --> QUERY
    QUERY --> AXIOS
    AXIOS --> API
    API --> DB
    DB --> API
    API --> AXIOS
    AXIOS --> QUERY
    QUERY --> COMPONENT
```

---

# 21. State Management

```mermaid
flowchart TB
    UI["React UI"]
    AUTH["Zustand Auth State"]
    SERVER["TanStack Query Server State"]
    API["Axios API Client"]
    BACKEND["Laravel API"]

    UI --> AUTH
    UI --> SERVER
    SERVER --> API
    API --> BACKEND
    BACKEND --> API
    API --> SERVER
```

Use:

- **Zustand** for lightweight client/global state.
- **TanStack Query** for server state, caching and request lifecycle.
- **Axios** for HTTP communication.
- React local state for component-specific UI state.

---

# 22. Project Structure

```text
primebill-frontend/
├── src/
│   ├── api/
│   │   ├── axiosInstance.js
│   │   ├── catalog.api.js
│   │   ├── clients.api.js
│   │   ├── invoices.api.js
│   │   ├── platform.api.js
│   │   ├── subscription.api.js
│   │   ├── work-orders.api.js
│   │   └── ...
│   ├── components/
│   │   ├── layout/
│   │   ├── common/
│   │   ├── work-orders/
│   │   └── field-operations/
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── layouts/
│   │   ├── PlatformLayout.jsx
│   │   └── ...
│   ├── pages/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── clients/
│   │   ├── plans/
│   │   ├── fup/
│   │   ├── invoices/
│   │   ├── payments/
│   │   ├── tickets/
│   │   ├── sms/
│   │   ├── routers/
│   │   ├── inventory/
│   │   ├── radius/
│   │   ├── noc/
│   │   ├── fiber/
│   │   ├── work-orders/
│   │   ├── subscription/
│   │   ├── finance/
│   │   ├── reports/
│   │   ├── analytics/
│   │   ├── loyalty/
│   │   ├── vouchers/
│   │   ├── leads/
│   │   ├── prospects/
│   │   ├── admin/
│   │   ├── logs/
│   │   ├── settings/
│   │   ├── catalog/
│   │   ├── portal/
│   │   └── platform/
│   ├── routes/
│   │   ├── AppRoutes.jsx
│   │   └── ProtectedRoute.jsx
│   ├── utils/
│   │   ├── formatCurrency.js
│   │   ├── formatDate.js
│   │   └── statusColors.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

---

# 23. Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| Vite | 8 | Build tool |
| TailwindCSS | 4 | Styling |
| React Router DOM | 7 | Routing |
| TanStack Query | 5 | Server state |
| Axios | 1.x | HTTP client |
| Recharts | 3 | Charts |
| Zustand | 5 | Global state |
| Lucide React | 1.x | Icons |
| React Hot Toast | 2.x | Notifications |
| Vitest | Current project version | Testing |
| Testing Library | Current project version | Component testing |
| MSW | Current project version | API mocking |

---

# 24. Routes

| Route | Purpose |
|---|---|
| `/login` | Login |
| `/signup` | Tenant signup |
| `/forgot-password` | Password reset request |
| `/reset-password` | Password reset |
| `/unauthorized` | Unauthorized |
| `/dashboard` | Tenant dashboard |
| `/clients` | Client list |
| `/clients/:id` | Client detail |
| `/plans` | ISP plans |
| `/vouchers` | Vouchers |
| `/fup` | FUP management |
| `/invoices` | Invoices |
| `/payments` | Payments |
| `/tickets` | Tickets |
| `/tickets/:id` | Ticket detail |
| `/sms` | SMS |
| `/routers` | Routers |
| `/radius` | RADIUS |
| `/inventory` | Inventory |
| `/noc` | NOC dashboard |
| `/noc/devices` | NOC devices |
| `/noc/alerts` | NOC alerts |
| `/noc/links` | NOC topology |
| `/fiber/olts` | OLT list |
| `/fiber/olts/:id` | OLT detail |
| `/fiber/map` | Fiber map |
| `/work-orders` | Work orders |
| `/subscription/plans` | SaaS plans |
| `/subscription/my` | Current subscription |
| `/finance` | Finance |
| `/reports` | Reports |
| `/analytics` | Analytics |
| `/loyalty` | Loyalty |
| `/leads` | Leads |
| `/leads/:id` | Lead detail |
| `/prospects` | Prospects |
| `/prospects/:id` | Prospect detail |
| `/admin/users` | Admin users |
| `/admin/roles` | Roles |
| `/logs` | System logs |
| `/settings` | Settings |
| `/catalog` | Catalog |
| `/captive/:tenantSlug` | Captive portal |
| `/platform` | Platform dashboard |
| `/platform/tenants` | Tenants |
| `/platform/tenants/:id` | Tenant detail |
| `/platform/subscriptions` | Platform subscriptions |
| `/platform/analytics` | Platform analytics |
| `/platform/audit-log` | Platform audit log |

---

# 25. Getting Started

## Requirements

- Node.js 20+
- npm 10+
- PrimeBill Laravel API

## Clone

```bash
git clone https://github.com/Onesmuschege/primebill-frontend.git
cd primebill-frontend
```

## Install

```bash
npm install
```

## Environment

Create `.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

## Development

```bash
npm run dev
```

Default development URL:

```text
http://localhost:5173
```

---

# 26. Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |
| `npm run test:watch` | Watch tests |
| `npm run test:ui` | Vitest UI |
| `npm run coverage` | Coverage |

---

# 27. Demo Authentication

After backend seeding:

```text
PrimeNet ISP
primenet-isp.admin@primebill.test
primenet-isp.staff@primebill.test
primenet-isp.support@primebill.test
primenet-isp.technician@primebill.test
primenet-isp.finance@primebill.test

SwiftLink Communications
swiftlink-communications.admin@primebill.test
swiftlink-communications.staff@primebill.test
swiftlink-communications.support@primebill.test
swiftlink-communications.technician@primebill.test
swiftlink-communications.finance@primebill.test

MetroWave Internet
metrowave-internet.admin@primebill.test
metrowave-internet.staff@primebill.test
metrowave-internet.support@primebill.test
metrowave-internet.technician@primebill.test
metrowave-internet.finance@primebill.test
```

Password:

```text
Demo@1234
```

Change demo passwords after first login.

---

# 28. Frontend ↔ Backend Contract

```mermaid
flowchart LR
    UI["React UI"]
    API_MODULE["Domain API Module"]
    AXIOS["Axios"]
    ROUTES["Laravel API Routes"]
    CONTROLLER["Controller"]
    SERVICE["Domain Service"]
    MODEL["Eloquent Model"]
    DB["Database"]

    UI --> API_MODULE
    API_MODULE --> AXIOS
    AXIOS --> ROUTES
    ROUTES --> CONTROLLER
    CONTROLLER --> SERVICE
    SERVICE --> MODEL
    MODEL --> DB
```

The frontend should not invent backend capabilities.

Where a backend operation is unavailable, the UI should expose a truthful state such as:

- unavailable
- not configured
- coming soon
- integration required
- permission denied
- no data

It should not present a fake successful operation.

---

# 29. UI / UX Principles

PrimeBill's frontend should prioritize:

1. Clear information hierarchy.
2. Consistent navigation.
3. Responsive layouts.
4. Accessible controls.
5. Consistent status indicators.
6. Fast feedback after actions.
7. Loading and empty states.
8. Error states with actionable messages.
9. Confirmation for destructive actions.
10. Tenant-aware data presentation.
11. Permission-aware navigation.
12. Professional ISP/OSS/BSS visual language.

---

# 30. Analytics & Visualization

Recharts is used for:

- Revenue trends
- Client growth
- Payment-method breakdown
- Plan distribution
- Traffic trends
- Network utilization
- Financial summaries

```mermaid
flowchart LR
    BILLING["Billing"]
    CUSTOMERS["Customers"]
    NETWORK["Network"]
    SUPPORT["Support"]
    INVENTORY["Inventory"]

    BILLING --> ANALYTICS["Analytics"]
    CUSTOMERS --> ANALYTICS
    NETWORK --> ANALYTICS
    SUPPORT --> ANALYTICS
    INVENTORY --> ANALYTICS

    ANALYTICS --> CHARTS["Charts"]
    ANALYTICS --> TABLES["Tables"]
    ANALYTICS --> KPI["KPIs"]
```

---

# 31. Production Build

```bash
npm run build
```

Build output:

```text
dist/
```

Example Nginx configuration:

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

The frontend can also be deployed to Vercel or another static hosting provider with:

```env
VITE_API_BASE_URL=https://your-api-domain.example/api
```

---

# 32. Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000/api` | Laravel API base URL |

---

# 33. Security Considerations

The frontend must:

- Never hard-code production secrets.
- Never expose M-Pesa consumer secrets.
- Never expose SMS gateway credentials.
- Never assume client-side permissions are sufficient.
- Treat backend authorization as authoritative.
- Handle expired sessions.
- Avoid displaying sensitive data unnecessarily.
- Use HTTPS in production.
- Validate destructive-action confirmations.
- Avoid storing unnecessary sensitive information in browser storage.

---

# 34. Testing Strategy

```mermaid
flowchart TB
    UNIT["Component / Unit Tests"]
    QUERY["Query / API Tests"]
    ROUTES["Route / Guard Tests"]
    E2E["End-to-End Validation"]
    BUILD["Production Build"]

    UNIT --> QUERY
    QUERY --> ROUTES
    ROUTES --> E2E
    E2E --> BUILD
```

Recommended validation before release:

```bash
npm run lint
npm test
npm run build
```

---

# 35. Current Implementation Boundaries

Some UI areas may depend on backend capability or external infrastructure.

Examples:

- MikroTik operations require reachable routers.
- FreeRADIUS operations require RADIUS infrastructure.
- OLT/ONT telemetry requires supported infrastructure.
- M-Pesa operations require configured backend credentials.
- SMS requires an active provider.
- Platform security/system pages may remain placeholders until their backend/API contracts are complete.

The UI should clearly distinguish implemented functionality from unavailable integrations.

---

# 36. Backend Repository

PrimeBill API:

`https://github.com/Onesmuschege/primebill-api`

Frontend repository:

`https://github.com/Onesmuschege/primebill-frontend`

---

# 37. License

Proprietary — All rights reserved.

Unauthorized copying, distribution, modification, or commercial use is prohibited.

---

## PrimeBill Frontend

**A unified web interface for ISP billing, network operations, customer management and PrimeBill SaaS administration.**
