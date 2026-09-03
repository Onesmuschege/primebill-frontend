import React, { useState, useRef, useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import ImpersonationBanner from '../components/layout/ImpersonationBanner'
import PlatformCommandPalette from '../components/platform/PlatformCommandPalette'
import PlatformNotifications from '../components/platform/PlatformNotifications'
import { usePlatformPalette } from '../hooks/usePlatformPalette'
import { getPlatformStats } from '../api/platform.api'
import { PLATFORM_NAV, platformPageTitle, platformBreadcrumbs } from '../utils/platformNav'
import BRAND from '../config/brand'
import {
  ChevronDown, ChevronRight, X, LogOut, Globe, Menu,
  ShieldCheck, Search, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'

// Platform accent — purple is intentionally the PrimeBill Platform Console's
// dominant identity, visually distinct from the tenant app's blue/cyan shell.
const ACCENT = '#a78bfa'
const ACCENT_SOFT = 'rgba(167,139,250,0.14)'

// Icon-rail collapse state persists across sessions (desktop only).
const RAIL_STORAGE_KEY = 'pb_platform_rail_collapsed'

// ─────────────────────────────────────────────────────────────────────────
// PlatformLayout — the Platform Console's own shell, distinct from AdminLayout.
// Phase 1 (IA + Shell): grouped IA navigation from utils/platformNav.js,
// collapsible desktop icon rail, Ctrl+K command palette with server-side
// tenant search, real-data notification bell, breadcrumbs. The shared
// ImpersonationBanner renders here too, in case /platform is opened mid-
// impersonation (it primarily lives in the tenant AdminLayout where the
// platform admin lands during impersonation).
// ─────────────────────────────────────────────────────────────────────────
export default function PlatformLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState({})
  const [railCollapsed, setRailCollapsed] = useState(
    () => localStorage.getItem(RAIL_STORAGE_KEY) === '1'
  )
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  // Platform command palette (Ctrl/Cmd+K) — navigation + tenant search.
  const palette = usePlatformPalette()

  // Notification bell shares the same stats query as the dashboard
  // (same query key → one poll, no duplicated fetch).
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => getPlatformStats(),
    refetchInterval: 60000,
    staleTime: 30000,
  })

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleGroup = (g) => setCollapsed(p => ({ ...p, [g]: !p[g] }))

  const toggleRail = () => {
    setRailCollapsed(prev => {
      const next = !prev
      localStorage.setItem(RAIL_STORAGE_KEY, next ? '1' : '0')
      return next
    })
  }

  const handleLogout = async () => {
    setProfileOpen(false)
    await logout()
    navigate('/login')
  }

  const pageTitle = platformPageTitle(pathname)
  const breadcrumbs = platformBreadcrumbs(pathname)

  // Keep the browser/page title consistent with the brand while navigating.
  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} · ${BRAND.display}` : BRAND.display
  }, [pageTitle])

  return (
    <div
      className="flex h-screen overflow-hidden theme-transition"
      style={{ backgroundColor: 'var(--pb-bg)' }}
    >
      {/* Sidebar — desktop: collapsible icon rail; mobile: slide-in drawer */}
      <aside
        className={`fixed left-0 top-0 z-30 h-screen flex flex-col transition-all duration-300 ease-in-out ${
          railCollapsed ? 'w-[68px]' : 'w-64'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{
          backgroundColor: 'var(--pb-sidebar-bg)',
          borderRight: '1px solid var(--pb-border)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
        }}
      >
        {/* Brand */}
        <div className={`flex items-center shrink-0 py-5 ${railCollapsed ? 'justify-center px-2' : 'justify-between px-5'}`}
          style={{ borderBottom: '1px solid var(--pb-border)' }}>
          <div className={`flex items-center gap-3 ${railCollapsed ? '' : ''}`}>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', boxShadow: '0 0 24px rgba(124,58,237,0.4)' }}
              title={railCollapsed ? `${BRAND.brand} — Platform Console` : undefined}
            >
              <Globe size={18} className="text-white" />
            </div>
            {!railCollapsed && (
              <div>
                <h1 className="font-bold text-base leading-none tracking-tight" style={{ color: 'var(--pb-text-1)' }}>
                  {BRAND.brand}
                </h1>
                <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: ACCENT }}>
                  <ShieldCheck size={11} /> Platform Console
                </p>
              </div>
            )}
          </div>
          {!railCollapsed && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--pb-sidebar-txt)' }}
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* PLATFORM badge — identity marker, hidden in rail mode (the Globe mark carries it) */}
        {!railCollapsed && (
          <div className="px-4 pt-4 shrink-0">
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2"
              style={{ background: ACCENT_SOFT, border: '1px solid rgba(167,139,250,0.3)', color: ACCENT }}
            >
              <Globe size={12} /> PLATFORM
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Platform navigation">
          {PLATFORM_NAV.map(({ group, items }) => (
            <div key={group} className="mb-1">
              {/* In rail mode the group header collapses to a divider rule */}
              {railCollapsed ? (
                <div className="mx-3 my-2 border-t" style={{ borderColor: 'var(--pb-border)' }} role="presentation" />
              ) : (
                <button
                  onClick={() => toggleGroup(group)}
                  className="w-full flex items-center justify-between px-3 py-1.5 mb-0.5 rounded-md transition-colors"
                  style={{ color: 'var(--pb-text-3)' }}
                  aria-expanded={!collapsed[group]}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--pb-raised)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider">{group}</span>
                  {collapsed[group] ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                </button>
              )}
              {!collapsed[group] && (
                <div className="space-y-0.5">
                  {items.map(({ to, label, icon }) => {
                    // icon rendered via createElement so ESLint's no-unused-vars
                    // tracks the destructured usage (it misses JSX tags nested
                    // inside NavLink's render-prop children).
                    const iconEl = React.createElement(icon, { size: 16, className: 'shrink-0', style: { color: ACCENT } })
                    return (
                      <NavLink
                        key={to}
                        to={to}
                        end={to === '/platform'}
                        onClick={() => setSidebarOpen(false)}
                        title={railCollapsed ? label : undefined}
                        aria-label={railCollapsed ? label : undefined}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''} ${railCollapsed ? 'justify-center' : ''}`}
                        style={{ color: 'var(--pb-sidebar-txt)' }}
                      >
                        {iconEl}
                        {!railCollapsed && <span className="text-sm">{label}</span>}
                      </NavLink>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User + rail toggle + logout */}
        <div className="shrink-0 px-3 py-4" style={{ borderTop: '1px solid var(--pb-border)' }}>
          {!railCollapsed && (
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
          )}
          <button
            onClick={toggleRail}
            className="nav-link w-full hidden lg:flex"
            style={{ color: 'var(--pb-sidebar-txt)' }}
            aria-label={railCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={railCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {railCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
            {!railCollapsed && <span className="text-sm">Collapse</span>}
          </button>
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
            aria-label="Sign out"
          >
            <LogOut size={15} />
            {!railCollapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main column — margin follows the sidebar width (rail-aware) */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${railCollapsed ? 'lg:ml-[68px]' : 'lg:ml-64'}`}>
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
            <div className="min-w-0">
              <div className="flex items-center gap-2">
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
              {/* Breadcrumbs — persistent context while navigating */}
              <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1.5 mt-0.5 text-xs" style={{ color: 'var(--pb-text-3)' }}>
                {breadcrumbs.map((crumb, i) => (
                  <span key={crumb.label} className="flex items-center gap-1.5">
                    {i > 0 && <span aria-hidden="true">/</span>}
                    {crumb.href ? (
                      <button
                        onClick={() => navigate(crumb.href)}
                        className="hover:underline"
                        style={{ color: 'var(--pb-text-3)' }}
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span aria-current="page" style={{ color: 'var(--pb-text-2)' }}>{crumb.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            </div>
          </div>
          <div className="flex-1" />

          {/* Global search / command palette trigger (also Ctrl+K) */}
          <button
            onClick={palette.open}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors"
            style={{ backgroundColor: 'var(--pb-raised)', border: '1px solid var(--pb-border)', color: 'var(--pb-text-3)' }}
            aria-label="Open command palette (Ctrl+K)"
          >
            <Search size={14} />
            <span>Search…</span>
            <kbd className="text-2xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--pb-surface)', border: '1px solid var(--pb-border)' }}>Ctrl K</kbd>
          </button>
          <button onClick={palette.open} className="sm:hidden btn-ghost p-2 rounded-lg" aria-label="Search">
            <Search size={18} style={{ color: 'var(--pb-text-2)' }} />
          </button>

          {/* Notifications — real platform conditions from /platform/stats */}
          <PlatformNotifications stats={statsData} loading={statsLoading} />

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

      {/* Command palette (Ctrl/Cmd+K) */}
      <PlatformCommandPalette
        isOpen={palette.isOpen}
        close={palette.close}
        query={palette.query}
        setQuery={palette.setQuery}
        filteredCommands={palette.filteredCommands}
        execute={palette.execute}
      />
    </div>
  )
}

