import { useState } from 'react'
import { timeAgo } from '../../utils/formatDate'
import {
  Bell, AlertTriangle, Info, Settings, CheckCircle,
  ChevronDown, ChevronRight, X,
} from 'lucide-react'

const CATEGORY_CONFIG = {
  actionRequired: { label: 'Action Required', icon: AlertTriangle, tone: 'danger' },
  alert: { label: 'Alerts', icon: Bell, tone: 'warning' },
  info: { label: 'Information', icon: Info, tone: 'info' },
  system: { label: 'System', icon: Settings, tone: 'muted' },
}

const TONE_COLORS = {
  danger: { fg: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  warning: { fg: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  info: { fg: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  muted: { fg: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
}

function NotificationItem({ item, onAction }) {
  const config = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.info
  const tone = TONE_COLORS[config.tone] || TONE_COLORS.info
  const Icon = config.icon
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--pb-raised)' }}>
      <div className="p-1.5 rounded" style={{ background: tone.bg }}>
        <Icon size={14} style={{ color: tone.fg }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--pb-text-1)' }}>{item.title}</p>
        {item.description && <p className="text-xs mt-0.5" style={{ color: 'var(--pb-text-3)' }}>{item.description}</p>}
        <p className="text-xs mt-1" style={{ color: 'var(--pb-text-3)' }}>{timeAgo(item.createdAt)}</p>
      </div>
      {onAction && (
        <button onClick={() => onAction(item)} className="text-xs px-2 py-1 rounded shrink-0" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>View</button>
      )}
    </div>
  )
}

function CategorySection({ category, items, defaultOpen, onAction }) {
  const [open, setOpen] = useState(defaultOpen)
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.info
  const Icon = config.icon
  if (items.length === 0) return null
  return (
    <div className="border-b last:border-b-0" style={{ borderColor: 'var(--pb-border)' }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-4 py-3 text-left transition-colors">
        <Icon size={15} style={{ color: TONE_COLORS[config.tone]?.fg }} />
        <span className="text-sm font-medium flex-1" style={{ color: 'var(--pb-text-1)' }}>{config.label}</span>
        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>{items.length}</span>
        {open ? <ChevronDown size={14} style={{ color: 'var(--pb-text-3)' }} /> : <ChevronRight size={14} style={{ color: 'var(--pb-text-3)' }} />}
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2">
          {items.map((item) => (<NotificationItem key={item.id} item={item} onAction={onAction} />))}
        </div>
      )}
    </div>
  )
}

export default function NotificationCenter({
  notifications = [],
  counts = {},
  loading = false,
  onClose,
  onAction,
  onRefresh,
}) {
  const grouped = {
    actionRequired: notifications.filter((n) => n.category === 'ticket' || n.category === 'invoice' || n.category === 'payment'),
    alert: notifications.filter((n) => n.category === 'alert'),
    info: notifications.filter((n) => n.category === 'info'),
    system: notifications.filter((n) => n.category === 'system'),
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--pb-border)' }}>
        <div className="flex items-center gap-2">
          <Bell size={16} style={{ color: '#818cf8' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--pb-text-1)' }}>Notifications</h3>
          {counts.total > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>{counts.total}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && <button onClick={onRefresh} className="text-xs" style={{ color: '#818cf8' }}>Refresh</button>}
          {onClose && <button onClick={onClose} className="p-1 rounded"><X size={14} style={{ color: 'var(--pb-text-3)' }} /></button>}
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center"><p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>Loading…</p></div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle size={28} className="mx-auto mb-2" style={{ color: '#34d399' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--pb-text-2)' }}>All caught up!</p>
            <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>No notifications require your attention.</p>
          </div>
        ) : (
          <div>
            <CategorySection category="actionRequired" items={grouped.actionRequired} defaultOpen={true} onAction={onAction} />
            <CategorySection category="alert" items={grouped.alert} defaultOpen={true} onAction={onAction} />
            <CategorySection category="info" items={grouped.info} defaultOpen={false} onAction={onAction} />
            <CategorySection category="system" items={grouped.system} defaultOpen={false} onAction={onAction} />
          </div>
        )}
      </div>
    </div>
  )
}
