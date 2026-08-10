import { useState, useRef, useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ImpersonationBanner from '../components/layout/ImpersonationBanner'
import {
  ChevronDown, ChevronRight, X, LogOut, Globe, LayoutDashboard,
  Building2, CreditCard, ScrollText, TrendingUp, Menu,
  ShieldCheck, Bell, Activity, Wrench, Lock,
} from 'lucide-react'

// Platform accent — purple is intentionally the PrimeBill Platform Console's
// dominant identity, visually distinct from the tenant app's blue/cyan shell.
const ACCENT = '#a78bfa'
const ACCENT_SOFT = 'rgba(167,139,250,0.14)'

const NAV = [
  {
    group: 'Platform',
    items: [
      { to: '/platform', icon: LayoutDashboard, label: 'Overview' },
    ],
  },
  {
    group: 'Tenants',
    items: [
      { to: '/platform/tenants', icon: Building2, label: 'All Tenants' },
      { to: '/platform/subscriptions', icon: CreditCard, label: 'Subscriptions' },
    ],
  },
  {
    group: 'Operations',
    items: [
      { to: '/platform/analytics', icon: TrendingUp, label: 'Analytics' },
      { to: '/platform/audit-log', icon: ScrollText, label: 'Audit Log' },
    ],
  },
  {
    group: 'Security & System',
    items: [
      { to: '/platform/security', icon: Lock, label: 'Security Center' },
      { to: '/platform/system', icon: Activity, label: 'System Health' },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────
// PlatformLayout — the Platform Console's own shell, distinct from AdminLayout.
// The shared ImpersonationBanner (imported above) renders here too, in case
// /platform is opened mid-impersonation. It primarily lives in the tenant
// AdminLayout where the platform admin lands during impersonation.
// ─────────────────────────────────────────────────────────────────────────
export default function PlatformLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState({})
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleGroup = (g) => setCollapsed(p => ({ ...p, [g]: !p[g] }))

  const handleLogout = async () => {
    setProfileOpen(false)
    await logout()
    navigate('/login')
  }

  const pageTitle = (() => {
    if (pathname === '/platform') return 'Platform Overview'
    if (pathname.startsWith('/platform/tenants')) return 'Tenants'
    if (pathname.startsWith('/platform/subscriptions')) return 'Subscriptions'
    if (pathname.startsWith('/platform/analytics')) return 'Platform Analytics'
    if (pathname.startsWith('/platform/audit-log')) return 'Audit Log'
    if (pathname.startsWith('/platform/security')) return 'Security Center'
    if (pathname.startsWith('/platform/system')) return 'System Health'
    return 'Platform Console'
  })()

  return (
    <div
      className="flex h-screen overflow-hidden theme-transition"
      style={{ backgroundColor: 'var(--pb-bg)' }}
    >
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-30 h-screen w-64 flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          backgroundColor: 'var(--pb-sidebar-bg)',
          borderRight: '1px solid var(--pb-border)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
        }}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5 shrink-0"
          style={{ borderBottom: '1px solid var(--pb-border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', boxShadow: '0 0 24px rgba(124,58,237,0.4)' }}
            >
              <Globe size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-none tracking-tight" style={{ color: 'var(--pb-text-1)' }}>
                PrimeBill
              </h1>
              <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: ACCENT }}>
                <ShieldCheck size={11} /> Platform Console
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--pb-sidebar-txt)' }}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* PLATFORM badge */}
        <div className="px-4 pt-4 shrink-0">
          <div
            className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2"
            style={{ background: ACCENT_SOFT, border: '1px solid rgba(167,139,250,0.3)', color: ACCENT }}
          >
            <Globe size={12} /> PLATFORM
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {NAV.map(({ group, items }) => (
            <div key={group} className="mb-1">
              <button
                onClick={() => toggleGroup(group)}
                className="w-full flex items-center justify-between px-3 py-1.5 mb-0.5 rounded-md transition-colors"
                style={{ color: 'var(--pb-text-3)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--pb-raised)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span className="text-xs font-semibold uppercase tracking-wider">{group}</span>
                {collapsed[group] ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              </button>
              {!collapsed[group] && (
                <div className="space-y-0.5">
                  {items.map(({ to, icon: Icon, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      style={{ color: 'var(--pb-sidebar-txt)' }}
                    >
                      <Icon size={16} className="shrink-0" style={{ color: ACCENT }} />
                      <span className="text-sm">{label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* New-scope notice */}
          <div
            className="mx-3 mt-4 p-3 rounded-xl text-xs leading-relaxed"
            style={{ background: ACCENT_SOFT, border: '1px dashed rgba(167,139,250,0.3)', color: 'var(--pb-text-2)' }}
          >
            <p className="font-semibold mb-1 flex items-center gap-1.5" style={{ color: ACCENT }}>
              <Wrench size={12} /> Platform Capabilities
            </p>
            Platform Users, Integrations, Reporting, Communications and advanced
            billing areas are flagged as <strong>new scope</strong> and not yet implemented.
          </div>
        </nav>

        {/* User + logout */}
        <div className="shrink-0 px-3 py-4" style={{ borderTop: '1px solid var(--pb-border)' }}>
          <div
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1"
            style={{ background: ACCENT_SOFT, border: '1px solid rgba(167,139,250,0.2)' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}
            >
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate leading-none" style={{ color: 'var(--pb-text-1)' }}>
                {user?.name}
              </p>
              <p className="text-xs truncate mt-0.5" style={{ color: 'var(--pb-text-3)' }}>
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

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Top bar */}
        <header
          className="shrink-0 flex items-center gap-4 px-4 lg:px-6"
          style={{
            backgroundColor: 'var(--pb-topnav-bg)',
            borderBottom: '1px solid var(--pb-border)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn-ghost p-2" aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-3 py-4 min-w-0">
            <h2 className="text-base font-semibold tracking-tight truncate" style={{ color: 'var(--pb-text-1)' }}>
              {pageTitle}
            </h2>
            <span
              className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-widest"
              style={{ background: ACCENT_SOFT, color: ACCENT, fontSize: '0.6rem' }}
            >
              Platform
            </span>
          </div>
          <div className="flex-1" />

          {/* Notification/status area */}
          <button className="btn-ghost p-2 rounded-lg relative" aria-label="Notifications" title="Status center (new scope)">
            <Bell size={18} style={{ color: 'var(--pb-text-2)' }} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-400 rounded-full ring-2" style={{ ringColor: 'var(--pb-topnav-bg)' }} />
          </button>

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--pb-text-1)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--pb-raised)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate" style={{ color: 'var(--pb-text-1)' }}>
                {user?.name}
              </span>
              <ChevronDown size={14} style={{ color: 'var(--pb-text-3)' }} className={`transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl py-1.5 z-50"
                style={{ backgroundColor: 'var(--pb-surface)', border: '1px solid var(--pb-border)', boxShadow: '0 16px 40px rgba(0,0,0,0.4)' }}>
                <div className="px-4 py-3 mb-1" style={{ borderBottom: '1px solid var(--pb-border)' }}>
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--pb-text-1)' }}>{user?.name}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--pb-text-3)' }}>{user?.email}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-2xs font-semibold" style={{ background: ACCENT_SOFT, color: ACCENT }}>
                    Platform Admin
                  </span>
                </div>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors" style={{ color: '#ef4444' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Impersonation banner */}
        <ImpersonationBanner />

        {/* Body */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

