import { useMemo } from 'react'
import { History } from 'lucide-react'
import ErrorState from '../common/ErrorState'
import EmptyState from '../common/EmptyState'
import { STATUS_TONES } from '../../utils/statusMeta'

/**
 * OperationalTimeline — unified chronological event feed (§7 master prompt).
 *
 * BOUNDED by design: renders at most `maxItems` most-recent events so detail
 * views never render unbounded feeds. Events are caller-supplied from real
 * backend history sources (RadiusControlLog, NetworkEvent, payments, tickets…)
 * — this component never manufactures entries.
 *
 * Props:
 *   events        [{ id, timestamp, title, description?, actor?, tone?, meta? }]
 *                 tone ∈ success|warning|danger|info|muted (default muted)
 *   isLoading     render skeleton pulse rows
 *   error         Error instance / truthy → ErrorState with retry
 *   onRetry       retry callback (enables the retry button)
 *   emptyTitle / emptyDescription
 *   maxItems      default 25
 *   dense         tighter row spacing for side-panel usage
 */
export default function OperationalTimeline({
  events = [],
  isLoading = false,
  error = null,
  onRetry,
  emptyTitle = 'No activity yet',
  emptyDescription = 'Events will appear here as they occur.',
  maxItems = 25,
  dense = false,
}) {
  const visible = useMemo(() => events.slice(0, maxItems), [events, maxItems])

  if (isLoading) {
    return (
      <div className={`space-y-${dense ? '2' : '3'}`} aria-busy="true" aria-label="Loading activity">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return <ErrorState title="Could not load activity" message={error.message} onRetry={onRetry} />
  }

  if (!visible.length) {
    return <EmptyState icon={History} title={emptyTitle} description={emptyDescription} />
  }

  return (
    <ol className={`relative ${dense ? 'space-y-2.5' : 'space-y-4'}`} aria-label="Activity timeline">
      {visible.map((event) => {
        const tone = STATUS_TONES[event.tone] ?? STATUS_TONES.muted
        return (
          <li key={event.id ?? `${event.timestamp}-${event.title}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border ${tone.badge}`}
                aria-hidden="true"
              />
              <span
                className="w-px flex-1"
                style={{ backgroundColor: 'var(--pb-border, #e2e8f0)' }}
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0 pb-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-xs font-mono" style={{ color: 'var(--pb-text-3, #64748b)' }}>
                  {event.timestamp}
                </span>
                {event.actor && (
                  <span className="text-xs" style={{ color: 'var(--pb-text-3, #64748b)' }}>
                    · {event.actor}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium leading-snug" style={{ color: 'var(--pb-text-1, #0f172a)' }}>
                {event.title}
              </p>
              {event.description && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--pb-text-2, #475569)' }}>
                  {event.description}
                </p>
              )}
              {event.meta && (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {Object.entries(event.meta).map(([k, v]) => (
                    <span
                      key={k}
                      className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono dark:bg-slate-800"
                      style={{ color: 'var(--pb-text-2, #475569)' }}
                    >
                      {k}: {String(v)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </li>
        )
      })}
      {events.length > maxItems && (
        <li className="pl-6 text-xs" style={{ color: 'var(--pb-text-3, #64748b)' }}>
          Showing {maxItems} of {events.length} events
        </li>
      )}
    </ol>
  )
}
