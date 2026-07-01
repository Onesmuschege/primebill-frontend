import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Wifi, FileText, CreditCard,
  Ticket, MessageSquare, Router, BarChart2, Settings,
  Package, DollarSign, ScrollText, LogOut, X, Zap, Gift,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'Subscribers',
    items: [
      { to: '/clients', icon: Users, label: 'Clients' },
      { to: '/plans',   icon: Wifi,  label: 'Plans' },
      { to: '/vouchers', icon: Gift, label: 'Vouchers' },
    ],
  },
  {
    label: 'Billing',
    items: [
      { to: '/invoices', icon: FileText,   label: 'Invoices' },
      { to: '/payments', icon: CreditCard, label: 'Payments' },
    ],
  },
  {
    label: 'Support',
    items: [
      { to: '/tickets', icon: Ticket,       label: 'Tickets' },
      { to: '/sms',     icon: MessageSquare, label: 'SMS' },
    ],
  },
  {
    label: 'Network',
    items: [
      { to: '/routers',   icon: Router,  label: 'Routers' },
      { to: '/plans/fup', icon: Zap,    label: 'FUP Management' },
      { to: '/inventory', icon: Package, label: 'Inventory' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { to: '/finance', icon: DollarSign, label: 'Finance' },
      { to: '/reports', icon: BarChart2,  label: 'Reports' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/logs',     icon: ScrollText, label: 'System Logs' },
      { to: '/settings', icon: Settings,   label: 'Settings' },
    ],
  },
]

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()

  return (
    <aside
      className={`
        fixed left-0 top-0 z-30 h-screen w-64 flex flex-col
        transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:z-auto
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}
      style={{
        backgroundColor: 'var(--pb-sidebar-bg)',
        borderRight: '1px solid var(--pb-border)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* ── Logo ── */}
      <div
        className="flex items-center justify-between px-5 py-5 shrink-0"
        style={{ borderBottom: '1px solid var(--pb-border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
              boxShadow: 'var(--shadow-glow-primary)',
            }}
          >
            <Wifi size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-none tracking-tight"
              style={{ color: 'var(--pb-text-1)' }}>
              PrimeBill
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--pb-sidebar-txt)' }}>
              ISP Management
            </p>
          </div>
        </div>

        {/* Mobile close */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--pb-sidebar-txt)' }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--pb-text-2)'
            e.currentTarget.style.backgroundColor = 'var(--pb-raised)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--pb-sidebar-txt)'
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {NAV_SECTIONS.map(({ label, items }) => (
          <div key={label}>
            <p
              className="px-3 mb-1.5 font-semibold uppercase tracking-widest"
              style={{ color: 'var(--pb-sidebar-txt)', fontSize: '0.65rem' }}
            >
              {label}
            </p>
            <div className="space-y-0.5">
              {items.map(({ to, icon: Icon, label: itemLabel }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} className="shrink-0" />
                  <span>{itemLabel}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User profile + logout ── */}
      <div
        className="shrink-0 px-3 py-4"
        style={{ borderTop: '1px solid var(--pb-border)' }}
      >
        <div
          className="flex items-center gap-3 px-3 py-3 rounded-xl mb-1"
          style={{
            background: 'rgba(37,99,235,0.06)',
            border: '1px solid rgba(37,99,235,0.1)',
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}
          >
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate leading-none"
              style={{ color: 'var(--pb-text-1)' }}>
              {user?.name}
            </p>
            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--pb-sidebar-txt)' }}>
              {user?.email}
            </p>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={logout}
          className="nav-link w-full mt-1"
          style={{ color: 'var(--pb-sidebar-txt)' }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--color-danger)'
            e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.06)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--pb-sidebar-txt)'
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
