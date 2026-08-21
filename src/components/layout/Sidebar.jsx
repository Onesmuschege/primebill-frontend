import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Users, Wifi, FileText, CreditCard,
  Ticket, MessageSquare, Router, Package, DollarSign,
  BarChart2, Settings, LogOut, Shield, Tag, Zap,
  TrendingUp, Gift, ScrollText, UserCog,
  ChevronDown, ChevronRight, X, Radio, Wrench, Activity, Cable, MapPin, Database,
     Network, AlertTriangle, Receipt, ShieldCheck, Banknote, Key,
     ArrowRightLeft, Bot, Workflow, PlayCircle, UserPlus, Target,
     LayoutList, KanbanSquare, RotateCcw, ArrowUpCircle,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Groups reorganised (Aug 2026) to fix three problems found once the sidebar
// grew past ~10 groups:
//   1. Money was split across "Billing" and "Analytics" (Finance/Commissions)
//      — now unified under one Billing & Finance group.
//   2. Inventory/Stock-PO/RMA were buried as 3-of-11 items inside Network
//      — now a standalone Inventory & Procurement group with room to grow.
//   3. "Plans" (ISP data plans) and "Plans & Pricing" (PrimeBill's own SaaS
//      tier) were near-duplicate labels in different groups — the PrimeBill
//      one is renamed "Upgrade Plan" under "My PrimeBill Account" so the two
//      are unambiguous at a glance.
// Automation and System default to collapsed (see `collapsed` initial state
// below) since they're config/power-user territory visited far less often
// than Dashboard/Clients/Billing.
// ---------------------------------------------------------------------------
const NAV = [
  {
    group: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    group: 'CRM',
    items: [
      { to: '/leads',     icon: UserPlus, label: 'Leads' },
      { to: '/prospects', icon: Target,   label: 'Prospects' },
    ],
  },
  {
    group: 'Subscribers',
    items: [
      { to: '/clients',  icon: Users, label: 'Clients' },
      { to: '/plans',    icon: Wifi,  label: 'Plans' },
      { to: '/vouchers', icon: Tag,   label: 'Vouchers' },
      { to: '/fup',      icon: Zap,   label: 'FUP' },
    ],
  },
  {
    group: 'Billing & Finance',
    items: [
      { to: '/invoices', icon: FileText,   label: 'Invoices' },
      { to: '/payments', icon: CreditCard, label: 'Payments' },
      { to: '/payment-allocations', icon: ArrowRightLeft, label: 'Allocations' },
      { to: '/collections', icon: Banknote, label: 'Collections' },
      { to: '/expenditures', icon: Receipt, label: 'Expenditures' },
      { to: '/finance',   icon: DollarSign, label: 'Finance' },
      { to: '/commissions', icon: Banknote, label: 'Commissions' },
    ],
  },
  {
    group: 'Support',
    items: [
      { to: '/tickets',       icon: Ticket,        label: 'Tickets' },
      { to: '/tickets/board', icon: KanbanSquare,  label: 'Ticket Board' },
      { to: '/sms',           icon: MessageSquare, label: 'SMS' },
    ],
  },
  {
group: 'Network',
    items: [
      { to: '/routers',   icon: Router,   label: 'Routers' },
      { to: '/radius',    icon: Radio,    label: 'RADIUS' },
      { to: '/ipam',      icon: Network,  label: 'IPAM' },
      { to: '/incidents', icon: AlertTriangle, label: 'Incidents' },
      { to: '/incidents/board', icon: KanbanSquare, label: 'Incident Board' },
      { to: '/noc',       icon: Activity, label: 'NOC' },
      { to: '/fiber/olts',icon: Cable,    label: 'Fiber / OLT' },
      { to: '/fiber/map', icon: MapPin,   label: 'Fiber Map' },
    ],
  },
  {
    group: 'Inventory & Procurement',
    items: [
      { to: '/inventory',            icon: Package,    label: 'Inventory' },
      { to: '/inventory/operations', icon: LayoutList, label: 'Stock & Purchase Orders' },
      { to: '/inventory/rma',        icon: RotateCcw,  label: 'RMA' },
    ],
  },
  {
    group: 'Field Operations',
    items: [
      { to: '/work-orders', icon: Wrench, label: 'Work Orders' },
      { to: '/work-orders/technicians', icon: Users, label: 'Technicians' },
    ],
  },
  {
    group: 'Reports & Analytics',
    items: [
      { to: '/reports',   icon: BarChart2,  label: 'Reports' },
      { to: '/analytics', icon: TrendingUp, label: 'Analytics' },
    ],
  },
  {
    group: 'Growth',
    items: [
      { to: '/loyalty', icon: Gift, label: 'Loyalty Points' },
      { to: '/referrals', icon: Gift, label: 'Referrals' },
    ],
  },
  {
    group: 'My PrimeBill Account',
    items: [
      { to: '/subscription/my',    icon: CreditCard,    label: 'My Subscription' },
      { to: '/subscription/plans', icon: ArrowUpCircle, label: 'Upgrade Plan' },
    ],
  },
  {
    group: 'Automation',
    items: [
      { to: '/automation', icon: Bot, label: 'Overview' },
      { to: '/automation/events', icon: Activity, label: 'Events' },
      { to: '/automation/jobs', icon: PlayCircle, label: 'Jobs' },
      { to: '/automation/failures', icon: AlertTriangle, label: 'Failures' },
      { to: '/automation/rules', icon: Workflow, label: 'Rules & Workflows' },
      { to: '/automation/history', icon: ScrollText, label: 'Execution History' },
    ],
  },
  {
    group: 'System',
    items: [
      { to: '/admin/users', icon: UserCog,    label: 'Admin Users' },
      { to: '/admin/roles', icon: Shield,     label: 'Roles & Permissions' },
      { to: '/logs',        icon: ScrollText, label: 'System Logs' },
      { to: '/settings',    icon: Settings,   label: 'Settings' },
      { to: '/security',    icon: ShieldCheck, label: 'Security Center' },
      { to: '/mfa',         icon: Key,        label: 'MFA' },
      { to: '/catalog',     icon: Database,   label: 'Catalog' },
    ],
  },
]

