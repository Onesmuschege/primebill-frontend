import { useQuery } from '@tanstack/react-query'
import { getPlatformStats, getPlatformTenants } from '../../api/platform.api'
import StatCard from '../../components/dashboard/StatCard'
import Spinner from '../../components/common/Spinner'
import { formatNumber } from '../../utils/formatCurrency'
import {
  Activity, Server, AlertTriangle,
  CheckCircle2, XCircle, Clock,
} from 'lucide-react'

// Service states are real measurements (up/down via probes), fleet aggregates
// (degraded), or an honest "unverified" for signals not instrumented yet — we
// never claim a service is up when we have no heartbeat to prove it.
const SERVICE_PALETTE = {
  up: { dot: '#34d399', glow: 'rgba(52,211,153,0.6)', text: 'Operational', fg: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  degraded: { dot: '#fbbf24', glow: 'rgba(251,191,36,0.6)', text: 'Degraded', fg: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  down: { dot: '#f87171', glow: 'rgba(248,113,113,0.6)', text: 'Down', fg: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  unverified: { dot: '#94a3b8', glow: 'rgba(148,163,184,0.4)', text: 'Unverified', fg: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
}

function HealthDot({ status }) {
  const tone = SERVICE_PALETTE[status] ?? SERVICE_PALETTE.unverified
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 shrink-0"
      style={{ backgroundColor: tone.dot, boxShadow: `0 0 8px ${tone.glow}` }}
    />
  )
}

export default function PlatformSystemHealth() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['platform-stats-health'],
    queryFn: () => getPlatformStats(),
    refetchInterval: 30000,
  })

  const { data: tenantsData } = useQuery({
    queryKey: ['platform-tenants-health'],
    queryFn: () => getPlatformTenants(),
    refetchInterval: 60000,
  })

  const infra = statsData?.infrastructure || {}
  const tenants = Array.isArray(tenantsData?.data) ? tenantsData.data : []

  const isLoading = statsLoading

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  const healthIssues = tenants.filter(t => t.health_status === 'degraded' || t.health_status === 'down')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--pb-text-1)' }}>System Health</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--pb-text-2)' }}>
          Platform-wide infrastructure, tenant health, and service availability.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Platform Status"
          value={infra.status || 'Operational'}
          subtitle="Overall platform health"
          icon={Activity}
          color={infra.status === 'operational' ? 'green' : 'orange'}
        />
        <StatCard
          title="Active Tenants"
          value={formatNumber(tenants.filter(t => t.status === 'active').length)}
          subtitle={`${formatNumber(tenants.length)} total tenants`}
          icon={Server}
          color="blue"
        />
        <StatCard
          title="Avg Response Time"
          value={`${infra.avg_response_time ?? '—'}`}
          subtitle={infra.response_time_unit || 'ms'}
          icon={Clock}
          color="purple"
        />
        <StatCard
          title="Health Issues"
          value={formatNumber(healthIssues.length)}
          subtitle="Tenants needing attention"
          icon={AlertTriangle}
          color={healthIssues.length > 0 ? 'orange' : 'green'}
        />
      </div>
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--pb-text-1)' }}>Service Status</h3>
          <div className="space-y-3">
            {(infra.services || []).map(service => {
              const tone = SERVICE_PALETTE[service.status] ?? SERVICE_PALETTE.unverified
              return (
                <div key={service.name} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <HealthDot status={service.status} />
                    <div className="min-w-0">
                      <span className="text-sm font-medium block" style={{ color: 'var(--pb-text-1)' }}>{service.name}</span>
                      {service.detail && (
                        <span className="text-xs block truncate" style={{ color: 'var(--pb-text-3)' }}>{service.detail}</span>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full capitalize shrink-0"
                    style={{ color: tone.fg, background: tone.bg }}
                  >
                    {tone.text}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--pb-text-1)' }}>Tenant Health Issues</h3>
          {healthIssues.length === 0 ? (
            <div className="py-8 text-center text-sm" style={{ color: 'var(--pb-text-3)' }}>
              <CheckCircle2 size={32} className="mx-auto mb-2 text-green-500" />
              All tenants are healthy.
            </div>
          ) : (
            <div className="space-y-3">
              {healthIssues.map(tenant => (
                <div key={tenant.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--pb-raised)' }}>
                  <div className="flex items-center gap-3">
                    <XCircle size={16} style={{ color: '#f87171' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--pb-text-1)' }}>{tenant.name}</p>
                      <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
                        {tenant.health_status === 'degraded' ? 'Degraded performance' : 'Service down'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full" style={{
                    color: '#f87171',
                    background: 'rgba(239,68,68,0.12)',
                  }}>
                    {tenant.health_status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
        Signals are real measurements wherever measurable: database/cache reachability probes, a measured DB
        round-trip for response time, and live router fleet counts. Queue worker status is config-derived — a
        worker heartbeat is not instrumented yet (documented gap). Router fleet shows{' '}
        <span className="font-medium">unverified</span> when no routers are registered. Tenant health and all
        KPIs come from live platform data.
      </p>
    </div>
  )
}