import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Wifi, FileText, CreditCard,
  Ticket, MessageSquare, Router, BarChart2, Settings,
  Package, DollarSign, ScrollText, LogOut, Radio
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients',      icon: Users,           label: 'Clients' },
  { to: '/plans',        icon: Wifi,            label: 'Plans' },
  { to: '/invoices',     icon: FileText,        label: 'Invoices' },
  { to: '/payments',     icon: CreditCard,      label: 'Payments' },
  { to: '/tickets',      icon: Ticket,          label: 'Tickets' },
  { to: '/sms',          icon: MessageSquare,   label: 'SMS' },
  { to: '/routers',      icon: Router,          label: 'Routers' },
  { to: '/radius',       icon: Radio,           label: 'RADIUS' },
  { to: '/inventory',    icon: Package,         label: 'Inventory' },
  { to: '/finance',      icon: DollarSign,      label: 'Finance' },
  { to: '/reports',      icon: BarChart2,       label: 'Reports' },
  { to: '/logs',         icon: ScrollText,      label: 'System Logs' },
  { to: '/settings',     icon: Settings,        label: 'Settings' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <Wifi size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">PrimeBill</h1>
            <p className="text-xs text-gray-400">ISP Billing</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-sm font-bold">
            {user?.name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm w-full px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  )
}