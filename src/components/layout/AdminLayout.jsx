import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopNav from './TopNav'

const pageTitles = {
  '/dashboard':   'Dashboard',
  '/clients':     'Clients',
  '/plans':       'Plans & Services',
  '/vouchers':    'Vouchers',
  '/fup':         'FUP Management',
  '/invoices':    'Invoices',
  '/payments':    'Payments',
  '/tickets':     'Support Tickets',
  '/sms':         'SMS',
  '/routers':     'Routers',
  '/inventory':   'Inventory',
  '/finance':     'Finance',
  '/reports':     'Reports',
  '/analytics':   'Analytics',
  '/loyalty':     'Loyalty Points',
  '/admin/users': 'Admin Users',
  '/admin/roles': 'Roles & Permissions',
  '/logs':        'System Logs',
  '/settings':    'Settings',
}

export default function AdminLayout() {
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const title = pageTitles[pathname]
    ?? pageTitles[Object.keys(pageTitles).find(k => pathname.startsWith(k + '/')) ?? '']
    ?? 'PrimeBill'

  return (
    // overflow-hidden on the root is intentional — it prevents the page body
    // from scrolling; only <main> scrolls internally. Do NOT add overflow
    // clipping to the sidebar column — the sidebar is fixed and exempt.
    <div
      className="flex h-screen overflow-hidden theme-transition"
      style={{ backgroundColor: 'var(--pb-bg)' }}
    >
      {/* Sidebar — always fixed, AdminLayout never renders its own backdrop.
          The Sidebar component handles mobile show/hide via translate-x. */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Content — lg:ml-64 compensates for the fixed sidebar width */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <TopNav title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}