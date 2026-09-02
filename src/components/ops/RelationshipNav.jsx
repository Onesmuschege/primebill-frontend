import { Link } from 'react-router-dom'

/**
 * RelationshipNav — reusable cross-entity navigation pattern (§8 master prompt).
 * Lets an operator move Customer → Service → Billing → Network → Support …
 * without losing context. Renders compact "chips" with optional counts.
 *
 * Props:
 *   groups  [{
 *     title   e.g. "Billing"
 *     items   [{ label, to?, onClick?, count?, tone? }]
 *   }]
 *   compact hide group titles (default false)
 */
export default function RelationshipNav({ groups = [], compact = false }) {
  if (!groups.length) return null

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {groups.map((group) => (
        <div key={group.title}>
          {!compact && (
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--pb-text-3, #64748b)' }}>
              {group.title}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {group.items.map((item) => {
              const inner = (
                <>
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count !== null && (
                    <span
                      className="ml-1 inline-flex min-w-[1.25rem] justify-center rounded-full bg-slate-200/80 px-1.5 text-[10px] font-semibold dark:bg-slate-700"
                      style={{ color: 'var(--pb-text-2, #475569)' }}
                      aria-label={`${item.count} ${item.label}`}
                    >
                      {item.count}
                    </span>
                  )}
                </>
              )
              const cls =
                'inline-flex items-center gap-0.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-sky-300 hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700'
              return item.to ? (
                <Link key={item.label} to={item.to} className={cls}>
                  {inner}
                </Link>
              ) : (
                <button key={item.label} type="button" onClick={item.onClick} className={cls}>
                  {inner}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
