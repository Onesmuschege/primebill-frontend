import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, AlertOctagon, AlertTriangle, Info } from 'lucide-react'
import { derivePlatformNotifications } from '../../utils/platformNav'

const TIER_META = {
  action: { icon: AlertOctagon, color: '#f87171', label: 'Action required' },
  alert: { icon: AlertTriangle, color: '#fbbf24', label: 'Alerts' },
  info: { icon: Info, color: '#60a5fa', label: 'Information' },
}

/**
 * Platform notification bell — wired to the real /platform/stats payload
 * (already polled by the dashboard/system pages, so no extra polling here).
 * Conditions are derived purely from backend-reported state
 * (utils/platformNav.js::derivePlatformNotifications); nothing is invented.
 *
 * props:
 *   stats    — the platform stats payload (may be null while loading)
 *   loading  — stats request in flight
 */
export default function PlatformNotifications({ stats, loading = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  const items = derivePlatformNotifications(stats)
  const actionCount = items.filter((i) => i.tier === 'action').length
  const alertCount = items.filter((i) => i.tier === 'alert').length
  const badgeCount = actionCount + alertCount

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const grouped = ['action', 'alert', 'info']
    .map((tier) => ({ tier, items: items.filter((i) => i.tier === tier) }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${badgeCount ? ` (${badgeCount} unread)` : ''}`}
        aria-expanded={open}
        className="btn-ghost p-2 rounded-lg relative"
      >
        <Bell size={18} style={{ color: 'var(--pb-text-2)' }} />
        {badgeCount > 0 && (
          <span
            data-testid="platform-notification-badge"
            className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
            style={{ backgroundColor: actionCount > 0 ? '#ef4444' : '#f59e0b' }}
          >
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          data-testid="platform-notification-panel"
          className="absolute right-0 top-full mt-2 w-80 rounded-xl z-50 overflow-hidden"
          style={{ backgroundColor: 'var(--pb-surface)', border: '1px solid var(--pb-border)', boxShadow: '0 16px 40px rgba(0,0,0,0.4)' }}
        >
          <div className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest" style={{ borderBottom: '1px solid var(--pb-border)', color: 'var(--pb-text-2)' }}>
            Platform Notifications
          </div>

          {loading && items.length === 0 && (
            <div className="px-4 py-6 text-sm" style={{ color: 'var(--pb-text-3)' }}>Loading…</div>
          )}

          {!loading && items.length === 0 && (
            <div className="px-4 py-6 text-sm" style={{ color: 'var(--pb-text-3)' }}>
              All clear — no overdue invoices, suspended tenants or degraded services.
            </div>
          )}

          {grouped.map(({ tier, items: tierItems }) => {
            const meta = TIER_META[tier]
            const Icon = meta.icon
            return (
              <div key={tier}>
                <div className="px-4 pt-2.5 pb-1 text-2xs font-bold uppercase tracking-widest" style={{ color: meta.color }}>
                  {meta.label}
                </div>
                {tierItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setOpen(false); navigate(item.href) }}
                    className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-white/5"
                  >
                    <Icon size={15} className="mt-0.5 shrink-0" style={{ color: meta.color }} />
                    <span>
                      <span className="block text-sm font-medium" style={{ color: 'var(--pb-text-1)' }}>{item.title}</span>
                      <span className="block text-xs mt-0.5" style={{ color: 'var(--pb-text-3)' }}>{item.detail}</span>
                    </span>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
