# PrimeBill Frontend

> A modern, full-featured ISP Billing & Management System built with React, Vite, and TailwindCSS.

![PrimeBill Dashboard](https://img.shields.io/badge/Status-Active-brightgreen) ![React](https://img.shields.io/badge/React-18.x-blue) ![Vite](https://img.shields.io/badge/Vite-5.x-purple) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-cyan) ![License](https://img.shields.io/badge/License-Proprietary-red)

---

## Overview

PrimeBill is a comprehensive ISP billing and network management platform designed for small to mid-size Internet Service Providers in Kenya. The frontend provides a clean, responsive admin dashboard and a client self-service portal — covering everything from subscriber management and automated billing to MikroTik router integration and M-Pesa payment processing.

---

## Features

### Admin Dashboard
- **Real-time Statistics** — Income today/monthly, active users, ticket counts, network status
- **Client Management** — Full CRUD, account suspension/activation, account history
- **Plans & Services** — PPPoE, Hotspot, and Static IP plan management with FUP configuration
- **Invoicing Engine** — Auto-generated invoice numbers, bulk invoice generation, PDF export
- **Payments** — M-Pesa STK Push, cash, and bank transfer recording with daily summaries
- **Ticketing System** — Open/Pending/Solved workflow with threaded replies and escalation
- **SMS Notifications** — Single and bulk SMS via Africa's Talking or Hostpinnacle
- **Router Management** — MikroTik RouterOS API integration with live session monitoring
- **Network Traffic** — Daily and weekly Tx/Rx graphs per router
- **Inventory** — Equipment tracking, assignment to clients, low-stock alerts
- **Finance & Expenditure** — Income vs expenditure summaries, sales commissions
- **Reports** — Income, clients, invoices, SMS, network, and inventory reports with CSV export
- **System Logs** — Full audit trail of all admin actions
- **Settings** — Company info, M-Pesa credentials, SMS gateway, billing configuration

### Client Portal
- Account status and expiry countdown
- Invoice history and PDF download
- M-Pesa STK Push self-payment
- Ticket submission and reply
- Profile and password management

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite 5** | Build tool & dev server |
| **TailwindCSS 4** | Utility-first styling |
| **React Router DOM** | Client-side routing |
| **TanStack Query** | Server state management & caching |
| **Axios** | HTTP client with interceptors |
| **Recharts** | Dashboard charts & graphs |
| **Zustand** | Lightweight global state |
| **Lucide React** | Icon library |
| **React Hot Toast** | Toast notifications |

---

## Project Structure

```
primebill-frontend/
├── public/                     # Static assets
├── src/
│   ├── api/                    # Axios API call functions
│   │   ├── axiosInstance.js    # Base Axios config + auth interceptors
│   │   ├── auth.api.js
│   │   ├── clients.api.js
│   │   ├── dashboard.api.js
│   │   ├── invoices.api.js
│   │   ├── payments.api.js
│   │   ├── plans.api.js
│   │   ├── routers.api.js
│   │   ├── sms.api.js
│   │   └── tickets.api.js
│   │
│   ├── components/
│   │   ├── common/             # Reusable UI components
│   │   │   ├── Badge.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── Spinner.jsx
│   │   │   └── Table.jsx
│   │   ├── dashboard/          # Dashboard-specific widgets
│   │   │   └── StatCard.jsx
│   │   └── layout/             # App shell components
│   │       ├── AdminLayout.jsx
│   │       ├── Sidebar.jsx
│   │       └── TopNav.jsx
│   │
│   ├── context/
│   │   └── AuthContext.jsx     # Auth state, login, logout, permissions
│   │
│   ├── pages/                  # One folder per feature
│   │   ├── auth/               # Login page
│   │   ├── clients/            # Client list, detail, form
│   │   ├── dashboard/          # Main dashboard
│   │   ├── finance/            # Finance overview
│   │   ├── inventory/          # Inventory management
│   │   ├── invoices/           # Invoice list & payment modal
│   │   ├── logs/               # System logs
│   │   ├── payments/           # Payment list & summaries
│   │   ├── plans/              # Plan cards & creation
│   │   ├── reports/            # All report types
│   │   ├── routers/            # Router management
│   │   ├── settings/           # System settings
│   │   ├── sms/                # SMS composer
│   │   └── tickets/            # Ticket list & threaded detail
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

Make sure you have the following installed:

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

Create a `.env` file in the root:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Then update `src/api/axiosInstance.js` to use:

```js
baseURL: import.meta.env.VITE_API_BASE_URL,
```

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

Backend repository: [github.com/Onesmuschege/primebill](https://github.com/Onesmuschege/primebill)

The Axios instance is pre-configured with:
- **Base URL** — `http://127.0.0.1:8000/api`
- **Auth interceptor** — Automatically attaches Bearer token from `localStorage`
- **401 handler** — Clears token and redirects to login on session expiry

---

## Authentication

Authentication is handled via **Laravel Sanctum** token-based auth. On login, the token is stored in `localStorage` and automatically attached to all subsequent API requests via the Axios interceptor.

Roles supported:
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
| `/invoices` | Invoices | Filter by status, record payment inline |
| `/payments` | Payments | Daily summary, M-Pesa/cash breakdown |
| `/tickets` | Tickets | Priority-coded list with stats |
| `/tickets/:id` | Ticket Detail | Threaded replies, close/escalate |
| `/sms` | SMS | Single and bulk SMS composer |
| `/routers` | Routers | MikroTik connection status & test |
| `/inventory` | Inventory | Stock management with low-stock alerts |
| `/finance` | Finance | Income vs expenditure, net revenue |
| `/reports` | Reports | 6 report types with date range filter |
| `/logs` | System Logs | Full audit trail |
| `/settings` | Settings | Company, M-Pesa, SMS, billing config |

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

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000/api` | Laravel API base URL |

---

## Contributing

This is a proprietary project. For feature requests or bug reports, please contact the development team.

---

## Related Repositories

- **Backend API:** [github.com/Onesmuschege/primebill](https://github.com/Onesmuschege/primebill)
- **Frontend:** [github.com/Onesmuschege/primebill-frontend](https://github.com/Onesmuschege/primebill-frontend)

---

## License

Proprietary — All rights reserved. Unauthorized copying, distribution, or use of this software is strictly prohibited.

---

## Author

**Onesmus Chege**
Built with for Kenyan ISPs

---

*PrimeBill v1.0 — DarkOpsHub*