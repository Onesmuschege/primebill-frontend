import { useState } from 'react'
import StatusBadge from '../common/StatusBadge'
import Checkbox from '../common/Checkbox'
import { timeAgo } from '../../utils/formatDate'
import { AlertTriangle, Clock, User, Tag, Wifi, FileText, CreditCard } from 'lucide-react'

const PRIORITY_TONES = {
  critical: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'muted',
}

const SOURCE_ICON = {
  ticket: FileText,
  invoice: CreditCard,
  payment: CreditCard,
  provisioning: Wifi,
  work_order: User,
  inventory: Tag,
  network: Wifi,
  default: AlertTriangle,
}

function WorkQueueItem({ item, selected, onToggle, onAction }) {
  const Icon = SOURCE_ICON[item.source] || SOURCE_ICON.default
  const tone = PRIORITY_TONES[item.priority] || 'muted'

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--pb-border)' }}>
      <Checkbox checked={selected} onChange={() => onToggle(item.id)} />
      <div className="p-1.5 rounded-md" style={{ background: 'rgba(99,102,241,0.1)' }}>
        <Icon size={14} style={{ color: '#818cf8' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate" style={{ color: 'var(--pb-text-1)' }}>{item.title}</span>
          <StatusBadge status={item.status} />
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs" style={{ color: 'var(--pb-text-3)' }}>
          <span className="flex items-center gap-1"><Clock size={11} />{timeAgo(item.createdAt)}</span>
          {item.owner && <span className="flex items-center gap-1"><User size={11} />{item.owner}</span>}
          {item.source && <span className="capitalize">{item.source.replace('_', ' ')}</span>}
        </div>
        {item.detail && (
          <p className="mt-1 text-xs truncate" title={item.detail} style={{ color: 'var(--pb-text-3)' }}>
            {item.detail}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
          style={{ background: `rgba(var(--pb-tone-${tone}),0.15)`, color: `rgb(var(--pb-tone-${tone}))` }}>
          {item.priority || 'normal'}
        </span>
        {item.onAction && (
          <button onClick={() => onAction(item)} className="text-xs px-2 py-1 rounded-md font-medium"
            style={{ background: 'var(--pb-raised)', color: 'var(--pb-text-2)' }}>
            {item.actionLabel || 'View'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function WorkQueue({
  items = [],
  loading = false,
  error = null,
  onRetry,
  onAction,
  emptyTitle = 'No work requiring attention',
  emptyDescription = 'All clear — nothing needs action right now.',
  selectable = true,
}) {
  const [selected, setSelected] = useState(new Set())

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected((prev) => (prev.size === items.length ? new Set() : new Set(items.map((i) => i.id))))
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="skeleton" style={{ width: 16, height: 16, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 6 }} />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton" style={{ width: '40%', height: 12 }} />
              <div className="skeleton" style={{ width: '25%', height: 10 }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>Failed to load work queue.</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-2 text-xs underline" style={{ color: '#818cf8' }}>Retry</button>
        )}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle size={28} className="mx-auto mb-2" style={{ color: 'var(--pb-text-3)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--pb-text-2)' }}>{emptyTitle}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--pb-text-3)' }}>{emptyDescription}</p>
      </div>
    )
  }

  return (
    <div>
      {selectable && items.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 border-b text-xs" style={{ borderColor: 'var(--pb-border)', color: 'var(--pb-text-3)' }}>
          <Checkbox
            checked={selected.size === items.length && items.length > 0}
            onChange={toggleAll}
            label={selected.size > 0 ? `${selected.size} selected` : 'Select all'}
          />
        </div>
      )}
      <div className="divide-y" style={{ borderColor: 'var(--pb-border)' }}>
        {items.map((item) => (
          <WorkQueueItem
            key={item.id}
            item={item}
            selected={selected.has(item.id)}
            onToggle={toggle}
            onAction={onAction}
          />
        ))}
      </div>
    </div>
  )
}
