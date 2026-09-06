import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getPlatformSecurityEvents,
  getPlatformSuspiciousActivity,
  getPlatformSecurityOverview,
} from '../../api/platform.api'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Spinner from '../../components/common/Spinner'
import StatCard from '../../components/dashboard/StatCard'
import { formatDateTime } from '../../utils/formatDate'
import { formatNumber } from '../../utils/formatCurrency'
import {
  ShieldCheck, ShieldAlert, KeyRound, Globe,
  Search, AlertTriangle, CheckCircle2, ScanSearch,
} from 'lucide-react'

function SecurityEventBadge(action = '') {
  const a = action.toLowerCase()
  let fg = '#94a3b8'
  let bg = 'rgba(148,163,184,0.15)'
  let Icon = Globe

  if (a.startsWith('auth.login.success')) { fg = '#34d399'; bg = 'rgba(16,185,129,0.15)'; Icon = CheckCircle2 }
  else if (a.startsWith('auth.login.failed')) { fg = '#f87171'; bg = 'rgba(239,68,68,0.15)'; Icon = AlertTriangle }
  else if (a.startsWith('auth.')) { fg = '#60a5fa'; bg = 'rgba(37,99,235,0.15)'; Icon = KeyRound }
  else if (a.startsWith('security.')) { fg = '#fbbf24'; bg = 'rgba(245,158,11,0.15)'; Icon = ShieldAlert }
  else if (a.startsWith('admin.')) { fg = '#a78bfa'; bg = 'rgba(139,92,246,0.15)'; Icon = ShieldCheck }

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

const SEVERITY_OPTIONS = [
  { value: '', label: 'All severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'warning', label: 'Warning' },
  { value: 'info', label: 'Info' },
]

export default function PlatformSecurityCenter() {
  const [severity, setSeverity] = useState('')
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 20

  const queryParams = { per_page: perPage }
  if (severity) queryParams.severity = severity
  if (action) queryParams.action = action

  // ── Headline security metrics (real SystemLog aggregates) ───────────────
  const { data: overview } = useQuery({
    queryKey: ['platform-security-overview'],
    queryFn: () => getPlatformSecurityOverview(),
    refetchInterval: 60000,
  })

  // ── Suspicious activity (brute-force detection on real failed logins) ───
  const { data: suspicious } = useQuery({
    queryKey: ['platform-security-suspicious'],
    queryFn: () => getPlatformSuspiciousActivity(),
    refetchInterval: 60000,
  })

  // ── Cross-tenant security event feed ────────────────────────────────────
  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['platform-security-events', queryParams, page],
    queryFn: () => getPlatformSecurityEvents({ ...queryParams, page }),
    keepPreviousData: true,
  })

  const events = data?.data ?? []
  const meta = data?.meta ?? {}

  const suspiciousIps = Array.isArray(suspicious?.suspicious_ips) ? suspicious.suspicious_ips : []
  const recentFailures = Array.isArray(suspicious?.recent_failures) ? suspicious.recent_failures : []
  const threshold = suspicious?.threshold ?? 5

  const failureReason = (entry) => {
    const reason = entry?.details?.reason
    return typeof reason === 'string' ? reason : 'Auto-detected failure'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--pb-text-1)' }}>
            <ShieldCheck size={18} style={{ color: '#a78bfa' }} />
            Security Center
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pb-text-2)' }}>
            Cross-tenant security events, authentication anomalies, and brute-force detection.
          </p>
        </div>
        {isFetching && (
          <span className="text-xs" style={{ color: 'var(--pb-text-3)' }}>Refreshing…</span>
        )}
      </div>

      {/* Headline KPI cards — real aggregates from the SystemLog feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Failed Logins / 7d"
          value={formatNumber(overview?.failed_logins_this_week ?? 0)}
          subtitle={`${formatNumber(overview?.failed_logins_today ?? 0)} today`}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Successful Logins / today"
          value={formatNumber(overview?.successful_logins_today ?? 0)}
          subtitle={`${formatNumber(overview?.successful_logins_this_week ?? 0)} this week`}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="Security Events / 7d"
          value={formatNumber(overview?.security_events_this_week ?? 0)}
          subtitle="Security-flagged system actions"
          icon={ShieldAlert}
          color="purple"
        />
        <StatCard
          title="Suspicious IPs"
          value={formatNumber(suspiciousIps.length)}
          subtitle={`flagged after ${formatNumber(threshold)}+ failures (7d)`}
          icon={ScanSearch}
          color={suspiciousIps.length > 0 ? 'orange' : 'primary'}
        />
      </div>

      {/* Suspicious activity + recent failures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-1" style={{ color: 'var(--pb-text-1)' }}>
            Suspicious IPs
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--pb-text-3)' }}>
            IPs with more than {formatNumber(threshold)} failed logins in the last 7 days.
          </p>
          {suspiciousIps.length === 0 ? (
            <div className="py-8 text-center text-sm" style={{ color: 'var(--pb-text-3)' }}>
              <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-400" />
              No suspicious activity detected.
            </div>
          ) : (
            <div className="space-y-2">
              {suspiciousIps.map((s) => (
                <div
                  key={s.ip}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: 'var(--pb-raised)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}
                    >
                      <ScanSearch size={14} style={{ color: '#f87171' }} />
                    </div>
                    <div>
                      <p className="text-sm font-mono font-medium" style={{ color: 'var(--pb-text-1)' }}>{s.ip}</p>
                      <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
                        {formatNumber(s.attempts)} failed attempts
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{ color: '#f87171', background: 'rgba(239,68,68,0.12)' }}
                  >
                    FLAGGED
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold mb-1" style={{ color: 'var(--pb-text-1)' }}>
            Recent Failed Logins
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--pb-text-3)' }}>
            Latest auth failures across every tenant (last 24h).
          </p>
          {recentFailures.length === 0 ? (
            <div className="py-8 text-center text-sm" style={{ color: 'var(--pb-text-3)' }}>
              No failed logins in the last 24 hours.
            </div>
          ) : (
            <div className="space-y-2">
              {recentFailures.map((f, i) => (
                <div
                  key={`${f.ip_address}-${f.created_at}-${i}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg"
                  style={{ background: 'var(--pb-raised)' }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-mono font-medium truncate" style={{ color: 'var(--pb-text-1)' }}>
                      {f.ip_address || 'Unknown IP'}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--pb-text-3)' }}>
                      {f.action} · {formatDateTime(f.created_at)}
                    </p>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium shrink-0 capitalize"
                    style={{ color: '#f87171', background: 'rgba(239,68,68,0.12)' }}
                  >
                    {failureReason(f)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Security event feed */}
      <div className="card p-4">
        <div className="mb-4">
          <h3 className="font-semibold" style={{ color: 'var(--pb-text-1)' }}>Security Event Log</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--pb-text-3)' }}>
            Every <code>auth.</code> / <code>security.</code> system-log action across the platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--pb-text-3)' }} />
            <input
              value={action}
              onChange={e => { setAction(e.target.value); setPage(1) }}
              placeholder="Action (e.g. login.failed)"
              className="input pl-9 w-full"
            />
          </div>
          <select
            value={severity}
            onChange={e => { setSeverity(e.target.value); setPage(1) }}
            className="input w-full"
          >
            {SEVERITY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => { setAction(''); setSeverity(''); setPage(1) }}
            className="btn-secondary"
          >
            Clear filters
          </button>
        </div>

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
                { key: 'tenant_id', label: 'Tenant', render: l => l.tenant_id
                  ? <span style={{ color: 'var(--pb-text-2)' }}>#{l.tenant_id}</span>
                  : <span style={{ color: 'var(--pb-text-3)' }}>Platform</span> },
                { key: 'ip_address', label: 'IP', render: l => <span className="font-mono text-xs" style={{ color: 'var(--pb-text-3)' }}>{l.ip_address || '—'}</span> },
              ]}
              data={events}
              emptyMessage="No security events match your filters"
            />
            <Pagination meta={meta} onPageChange={setPage} />
          </>
        )}
      </div>

      <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
        Aggregated from the real SystemLog audit trail (<code>auth.*</code> and <code>security.*</code> actions).
        Sensitive fields (passwords, tokens, API keys) are masked at the source and never returned. The full
        privileged-action audit trail across all domains remains on the <strong>Audit Log</strong> page.
      </p>
    </div>
  )
}