import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import Spinner from '../common/Spinner'

const mutedText = { color: 'var(--pb-text-3)' }

/**
 * DashboardListSection — the project-wide pattern for collection-based
 * dashboard widgets.
 *
 * Architecture (see project dashboard-collection standard):
 *
 *     API ──(limit = widget-specific)──▶ TanStack Query
 *          ──(defensive max)──────────▶ DashboardListSection
 *
 * Responsibilities handled HERE so no widget reimplements them:
 *   1. Defensive cap  — always renders at most `limit` rows, even if the API
 *      unexpectedly returns more (requirement: never .slice() as the PRIMARY
 *      solution, but always as the safety net).
 *   2. Total metadata — renders "Showing N of TOTAL" whenever the caller can
 *      supply a real backend total. When an endpoint has no meaningful total
 *      (e.g. a leaderboard of live sessions), omit `total` and the footer
 *      degrades to "Showing N" instead of inventing a number.
 *   3. View all →     — deep-links to the full-page resource that owns the
 *      complete dataset with its own pagination/filtering.
 *
 * Props:
 *   title       string            Section heading (required)
 *   icon        Lucide component  Optional heading icon
 *   items       array             Raw collection from the API (already
 *                                 fetched WITH the server-side limit)
 *   total       number|null       Real total from the API, if the endpoint
 *                                 provides one. null/undefined = unknown.
 *   limit       number            Widget render budget (defensive cap).
 *   renderItem  (item, i) => node Row renderer.
 *   viewAllTo   string            Route to the full-page resource. Omit if
 *                                 no full-page equivalent exists.
 *   emptyMessage string           Shown when items is empty.
 *   isLoading   bool              Shows spinner instead of content.
 *   headerRight node              Optional extra header actions (replaces
 *                                 the View all link when provided).
 */
export default function DashboardListSection({
  title,
  icon: Icon,
  items = [],
  total = null,
  limit,
  renderItem,
  viewAllTo,
  emptyMessage = 'Nothing to show yet.',
  isLoading = false,
  headerRight,
}) {
  // Defensive maximum — the widget's render budget. The API limit stays the
  // primary mechanism; this only guards against unexpectedly large payloads.
  const capped = (Array.isArray(items) ? items : []).slice(0, limit)
  const shown = capped.length
  const hasTotal = Number.isFinite(total) && total !== null

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-1">
        <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--pb-text-1)' }}>
          {Icon && <Icon size={16} style={{ color: '#a78bfa' }} />}
          {title}
        </h3>
        {headerRight ?? (viewAllTo && (
          <Link
            to={viewAllTo}
            className="text-sm flex items-center gap-1 hover:underline"
            style={{ color: '#60a5fa' }}
          >
            View all <ArrowUpRight size={14} />
          </Link>
        ))}
      </div>

      {isLoading ? (
        <div className="py-10"><Spinner size="md" /></div>
      ) : shown === 0 ? (
        <p className="text-center py-8 text-sm" style={mutedText}>{emptyMessage}</p>
      ) : (
        <>
          <div className="px-5 pb-2 pt-1">
            {capped.map((item, i) => renderItem(item, i))}
          </div>

          {/* "Showing N of TOTAL" — N is what actually rendered (after the
              defensive cap), TOTAL is the real backend count. Omitted when
              the endpoint has no meaningful total. */}
          <div
            className="flex items-center justify-between px-5 py-3 text-xs"
            style={{ borderTop: '1px solid var(--pb-border)' }}
          >
            <span style={mutedText}>
              Showing {shown}{hasTotal ? ` of ${total}` : ''}
            </span>
            {viewAllTo && (
              <Link to={viewAllTo} className="flex items-center gap-1 hover:underline" style={{ color: '#60a5fa' }}>
                View all <ArrowUpRight size={12} />
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  )
}
