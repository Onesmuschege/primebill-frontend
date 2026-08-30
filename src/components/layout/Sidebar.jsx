import { useState, Fragment } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import BRAND from '../../config/brand'
import {
  LayoutDashboard, Users, Wifi, FileText, CreditCard,
  Ticket, MessageSquare, Router, Package, DollarSign,
  BarChart2, Settings, LogOut, Shield, Tag, Zap,
  TrendingUp, Gift, ScrollText, UserCog,
  ChevronDown, ChevronRight, X, Radio, Wrench, Activity, Cable, MapPin, Database,
     Network, AlertTriangle, Receipt, ShieldCheck, Banknote, Key,
     ArrowRightLeft, Bot, Workflow, PlayCircle, UserPlus, Target,
     LayoutList, RotateCcw, ArrowUpCircle,
     Server, Bell, GitBranch, Gauge,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// PrimeBill ten-section operating-console IA (see PHASE0_DISCOVERY.md §3):
//
//   Overview | Subscribers | Plans & Usage | Billing & Finance | Network |
//   Support | Field Operations | Inventory & Procurement |
//   Reports & Analytics | System
//
// "Sales & CRM", "Subscribers & Accounts", "Reporting & Intelligence",
// "Growth & Retention" and "Licenses & Subscription" were collapsed into the
// canonical ten groups above. Vouchers -> Plans & Usage; Loyalty/Referrals ->
// Subscribers > Retention; Automation + My PrimeBill Account -> System.
// System defaults to collapsed (config/power-user territory); Network stays
// expanded because NOC/AAA work is a primary operator surface.
// ---------------------------------------------------------------------------
const NAV = [
  {
    group: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
    },
  {
    group: 'Subscribers',
    items: [
      { to: '/clients',   icon: Users,    label: 'Clients' },
      { to: '/leads',     icon: UserPlus, label: 'Leads' },
      { to: '/prospects', icon: Target,   label: 'Prospects' },
      {
        label: 'Retention',
        icon: Gift,
        children: [
          { to: '/loyalty',   icon: Gift, label: 'Loyalty Points' },
          { to: '/referrals', icon: Gift, label: 'Referrals' },
        ],
      },
    ],
  },
  {
    group: 'Plans & Usage',
    items: [
      { to: '/plans',    icon: Wifi, label: 'Plans & Tariffs' },
      { to: '/fup',      icon: Zap,  label: 'FUP Policies' },
      { to: '/vouchers', icon: Tag,  label: 'Vouchers' },
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
      { to: '/commissions', icon: Banknote, label: 'Commissions & Payouts' },
    ],
  },
  {
        group: 'Support',
    items: [
      { to: '/tickets',       icon: Ticket,        label: 'Tickets' },
      // /tickets/board is an internal view of the Tickets workflow (see AppRoutes).
      { to: '/sms',           icon: MessageSquare, label: 'SMS & Communications' },
    ],
  },
  {
        group: 'Network',
    items: [
      {
        // Access & AAA — routers, RADIUS, IPAM, Incidents. /fup moved to Plans & Usage.
        label: 'Access & AAA',
        icon: Network,
        children: [
          { to: '/routers',   icon: Router,        label: 'Routers' },
          { to: '/radius',    icon: Radio,         label: 'RADIUS' },
                    { to: '/ipam',      icon: Network,     label: 'IPAM' },
          { to: '/incidents', icon: AlertTriangle, label: 'Incidents' },
        ],
      },
      {
        // NOC & Monitoring — the Batch 1 NOC subgroup, renamed (Batch 4).
        // Children and routes are identical to Batch 1.
        label: 'NOC & Monitoring',
        icon: Activity,
        children: [
          { to: '/noc',         icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/noc/devices', icon: Server,          label: 'Devices' },
          { to: '/noc/alerts',  icon: Bell,            label: 'Alerts' },
          { to: '/noc/links',   icon: GitBranch,       label: 'Topology' },
        ],
      },
      {
        // Fiber & Access — V5 Batch 4 subgroup.
        label: 'Fiber & Access',
        icon: Cable,
        children: [
          { to: '/fiber/olts',     icon: Cable,  label: 'OLT / PON' },
          { to: '/fiber/capacity', icon: Gauge,  label: 'Fiber Capacity' },
          { to: '/fiber/map',      icon: MapPin, label: 'Fiber Map' },
        ],
      },
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
      { to: '/analytics', icon: TrendingUp, label: 'Analytics' },
      { to: '/reports',   icon: BarChart2,  label: 'Reports' },
    ],
  },
  {
    group: 'System',
    items: [
      {
        label: 'Users & Access',
        icon: UserCog,
        children: [
          { to: '/admin/users', icon: UserCog,    label: 'Admin Users' },
          { to: '/admin/roles', icon: Shield,     label: 'Roles & Permissions' },
        ],
      },
      { to: '/settings', icon: Settings,    label: 'Settings' },
      { to: '/catalog',  icon: Database,    label: 'Catalog' },
      { to: '/logs',     icon: ScrollText,  label: 'System Logs' },
      { to: '/security', icon: ShieldCheck, label: 'Security Center' },
      { to: '/mfa',      icon: Key,         label: 'MFA' },
      {
        label: 'Automation',
        icon: Bot,
        children: [
          { to: '/automation',          icon: Bot,            label: 'Overview' },
          { to: '/automation/events',   icon: Activity,       label: 'Events' },
          { to: '/automation/jobs',     icon: PlayCircle,     label: 'Jobs' },
          { to: '/automation/failures', icon: AlertTriangle,  label: 'Failures' },
          { to: '/automation/rules',    icon: Workflow,       label: 'Rules & Workflows' },
          { to: '/automation/history',  icon: ScrollText,     label: 'Execution History' },
        ],
      },
      {
        label: 'My PrimeBill Account',
        icon: CreditCard,
        children: [
          { to: '/subscription/my',    icon: CreditCard,    label: 'My Subscription' },
          { to: '/subscription/plans', icon: ArrowUpCircle, label: 'Upgrade Plan' },
        ],
      },
    ],
  },
]

// Groups collapsed by default on first load — config/power-user territory,
// one click away, but System is power-user surface that should not compete
// with the operational sections for the first screenful of the sidebar.
const DEFAULT_COLLAPSED = {
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

  // Renders a single navigation entry. Plain links ({ to, icon, label }) become
  // NavLinks; entries that carry a `children` array render as a collapsible
  // nested subgroup. Subgroups reuse the existing `collapsed`/`toggleGroup`
  // state so they behave (hover highlight, chevron, open/close) exactly like
  // top-level groups — the only difference is their keys are namespaced with
  // a "sg:" prefix so a subgroup and a group can never share a collapse slot.
  const renderNavItem = (item) => {
    // Icon is assigned a PascalCase name so the repo's `no-unused-vars`
    // `varsIgnorePattern: '^[A-Z_]'` treats it as used (a function-parameter
    // destructure would not be covered, since varsIgnorePattern only applies
    // to variable declarations). The `react/jsx-uses-vars` plugin rule is not
    // enabled, so JSX usage alone (<Icon />) is otherwise reported.
    const { to, label, icon: Icon, children } = item
    if (children && children.length) {
      const key = `sg:${label}`
      return (
        <div>
          <button
            onClick={() => toggleGroup(key)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-sm font-medium text-left"
            style={{ color: 'var(--pb-text-2)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--pb-raised)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Icon size={15} className="shrink-0" />
            <span className="flex-1">{label}</span>
            {collapsed[key] ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>
          {!collapsed[key] && (
            <div
              className="ml-3 pl-2 mt-0.5 space-y-0.5"
              style={{ borderLeft: '1px solid var(--pb-border)' }}
            >
              {children.map((child) => (
                <div key={child.to || child.label}>{renderNavItem(child)}</div>
              ))}
            </div>
          )}
        </div>
      )
    }

    return (
      <NavLink
        to={to}
        onClick={handleNavClick}
        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
      >
        <Icon size={16} className="shrink-0" />
        <span className="text-sm">{label}</span>
      </NavLink>
    )
  }

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
              {BRAND.brand}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--pb-sidebar-txt)' }}>
              ISP Platform
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
                {items.map((item) => (
                  <Fragment key={item.to || `sg:${item.label}`}>
                    {renderNavItem(item)}
                  </Fragment>
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