// Groups collapsed by default on first load — config/power-user territory,
// one click away, but shouldn't compete with Dashboard/Clients/Billing for
// the first screenful of the sidebar.
const DEFAULT_COLLAPSED = {
  Automation: true,
  System: true,
}

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(DEFAULT_COLLAPSED)

  const nav = NAV

  const toggleGroup = (group) =>
    setCollapsed(p => ({ ...p, [group]: !p[group] }))

  const handleLogout = () => { logout(); navigate('/login') }
  const handleNavClick = () => { if (onClose) onClose() }

  return (
    // Always fixed — AdminLayout compensates with lg:ml-64 on the content div.
    // Never use lg:static here; that pulls the sidebar into the flex flow and
    // the parent's overflow-hidden clips the bottom nav groups.
    <aside
      className={`
        fixed left-0 top-0 z-30 h-screen w-64 flex flex-col
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      style={{
        backgroundColor: 'var(--pb-sidebar-bg)',
        borderRight: '1px solid var(--pb-border)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* ── Brand ── */}
      <div
        className="flex items-center justify-between px-5 py-5 shrink-0"
        style={{ borderBottom: '1px solid var(--pb-border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg,#2563eb,#06b6d4)',
              boxShadow: 'var(--shadow-glow-primary)',
            }}
          >
            <Wifi size={18} className="text-white" />
          </div>
          <div>
            <h1
              className="font-bold text-base leading-none tracking-tight"
              style={{ color: 'var(--pb-text-1)' }}
            >
              PrimeBill
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--pb-sidebar-txt)' }}>
              ISP Management
            </p>
          </div>
        </div>

        {/* Mobile close button */}
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

      {/* ── Navigation — overflow-y-auto here, NOT on the parent ── */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {nav.map(({ group, items }) => (
          <div key={group} className="mb-1">
            <button
              onClick={() => toggleGroup(group)}
              className="w-full flex items-center justify-between px-3 py-1.5 mb-0.5 rounded-md transition-colors"
              style={{ color: 'var(--pb-text-3)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--pb-raised)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span className="text-xs font-semibold uppercase tracking-wider">
                {group}
              </span>
              {collapsed[group]
                ? <ChevronRight size={12} />
                : <ChevronDown size={12} />}
            </button>

            {!collapsed[group] && (
              <div className="space-y-0.5">
                {items.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={handleNavClick}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={16} className="shrink-0" />
                    <span className="text-sm">{label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* ── User profile + logout ── */}
      <div
        className="shrink-0 px-3 py-4"
        style={{ borderTop: '1px solid var(--pb-border)' }}
      >
        <div
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1"
          style={{
            background: 'rgba(37,99,235,0.06)',
            border: '1px solid rgba(37,99,235,0.1)',
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg,#2563eb,#06b6d4)' }}
          >
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold truncate leading-none"
              style={{ color: 'var(--pb-text-1)' }}
            >
              {user?.name}
            </p>
            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--pb-sidebar-txt)' }}>
              {user?.email}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="nav-link w-full mt-1"
          style={{ color: 'var(--pb-sidebar-txt)' }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#ef4444'
            e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.06)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--pb-sidebar-txt)'
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <LogOut size={15} />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}