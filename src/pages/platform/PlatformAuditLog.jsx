import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPlatformAuditLog } from '../../api/platform.api'
import { unwrapList } from '../../api/axiosInstance'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Spinner from '../../components/common/Spinner'
import { formatDateTime } from '../../utils/formatDate'
import { Search, ShieldCheck, FileWarning, KeyRound, Radio, UserCog, Globe } from 'lucide-react'

// Categorise audit actions into a badge colour for quick scanning. This is a
// purely presentational projection of the existing 'action' string — the rules
// mirror the backend's AuditService determineCategory() heuristics so the UI
// and the stored audit data stay consistent.
function actionBadge(action = '') {
  const a = action.toLowerCase()
  let fg = '#94a3b8'
  let bg = 'rgba(148,163,184,0.15)'
  let icon = <Globe size={13} />

  if (a.startsWith('tenant.')) { fg = '#a78bfa'; bg = 'rgba(139,92,246,0.15)'; icon = <Globe size={13} /> }
  else if (a.startsWith('auth.')) { fg = '#60a5fa'; bg = 'rgba(37,99,235,0.15)'; icon = <KeyRound size={13} /> }
  else if (a.startsWith('payment.') || a.startsWith('billing.') || a.startsWith('invoice.')) { fg = '#34d399'; bg = 'rgba(16,185,129,0.15)'; icon = <Radio size={13} /> }
  else if (a.startsWith('security.')) { fg = '#f87171'; bg = 'rgba(239,68,68,0.15)'; icon = <FileWarning size={13} /> }
  else if (a.startsWith('admin.')) { fg = '#fbbf24'; bg = 'rgba(245,158,11,0.15)'; icon = <UserCog size={13} /> }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ color: fg, background: bg }}
    >
      {icon}
      {action || '—'}
    </span>
  )
}

export default function PlatformAuditLog() {
  const [filters, setFilters] = useState({
    tenant_id: '',
    action: '',
    date_from: '',
    date_to: '',
  })
  const [page, setPage] = useState(1)
  const [perPage] = useState(20)

  const queryParams = {
    per_page: perPage,
  }
  if (filters.tenant_id) queryParams.tenant_id = filters.tenant_id
  if (filters.action) queryParams.action = filters.action
  if (filters.date_from) queryParams.date_from = filters.date_from
  if (filters.date_to) queryParams.date_to = filters.date_to

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['platform-audit-log', queryParams, page],
    queryFn: () => getPlatformAuditLog({ ...queryParams, page }).then((r) => r.data.data),
    keepPreviousData: true,
  })

  const logs = unwrapList({ data }).data
  const meta = unwrapList({ data }).meta

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--pb-text-1)' }}>
            <ShieldCheck size={18} style={{ color: '#a78bfa' }} />
            Platform Audit Log
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pb-text-2)' }}>
            Every platform action and impersonation, reusing the existing audit trail. No duplicates.
          </p>
        </div>
        {isFetching && (
          <span className="text-xs" style={{ color: 'var(--pb-text-3)' }}>Refreshing…</span>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--pb-text-3)' }} />
            <input
              value={filters.action}
              onChange={(e) => { setFilters({ ...filters, action: e.target.value }); setPage(1) }}
              placeholder="Action (e.g. tenant.suspended)"
              className="input pl-9 w-full"
            />
          </div>
          <input
            value={filters.tenant_id}
            onChange={(e) => { setFilters({ ...filters, tenant_id: e.target.value }); setPage(1) }}
            placeholder="Tenant ID"
            type="number"
            className="input w-full"
          />
          <input
            value={filters.date_from}
            onChange={(e) => { setFilters({ ...filters, date_from: e.target.value }); setPage(1) }}
            type="date"
            className="input w-full"
          />
          <input
            value={filters.date_to}
            onChange={(e) => { setFilters({ ...filters, date_to: e.target.value }); setPage(1) }}
            type="date"
            className="input w-full"
          />
          <button
            onClick={() => { setFilters({ tenant_id: '', action: '', date_from: '', date_to: '' }); setPage(1) }}
            className="btn-secondary"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-16"><Spinner size="md" /></div>
        ) : (
          <>
            <Table
              columns={[
                { key: 'created_at', label: 'Timestamp', render: (l) => <span style={{ color: 'var(--pb-text-2)' }}>{formatDateTime(l.created_at)}</span> },
                { key: 'user', label: 'Actor', render: (l) => <span style={{ color: 'var(--pb-text-1)' }}>{l.user?.name || 'System'}</span> },
                { key: 'action', label: 'Action', render: (l) => actionBadge(l.action) },
                { key: 'tenant_id', label: 'Tenant', render: (l) => l.tenant_id ? <span style={{ color: 'var(--pb-text-2)' }}>#{l.tenant_id}</span> : <span style={{ color: 'var(--pb-text-3)' }}>—</span> },
                { key: 'model', label: 'Target', render: (l) => <span style={{ color: 'var(--pb-text-3)' }}>{l.model ? `${l.model}#${l.model_id}` : '—'}</span> },
                { key: 'ip_address', label: 'IP', render: (l) => <span style={{ color: 'var(--pb-text-3)' }}>{l.ip_address || '—'}</span> },
              ]}
              data={logs}
              emptyMessage="No audit entries match your filters"
            />
            <Pagination meta={meta} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Before/after note */}
      <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
        Sensitive fields (passwords, tokens, API keys) are masked by the backend audit service and are never shown.
      </p>
    </div>
  )
}

