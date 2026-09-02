import { Link } from 'react-router-dom'

/**
 * EntityHeader — compact, standardised identity header for entity workspaces.
 *
 * Answers §4 of the operating-console design principle in one strip:
 *   WHAT IS IT?      → typeLabel + title + identifier
 *   WHAT STATE?      → status + badges
 *   CONTEXT          → meta items + lastUpdated
 *   WHAT CAN I DO?   → actions (usually an <ActionRail variant="horizontal">)
 *
 * Deliberately compact: one row on desktop, wrapping on mobile. No oversized
 * hero headers — this is an operations console.
 *
 * Props:
 *   breadcrumbs [{ label, to? }]
 *   typeLabel   small uppercase entity type, e.g. "SERVICE"
 *   title       primary name, e.g. "Foobar Ltd" or "PPPoE · jdoe"
 *   identifier  secondary mono identifier, e.g. "#ACC-1042"
 *   status      { label, tone } — tone ∈ success|warning|danger|info|muted
 *   badges      [{ label, tone? }]
 *   meta        [{ label, value }] — rendered as inline key/value pairs
 *   lastUpdated string, e.g. "Updated 12s ago"
 *   actions     React node (typically ActionRail horizontal)
 *   nav         React node (typically RelationshipNav or tab strip)
 */
export default function EntityHeader({
  breadcrumbs = [],
  typeLabel,
  title,
  identifier,
  status,
  badges = [],
  meta = [],
  lastUpdated,
  actions,
  nav,
}) {
  return (
    <header className="pb-3 border-b" style={{ borderColor: 'var(--pb-border, #e2e8f0)' }}>
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-1.5 flex flex-wrap items-center gap-1 text-xs" style={{ color: 'var(--pb-text-3, #64748b)' }}>
          {breadcrumbs.map((bc, i) => (
            <span key={`${bc.label}-${i}`} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true">/</span>}
              {bc.to ? (
                <Link to={bc.to} className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded">
                  {bc.label}
                </Link>
              ) : (
                <span>{bc.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Identity + status */}
        <div className="min-w-0">
          {typeLabel && (
            <div className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--pb-text-3, #64748b)' }}>
              {typeLabel}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold truncate" style={{ color: 'var(--pb-text-1, #0f172a)' }}>{title}</h1>
            {identifier && (
              <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800" style={{ color: 'var(--pb-text-2, #475569)' }}>
                {identifier}
              </span>
            )}
            {status?.label && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${status.toneClass ?? ''}`}
                data-entity-status={status.label}
              >
                {status.label}
              </span>
            )}
            {badges.map((b, i) => (
              <span
                key={`${b.label}-${i}`}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${b.toneClass ?? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700'}`}
              >
                {b.label}
              </span>
            ))}
          </div>
          {meta.length > 0 && (
            <dl className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs" style={{ color: 'var(--pb-text-2, #475569)' }}>
              {meta.map((m, i) => (
                <div key={`${m.label}-${i}`} className="flex gap-1">
                  <dt className="font-medium" style={{ color: 'var(--pb-text-3, #64748b)' }}>{m.label}:</dt>
                  <dd>{m.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* Actions + freshness */}
        {(actions || lastUpdated) && (
          <div className="flex flex-col items-end gap-1 shrink-0">
            {actions}
            {lastUpdated && (
              <span className="text-[10px]" style={{ color: 'var(--pb-text-3, #64748b)' }}>{lastUpdated}</span>
            )}
          </div>
        )}
      </div>

      {nav && <div className="mt-3">{nav}</div>}
    </header>
  )
}
