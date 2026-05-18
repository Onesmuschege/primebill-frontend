import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopNav from './TopNav'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/clients':   'Clients',
  '/plans':     'Plans & Services',
  '/invoices':  'Invoices',
  '/payments':  'Payments',
  '/tickets':   'Support Tickets',
  '/sms':       'SMS',
  '/routers':   'Routers',
  '/inventory': 'Inventory',
  '/finance':   'Finance',
  '/reports':   'Reports',
  '/logs':      'System Logs',
  '/settings':  'Settings',
}

export default function AdminLayout() {
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Match exact or nested routes (e.g. /clients/123 → 'Clients')
  const title = pageTitles[pathname]
    ?? pageTitles[Object.keys(pageTitles).find(k => pathname.startsWith(k + '/')) ?? '']
    ?? 'PrimeBill'

  return (
    <div className="flex h-screen overflow-hidden theme-transition"
      style={{ backgroundColor: 'var(--pb-bg)' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <TopNav title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}