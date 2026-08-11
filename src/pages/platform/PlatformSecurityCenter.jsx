import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPlatformAuditLog, getPlatformStats } from '../../api/platform.api'
import { unwrapList } from '../../api/axiosInstance'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Spinner from '../../components/common/Spinner'
import { formatDateTime } from '../../utils/formatDate'
import {
  ShieldCheck, FileWarning, KeyRound, UserCog, Globe,
  Search, AlertTriangle, CheckCircle2,
} from 'lucide-react'

function SecurityEventBadge(action = '') {
  const a = action.toLowerCase()
  let fg = '#94a3b8'
  let bg = 'rgba(148,163,184,0.15)'
  let Icon = Globe

  if (a.startsWith('tenant.')) { fg = '#a78bfa'; bg = 'rgba(139,92,246,0.15)'; Icon = Globe }
  else if (a.startsWith('auth.')) { fg = '#60a5fa'; bg = 'rgba(37,99,235,0.15)'; Icon = KeyRound }
  else if (a.startsWith('payment.') || a.startsWith('billing.') || a.startsWith('invoice.')) { fg = '#34d399'; bg = 'rgba(16,185,129,0.15)'; Icon = CheckCircle2 }
  else if (a.startsWith('security.')) { fg = '#f87171'; bg = 'rgba(239,68,68,0.15)'; Icon = AlertTriangle }
  else if (a.startsWith('admin.')) { fg = '#fbbf24'; bg = 'rgba(245,158,11,0.15)'; Icon = UserCog }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ color: fg, background: bg }}
    >
      <Icon size={13} />
      {action || '—'}
    </span>
  )
}

export default function PlatformSecurityCenter() {
  const [filters, setFilters] = useState({
    action: '',
    tenant_id: '',
    date_from: '',
    date_to: '',
  })
  const [page, setPage] = useState(1)
  const perPage = 20

  const queryParams = { per_page: perPage }
  if (filters.action) queryParams.action = filters.action
  if (filters.tenant_id) queryParams.tenant_id = filters.tenant_id
  if (filters.date_from) queryParams.date_from = filters.date_from
  if (filters.date_to) queryParams.date_to = filters.date_to

  const { data: statsData } = useQuery({
    queryKey: ['platform-stats-security'],
    queryFn: () => getPlatformStats().then(r => r.data.data),
  })

  const securityStats = statsData?.security || {}

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['platform-audit-log-security', queryParams, page],
    queryFn: () => getPlatformAuditLog({ ...queryParams, page }).then(r => r.data.data),
    keepPreviousData: true,
  })

  const { data: logs = [], meta = {} } = unwrapList({ data })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--pb-text-1)' }}>
            <ShieldCheck size={18} style={{ color: '#a78bfa' }} />
            Security Center
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pb-text-2)' }}>
            Cross-tenant security events, authentication logs, and platform-level alerts.
          </p>
        </div>
        {isFetching && (
          <span className="text-xs" style={{ color: 'var(--pb-text-3)' }}>Refreshing…</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.12)' }}>
            <AlertTriangle size={24} style={{ color: '#f87171' }} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--pb-text-3)' }}>Failed Logins (24h)</p>
            <p className="text-xl font-bold" style={{ color: 'var(--pb-text-1)' }}>
              {securityStats.failed_logins_today ?? 0}
            </p>
            <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
              {securityStats.failed_logins_this_week ?? 0} this week
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-xl" style={{ background: 'rgba(96,165,250,0.12)' }}>
            <KeyRound size={24} style={{ color: '#60a5fa' }} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--pb-text-3)' }}>Successful Logins (24h)</p>
            <p className="text-xl font-bold" style={{ color: 'var(--pb-text-1)' }}>
              {securityStats.successful_logins_today ?? 0}
            </p>
            <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
              {securityStats.successful_logins_this_week ?? 0} this week
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-xl" style={{ background: 'rgba(167,139,250,0.12)' }}>
            <UserCog size={24} style={{ color: '#a78bfa' }} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--pb-text-3)' }}>Platform Admins</p>
            <p className="text-xl font-bold" style={{ color: 'var(--pb-text-1)' }}>
              {securityStats.platform_admins ?? 0}
            </p>
            <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>Active sessions</p>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--pb-text-3)' }} />
            <input
              value={filters.action}
              onChange={e => { setFilters({ ...filters, action: e.target.value }); setPage(1) }}
              placeholder="Action (e.g. security.login_failed)"
              className="input pl-9 w-full"
            />
          </div>
          <input
            value={filters.tenant_id}
            onChange={e => { setFilters({ ...filters, tenant_id: e.target.value }); setPage(1) }}
            placeholder="Tenant ID"
            type="number"
            className="input w-full"
          />
          <input
            value={filters.date_from}
            onChange={e => { setFilters({ ...filters, date_from: e.target.value }); setPage(1) }}
            type="date"
            className="input w-full"
          />
          <input
            value={filters.date_to}
            onChange={e => { setFilters({ ...filters, date_to: e.target.value }); setPage(1) }}
            type="date"
            className="input w-full"
          />
          <button
            onClick={() => { setFilters({ action: '', tenant_id: '', date_from: '', date_to: '' }); setPage(1) }}
            className="btn-secondary"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-16"><Spinner size="md" /></div>
        ) : isError ? (
          <div className="py-16 text-sm text-center" style={{ color: 'var(--pb-text-3)' }}>
            Failed to load security events. Please try again.
          </div>
        ) : (
          <>
            <Table
              columns={[
                { key: 'created_at', label: 'Timestamp', render: l => <span style={{ color: 'var(--pb-text-2)' }}>{formatDateTime(l.created_at)}</span> },
                { key: 'user', label: 'Actor', render: l => <span style={{ color: 'var(--pb-text-1)' }}>{l.user?.name || 'System'}</span> },
                { key: 'action', label: 'Action', render: l => SecurityEventBadge(l.action) },
                { key: 'tenant_id', label: 'Tenant', render: l => l.tenant_id ? <span style={{ color: 'var(--pb-text-2)' }}>#{l.tenant_id}</span> : <span style={{ color: 'var(--pb-text-3)' }}>—</span> },
                { key: 'model', label: 'Target', render: l => <span style={{ color: 'var(--pb-text-3)' }}>{l.model ? `${l.model}#${l.model_id}` : '—'}</span> },
                { key: 'ip_address', label: 'IP', render: l => <span style={{ color: 'var(--pb-text-3)' }}>{l.ip_address || '—'}</span> },
              ]}
              data={logs}
              emptyMessage="No security events match your filters"
            />
            <Pagination meta={meta} onPageChange={setPage} />
          </>
        )}
      </div>

      <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
        Sensitive fields (passwords, tokens, API keys) are masked by the backend audit service and are never shown.
      </p>
    </div>
  )
}
