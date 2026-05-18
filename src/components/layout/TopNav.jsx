import { useState, useRef, useEffect } from 'react'
import { Bell, Search, Sun, Moon, Menu, ChevronDown, User, KeyRound, LogOut, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

export default function TopNav({ title, onMenuClick }) {
  const { user, logout }     = useAuth()
  const { theme, toggle }    = useTheme()
  const navigate             = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef           = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    setProfileOpen(false)
    await logout()
    navigate('/login')
  }

  return (
    <header
      className="shrink-0 h-16 flex items-center gap-4 px-4 lg:px-6 theme-transition"
      style={{
        backgroundColor: 'var(--pb-topnav-bg)',
        borderBottom: '1px solid var(--pb-border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden btn-ghost p-2"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <h2 className="text-base font-semibold tracking-tight truncate"
        style={{ color: 'var(--pb-text-1)' }}>
        {title}
      </h2>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="hidden md:flex relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--pb-text-3)' }} />
        <input
          type="text"
          placeholder="Quick search..."
          className="pl-8 pr-4 py-1.5 text-sm rounded-lg w-52 focus:w-64 transition-all duration-200 focus:outline-none"
          style={{
            backgroundColor: 'var(--pb-raised)',
            border: '1px solid var(--pb-border)',
            color: 'var(--pb-text-1)',
          }}
          onFocus={e => e.target.style.borderColor = '#2563eb'}
          onBlur={e => e.target.style.borderColor = 'var(--pb-border)'}
        />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="btn-ghost p-2 rounded-lg relative"
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        <div className="relative w-5 h-5">
          {theme === 'dark' ? (
            <Sun size={18} style={{ color: '#f59e0b' }} />
          ) : (
            <Moon size={18} style={{ color: '#6366f1' }} />
          )}
        </div>
      </button>

      {/* Notifications */}
      <button className="btn-ghost p-2 rounded-lg relative" aria-label="Notifications">
        <Bell size={18} style={{ color: 'var(--pb-text-2)' }} />
        {/* Dot indicator */}
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2"
          style={{ ringColor: 'var(--pb-topnav-bg)' }}
        />
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
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate"
            style={{ color: 'var(--pb-text-1)' }}>
            {user?.name}
          </span>
          <ChevronDown size={14} style={{ color: 'var(--pb-text-3)' }}
            className={`transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown */}
        {profileOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-56 rounded-xl py-1.5 z-50"
            style={{
              backgroundColor: 'var(--pb-surface)',
              border: '1px solid var(--pb-border)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
            }}
          >
            {/* User info */}
            <div className="px-4 py-3 mb-1" style={{ borderBottom: '1px solid var(--pb-border)' }}>
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--pb-text-1)' }}>{user?.name}</p>
              <p className="text-xs truncate mt-0.5" style={{ color: 'var(--pb-text-3)' }}>{user?.email}</p>
              {user?.roles?.[0] && (
                <span className="inline-block mt-1.5 text-2xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(37,99,235,0.15)', color: '#60a5fa', fontSize: '0.65rem' }}>
                  {user.roles[0].replace('_', ' ')}
                </span>
              )}
            </div>

            {/* Menu items */}
            {[
              { icon: User, label: 'Profile', action: () => { setProfileOpen(false) } },
              { icon: KeyRound, label: 'Change Password', action: () => { navigate('/settings'); setProfileOpen(false) } },
              { icon: Settings, label: 'Settings', action: () => { navigate('/settings'); setProfileOpen(false) } },
            ].map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                onClick={action}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                style={{ color: 'var(--pb-text-2)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'var(--pb-raised)'
                  e.currentTarget.style.color = 'var(--pb-text-1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--pb-text-2)'
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}

            <div className="my-1" style={{ borderTop: '1px solid var(--pb-border)' }} />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
              style={{ color: '#ef4444' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}