import { Link } from 'react-router-dom'
import { Timer, AlertTriangle, Gauge, ServerCrash, ShieldAlert, PlugZap, Siren, ArrowUpRight } from 'lucide-react'
import { formatKES } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'
import { queueHref } from '../../utils/platformOverview'

/**
 * Layer-6 Operational Queues (§8) — the exact conditions that require an
 * operator's attention, every one deep-linked to its operational view.
 *
 * Only REAL backend-derived queues render with counts. Queues marked
 * available:false (no platform-wide data exists yet — e.g. failed
 * integrations) render an honest "backend gap" state, never a fake count.
 */
const QUEUE_META = {
  expiring_trials: { icon: Timer, color: '#fbbf24',  bg: 'rgba(245,158,11,0.08)' },
  overdue_accounts: { icon: AlertTriangle, color: '#f87171', bg: 'rgba(239,68,68,0.08)' },
  near_limit: { icon: Gauge, color: '#a78bfa', bg: 'rgba(139,92,246,0.08)' },
  failed_jobs: { icon: ServerCrash, color: '#fb923c', bg: 'rgba(251,146,60,0.08)' },
  security_events: { icon: ShieldAlert, color: '#f87171', bg: 'rgba(239,68,68,0.08)' },
  failed_integrations: { icon: PlugZap, color: '#60a5fa', bg: 'rgba(37,99,235,0.08)' },
  incidents: { icon: Siren, color: '#f87171', bg: 'rgba(239,68,68,0.08)' },
}

function QueueItemText({ queueKey, item }) {
  if (queueKey === 'expiring_trials') {
    const d = item.days_left ?? 0
    return (
      <span style={{ color: d < 0 ? '#f87171' : 'var(--pb-text-2)' }}>
        {item.name}{' '}
        <span className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
          · {d < 0 ? `expired ${Math.abs(d)}d ago` : `ends in ${d}d`}
        </span>
      </span>
    )
  }
  if (queueKey === 'overdue_accounts') {
    return (
      <span style={{ color: 'var(--pb-text-2)' }}>
        {item.name}{' '}
        <span className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
          · {item.invoice_count} inv · {formatKES(item.total)}
        </span>
      </span>
    )
  }
  if (queueKey === 'near_limit') {
    return (
      <span style={{ color: 'var(--pb-text-2)' }}>
        {item.name}{' '}
        <span className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
          · {item.metric} {item.ratio}%
        </span>
      </span>
    )
  }
  if (queueKey === 'security_events') {
    return (
      <span style={{ color: 'var(--pb-text-2)' }}>
        <span className="font-mono text-xs">{item.action}</span>{' '}
        <span className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
          · {formatDateTime(item.created_at)}
        </span>
      </span>
    )
  }
  return <span style={{ color: 'var(--pb-text-2)' }}>{JSON.stringify(item)}</span>
}

/**
 * Layer-6 operational queues panel for the Platform Overview.
 *
 * @param {object} queues — data.ops_queues from GET /platform/stats
 */
export default function PlatformOpsQueues({ queues = {} }) {
  const entries = Object.entries(queues)

  if (!entries.length) {
    return (
      <div className="rounded-xl p-5 text-sm" style={{ background: 'var(--pb-card)', border: '1px solid var(--pb-border)', color: 'var(--pb-text-3)' }}>
        Operational queues unavailable.
      </div>
    )
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--pb-card)', border: '1px solid var(--pb-border)' }}
      aria-label="Operational queues requiring attention"
    >
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--pb-border)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--pb-text-1)' }}>
          Requires attention
        </h3>
        <span className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
          live operational queues
        </span>
      </div>

      <ul role="list" className="divide-y" style={{ borderColor: 'var(--pb-border)' }}>
        {entries.map(([key, queue]) => {
          const meta = QUEUE_META[key] ?? { icon: AlertTriangle, color: 'var(--pb-text-3)', bg: 'transparent' }
          const Icon = meta.icon
          const href = queueHref(key)
          const gap = queue.available === false

          return (
            <li key={key} className="px-4 py-3 flex items-start gap-3">
              <span
                className="mt-0.5 shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: meta.bg }}
                aria-hidden="true"
              >
                <Icon size={15} style={{ color: meta.color }} />
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--pb-text-1)' }}>
                    {queue.label}
                  </span>
                  {gap ? (
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--pb-raised)', color: 'var(--pb-text-3)' }}
                      title="No platform-wide data source yet — see BACKEND_GAPS.md"
                    >
                      backend gap
                    </span>
                  ) : (
                    <span
                      className="text-sm font-semibold tabular-nums"
                      style={{ color: queue.count > 0 ? meta.color : 'var(--pb-text-3)' }}
                    >
                      {queue.count}
                    </span>
                  )}
                </div>

                {gap ? (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--pb-text-3)' }}>
                    No platform-wide view yet (tenant-scoped today).
                  </p>
                ) : queue.count > 0 && queue.items?.length > 0 ? (
                  <ul role="list" className="mt-1 space-y-0.5">
                    {queue.items.slice(0, 3).map((item, i) => (
                      <li key={item.tenant_id ?? item.id ?? i} className="text-xs truncate">
                        <QueueItemText queueKey={key} item={item} />
                      </li>
                    ))}
                  </ul>
                ) : queue.count === 0 ? (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--pb-text-3)' }}>
                    Clear.
                  </p>
                ) : null}
              </div>

              {href && (
                <Link
                  to={href}
                  className="shrink-0 text-xs font-medium flex items-center gap-0.5 mt-1 hover:underline"
                  style={{ color: meta.color }}
                >
                  View all <ArrowUpRight size={11} />
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
