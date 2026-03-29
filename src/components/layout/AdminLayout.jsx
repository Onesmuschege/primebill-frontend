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
  '/radius':    'RADIUS',
  '/inventory': 'Inventory',
  '/finance':   'Finance',
  '/reports':   'Reports',
  '/logs':      'System Logs',
  '/settings':  'Settings',
}

export default function AdminLayout() {
  const { pathname } = useLocation()
  const title = pageTitles[pathname] || 'PrimeBill'

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <TopNav title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}