import Pagination from '../common/Pagination'
import Spinner from '../common/Spinner'

/**
 * Audit log of every dunning action for the tenant. `runs` is the already
 * unwrapped items array (unwrapList applied by the parent hook); `meta` is the
 * Laravel paginator meta ({current_page, last_page, per_page, total}).
 *
 * Status badges reuse the existing index.css primitives so the palette stays
 * consistent with the rest of the cockpit.
 */
const STATUS_BADGE = {
  pending: 'badge-pending',
  sent: 'badge-paid',
  failed: 'badge-overdue',
  skipped: 'badge-inactive',
}
const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
  { value: 'skipped', label: 'Skipped' },
]

export default function DunningRunTable({ runs, meta, statusFilter, onStatusChange, onPageChange, isLoading }) {
  const clientName = (r) =>
    r.client ? `${r.client.first_name ?? ''} ${r.client.last_name ?? ''}`.trim() : ''

  const columns = [
    {
      key: 'client_name',
      label: 'Client',
      render: (r) => clientName(r) || <em style={{ color: 'var(--pb-text-3)' }}>—</em>,
    },
    {
      key: 'invoice',
      label: 'Invoice',
      render: (r) => r.invoice?.invoice_number ?? <em style={{ color: 'var(--pb-text-3)' }}>—</em>,
    },
    {
      key: 'step',
      label: 'Step',
      render: (r) =>
        r.step ? `${r.step.name} (${r.step.action})` : <em style={{ color: 'var(--pb-text-3)' }}>—</em>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span className={`badge ${STATUS_BADGE[r.status] ?? 'badge-inactive'}`}>{r.status}</span>
      ),
    },
    {
      key: 'executed_at',
      label: 'Executed',
      render: (r) =>
        r.executed_at ? (
          <span className="text-sm" style={{ color: 'var(--pb-text-2)' }}>
            {new Date(r.executed_at).toLocaleString()}
          </span>
        ) : (
          <em style={{ color: 'var(--pb-text-3)' }}>—</em>
        ),
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (r) =>
        r.notes ? (
          <span title={r.notes} className="text-sm" style={{ color: 'var(--pb-text-2)' }}>
            {r.notes.length > 80 ? `${r.notes.slice(0, 80)}…` : r.notes}
          </span>
        ) : null,
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <select
          className="input"
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s.value || 'all'} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--pb-border)' }}>
        <table className="table w-full">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <Spinner size="md" />
                </td>
              </tr>
            ) : runs.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--pb-text-3)' }}>
                  No dunning runs match this filter.
                </td>
              </tr>
            ) : (
              runs.map((r) => (
                <tr key={r.id}>
                  {columns.map((c) => (
                    <td key={c.key} className="pr-2">
                      {c.render ? c.render(r) : r[c.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && <Pagination meta={meta} onPageChange={onPageChange} />}
    </div>
  )
}
