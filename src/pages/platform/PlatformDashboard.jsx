import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  getPlatformStats,
  getPlatformTenants,
  getPlatformTenant,
  suspendTenant,
  activateTenant,
} from '../../api/platform.api'
import Table from '../../components/common/Table'
import Modal from '../../components/common/Modal'
import StatCard from '../../components/dashboard/StatCard'
import DashboardListSection from '../../components/dashboard/DashboardListSection'
import { DASHBOARD_LIMITS } from '../../utils/dashboardLimits'
import Spinner from '../../components/common/Spinner'
import { formatKES, formatNumber } from '../../utils/formatCurrency'
import { formatDate, formatDateTime } from '../../utils/formatDate'
import { tenantStatusBadge } from '../../utils/statusColors'
import {
  Globe, Building2, Users, DollarSign, AlertCircle,
  Search, UserX, UserCheck, ShieldAlert, Activity,
  Server, CreditCard, ShieldCheck, Clock, TrendingUp,
  Wifi, Eye, ArrowLeft, Mail, Phone, MapPin, Database, ArrowUpRight,
} from 'lucide-react'

// ── Small helpers ────────────────────────────────────────────────────────
function HealthDot({ ok }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full mr-1.5"
      style={{
        backgroundColor: ok ? '#34d399' : '#f87171',
        boxShadow: ok ? '0 0 8px rgba(52,211,153,0.6)' : '0 0 8px rgba(248,113,113,0.6)',
      }}
    />
  )
}

function ActivityIcon({ action }) {
  const a = action || ''
  let cls = 'rgba(148,163,184,0.15)'
  let color = '#94a3b8'
  if (a.includes('payment')) { cls = 'rgba(16,185,129,0.15)';  color = '#34d399' }
  else if (a.includes('tenant')) { cls = 'rgba(139,92,246,0.15)'; color = '#a78bfa' }
  else if (a.includes('login')) { cls = 'rgba(37,99,235,0.15)';  color = '#60a5fa' }
  else if (a.includes('security')) { cls = 'rgba(239,68,68,0.15)'; color = '#f87171' }
  else if (a.includes('invoice')) { cls = 'rgba(245,158,11,0.15)'; color = '#fbbf24' }
  return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
      style={{ backgroundColor: cls }}>
      <Activity size={14} style={{ color }} />
    </div>
  )
}

export default function PlatformDashboard() {
  const queryClient = useQueryClient()
    const [search, setSearch]         = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [confirmTarget, setConfirmTarget] = useState(null) // { tenant, action }
  const [detailTenant, setDetailTenant] = useState(null)   // tenant object
  const [showDetail, setShowDetail] = useState(false)

  // ── Data ────────────────────────────────────────────────────────────────
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => getPlatformStats(),
    refetchInterval: 60000,
  })

  // Dashboard tenant preview: server-side limit (widget budget) + server-side
  // search/status filtering. The full-page /platform/tenants view keeps its
  // own independent fetching; this widget only ever receives its slice plus
  // the real filtered total for the "Showing N of TOTAL" footer.
  const { data: tenantsPage, isLoading: tenantsLoading, isFetching: tenantsFetching } = useQuery({
    queryKey: ['platform-tenants', 'dashboard', DASHBOARD_LIMITS.platformTenants, debouncedSearch, statusFilter],
    queryFn: () => getPlatformTenants({
      per_page: DASHBOARD_LIMITS.platformTenants,
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
    }),
    keepPreviousData: true,
  })

  const tenants = tenantsPage?.data || []
  const tenantsTotal = Number.isFinite(tenantsPage?.meta?.total) ? tenantsPage.meta.total : null

  const { data: tenantDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['platform-tenant-detail', detailTenant?.id],
    queryFn: () => getPlatformTenant(detailTenant.id),
    enabled: !!showDetail && !!detailTenant?.id,
  })

  // ── Mutations ───────────────────────────────────────────────────────────
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['platform-tenants'] })
    queryClient.invalidateQueries({ queryKey: ['platform-stats'] })
  }

  const suspendMutation = useMutation({
    mutationFn: suspendTenant,
        onSuccess: (_, tenantId) => {
      const tenant = tenants.find(t => t.id === tenantId)
      toast.success(`${tenant?.name ?? 'Tenant'} suspended`)
      refresh()
      setConfirmTarget(null)
    },
    onError: () => { toast.error('Failed to suspend tenant'); setConfirmTarget(null) },
  })

  const activateMutation = useMutation({
    mutationFn: activateTenant,
    onSuccess: (_, tenantId) => {
      const tenant = tenants.find(t => t.id === tenantId)
      toast.success(`${tenant?.name ?? 'Tenant'} activated`)
      refresh()
      setConfirmTarget(null)
    },
    onError: () => { toast.error('Failed to activate tenant'); setConfirmTarget(null) },
  })

  const isMutating = suspendMutation.isPending || activateMutation.isPending

  // ── Derived stats ───────────────────────────────────────────────────────
  const overview  = statsData?.overview  || {}
  const tenantSt  = statsData?.tenants   || {}
  const revenue   = statsData?.revenue   || {}
  const clients   = statsData?.clients   || {}
  const infra     = statsData?.infrastructure || {}
  const security  = statsData?.security  || {}
  const activity  = Array.isArray(statsData?.activity) ? statsData.activity : []
  // PrimeBill's own commercial position with its tenants (PlatformInvoice) —
  // deliberately distinct from the client Payment/Invoice volume below (§1).
  const billing   = statsData?.billing   || {}

  const revenueByMethod = Object.entries(revenue.by_method || {})
    .map(([method, amount]) => ({ method, amount }))

  const revenueMethodTotal = revenueByMethod.reduce((s, m) => s + m.amount, 0) || 1

  const planDist = Object.entries(tenantSt.by_plan || {})
    .map(([plan, count]) => ({ plan: plan || 'n/a', count }))
  const planTotal = planDist.reduce((s, p) => s + p.count, 0) || 1

  const clientStatus = Object.entries(clients.by_status || {})
    .map(([status, count]) => ({ status, count }))

// Revenue time series (monthly 12m)
  const monthlyRevenue = Array.isArray(revenue.monthly) ? revenue.monthly : []
  const maxMonthly = Math.max(1, ...monthlyRevenue.map(m => m.total))

  // ── Server-side search/filter for the dashboard tenant preview ──────────
  // Filtering happens in the API call (getTenants supports search + status),
  // so the widget stays bounded no matter how many tenants match. The full
  // /platform/tenants page keeps its own richer client-side filtering.
  const onTenantSearchChange = (value) => {
    setSearch(value)
    clearTimeout(onTenantSearchChange._t)
    onTenantSearchChange._t = setTimeout(() => setDebouncedSearch(value), 350)
  }

  const handleConfirmAction = () => {
    if (!confirmTarget) return
    const { tenant, action } = confirmTarget
    if (action === 'suspend') suspendMutation.mutate(tenant.id)
    else activateMutation.mutate(tenant.id)
  }

  // ── Table columns ───────────────────────────────────────────────────────
  const columns = [
    {
      key: 'name',
      label: 'Tenant',
      render: (t) => (
        <div>
          <p className="font-medium" style={{ color: 'var(--pb-text-1)' }}>{t.name}</p>
          <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{t.slug}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (t) => <span className={tenantStatusBadge(t.status)}>{t.status}</span>,
    },
    {
      key: 'plan',
      label: 'Plan',
      render: (t) => (
        <span className="capitalize" style={{ color: 'var(--pb-text-2)' }}>{t.plan || '—'}</span>
      ),
    },
    {
      key: 'client_count',
      label: 'Clients',
      render: (t) => (
        <span style={{ color: 'var(--pb-text-2)' }}>
          {formatNumber(t.client_count)}{t.max_clients ? ` / ${formatNumber(t.max_clients)}` : ''}
        </span>
      ),
    },
    {
      key: 'revenue',
      label: 'Revenue',
      render: (t) => (
        <span className="font-medium" style={{ color: 'var(--pb-text-1)' }}>{formatKES(t.revenue)}</span>
      ),
    },
    {
      key: 'outstanding_invoices',
      label: 'Outstanding',
      render: (t) => (
        <span style={{ color: t.outstanding_invoices > 0 ? '#fbbf24' : 'var(--pb-text-3)' }}>
          {formatKES(t.outstanding_invoices)}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      render: (t) => (
        <span style={{ color: 'var(--pb-text-3)' }}>{formatDate(t.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (t) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setDetailTenant(t); setShowDetail(true) }}
            className="p-1.5 rounded-lg transition-colors"
            title="View tenant"
            style={{ color: '#60a5fa' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.1)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Eye size={15} />
          </button>
          {t.status === 'suspended' ? (
            <button
              onClick={() => setConfirmTarget({ tenant: t, action: 'activate' })}
              disabled={isMutating}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
              title="Activate tenant"
              style={{ color: '#34d399' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.1)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <UserCheck size={15} />
            </button>
          ) : (
            <button
              onClick={() => setConfirmTarget({ tenant: t, action: 'suspend' })}
              disabled={isMutating}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
              title="Suspend tenant"
              style={{ color: '#fbbf24' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(245,158,11,0.1)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <UserX size={15} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">

      {/* ── Platform banner ────────────────────────────────────────────── */}
      <div
        className="rounded-xl p-5 flex items-center gap-4 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(6,182,212,0.06))',
          border: '1px solid rgba(139,92,246,0.25)',
        }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', boxShadow: '0 0 24px rgba(124,58,237,0.35)' }}
        >
          <Globe size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg leading-tight" style={{ color: 'var(--pb-text-1)' }}>
            Platform Admin
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pb-text-2)' }}>
            Cross-tenant command center — every ISP running on the PrimeBill ISP Platform, not just your own workspace.
          </p>
        </div>
        <div
          className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full shrink-0"
          style={{ color: '#a78bfa', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}
        >
          <ShieldAlert size={13} />
          Platform-only
        </div>
      </div>

      {/* ── Overview KPI cards ── */}
      {statsLoading ? (
        <div className="py-10"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Tenants"
              value={formatNumber(overview.total_tenants)}
              subtitle={`${overview.active_tenants ?? 0} active · ${overview.trial_tenants ?? 0} trial · ${overview.suspended_tenants ?? 0} suspended`}
              icon={Building2}
              color="purple"
            />
            <StatCard
              title="Total Clients"
              value={formatNumber(clients.total)}
              subtitle={`${clients.new_this_month ?? 0} new this month`}
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Platform MRR"
              value={formatKES(overview.mrr)}
              subtitle={`ARR ${formatKES(overview.arr)} · from active tenant subscriptions`}
              icon={DollarSign}
              color="green"
            />
            <StatCard
              title="Outstanding (PrimeBill)"
              value={formatKES(billing.outstanding_total)}
              subtitle={`${billing.overdue_count ?? 0} overdue · PrimeBill invoices to tenants`}
              icon={AlertCircle}
              color="orange"
            />
          </div>

          {/* ── Secondary metrics row ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Client Collections Today"
              value={formatKES(revenue.today)}
              subtitle={`This month ${formatKES(revenue.this_month)} · tenant-client payments, all ISPs`}
              icon={CreditCard}
              color="cyan"
            />
            <StatCard
              title="Client Payments"
              value={formatNumber(overview.total_payments)}
              subtitle={`Client payment volume ${formatKES(overview.total_revenue)} (not PrimeBill revenue)`}
              icon={TrendingUp}
              color="green"
            />
            <StatCard
              title="Tenant Growth"
              value={`${tenantSt.growth_rate ?? 0}%`}
              subtitle={`${tenantSt.new_this_month ?? 0} new tenants this month`}
              icon={Activity}
              color="blue"
            />
            <StatCard
              title="Client Growth"
              value={`${clients.growth_rate ?? 0}%`}
              subtitle={`${clients.new_this_month ?? 0} new clients this month`}
              icon={Users}
              color="purple"
            />
          </div>

          {/* ── Revenue & usage visualization row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Monthly revenue bar chart */}
            <div className="card p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--pb-text-1)' }}>
                  Monthly Platform Revenue (12 months)
                </h3>
                <span className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
                  {formatKES(revenue.this_year)} this year
                </span>
              </div>
              {monthlyRevenue.length === 0 ? (
                <p className="text-sm py-8 text-center" style={{ color: 'var(--pb-text-3)' }}>
                  No revenue data yet
                </p>
              ) : (
                <div className="flex items-end gap-1 h-40">
                  {monthlyRevenue.map((m, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                      <span className="text-[9px] opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--pb-text-2)' }}>
                        {formatKES(m.total)}
                      </span>
                      <div
                        className="w-full rounded-t"
                        style={{
                          height: `${(m.total / maxMonthly) * 100}%`,
                          minHeight: '4px',
                          background: 'linear-gradient(180deg,#7c3aed,#06b6d4)',
                          opacity: 0.85,
                        }}
                      />
                      <span className="text-[9px]" style={{ color: 'var(--pb-text-3)' }}>
                        {m.month?.slice(5) || ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Revenue by payment method */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--pb-text-1)' }}>
                Revenue by Payment Method
              </h3>
              {revenueByMethod.length === 0 ? (
                <p className="text-sm py-8 text-center" style={{ color: 'var(--pb-text-3)' }}>
                  No payment data
                </p>
              ) : (
                <div className="space-y-4">
                  {revenueByMethod.map(({ method, amount }) => (
                    <div key={method}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="capitalize" style={{ color: 'var(--pb-text-2)' }}>{method}</span>
                        <span className="font-medium" style={{ color: 'var(--pb-text-1)' }}>
                          {formatKES(amount)} · {Math.round((amount / revenueMethodTotal) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(amount / revenueMethodTotal) * 100}%`,
                            background: 'linear-gradient(90deg,#34d399,#06b6d4)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Plans / clients / infrastructure / security row ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Plan distribution */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--pb-text-1)' }}>
                Tenants by Plan
              </h3>
              <div className="space-y-3">
                {planDist.map(({ plan, count }) => (
                  <div key={plan}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize" style={{ color: 'var(--pb-text-2)' }}>{plan}</span>
                      <span style={{ color: 'var(--pb-text-1)' }}>{count}</span>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(count / planTotal) * 100}%`, background: '#a78bfa' }}
                      />
                    </div>
                  </div>
                ))}
                {planDist.length === 0 && (
                  <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>No tenants</p>
                )}
              </div>
            </div>

            {/* Client status */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--pb-text-1)' }}>
                Clients by Status
              </h3>
              <div className="space-y-3">
                {clientStatus.map(({ status, count }) => (
                  <div key={status}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize" style={{ color: 'var(--pb-text-2)' }}>{status}</span>
                      <span style={{ color: 'var(--pb-text-1)' }}>{formatNumber(count)}</span>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(count / Math.max(1, clients.total)) * 100}%`,
                          background: status === 'active' ? '#34d399' : status === 'suspended' ? '#fbbf24' : '#94a3b8',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Infrastructure health */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--pb-text-1)' }}>
                Infrastructure Health
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center" style={{ color: 'var(--pb-text-2)' }}>
                    <Server size={14} className="mr-2" style={{ color: '#a78bfa' }} />
                    Routers
                  </span>
                  <div className="text-right">
                    <div className="flex items-center justify-end" style={{ color: 'var(--pb-text-1)' }}>
                      <HealthDot ok={(infra.routers?.online ?? 0) > 0 || (infra.routers?.total ?? 0) === 0} />
                      {formatNumber(infra.routers?.online ?? 0)} online / {formatNumber(infra.routers?.total ?? 0)}
                    </div>
                    <span className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
                      {infra.routers?.health_percentage ?? 100}% healthy
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center" style={{ color: 'var(--pb-text-2)' }}>
                    <Database size={14} className="mr-2" style={{ color: '#60a5fa' }} />
                    Database
                  </span>
                  <span className="capitalize" style={{ color: 'var(--pb-text-1)' }}>
                    <HealthDot ok={infra.database?.status === 'connected'} />
                    {infra.database?.driver}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center" style={{ color: 'var(--pb-text-2)' }}>
                    <Clock size={14} className="mr-2" style={{ color: '#34d399' }} />
                    Queue
                  </span>
                  <span className="capitalize" style={{ color: 'var(--pb-text-1)' }}>
                    <HealthDot ok={infra.queue?.status === 'running'} />
                    {infra.queue?.default}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center" style={{ color: 'var(--pb-text-2)' }}>
                    <Activity size={14} className="mr-2" style={{ color: '#fbbf24' }} />
                    Cache
                  </span>
                  <span className="capitalize" style={{ color: 'var(--pb-text-1)' }}>
                    <HealthDot ok={infra.cache?.status === 'healthy'} />
                    {infra.cache?.driver}
                  </span>
                </div>
              </div>
            </div>

            {/* Security metrics */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--pb-text-1)' }}>
                Security Overview
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div
                  className="rounded-lg p-3"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
                >
                  <p className="text-2xl font-bold" style={{ color: '#f87171' }}>
                    {formatNumber(security.failed_logins_today)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--pb-text-3)' }}>Failed logins today</p>
                </div>
                <div
                  className="rounded-lg p-3"
                  style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
                >
                  <p className="text-2xl font-bold" style={{ color: '#34d399' }}>
                    {formatNumber(security.successful_logins_today)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--pb-text-3)' }}>Successful logins today</p>
                </div>
                <div
                  className="rounded-lg p-3"
                  style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)' }}
                >
                  <p className="text-2xl font-bold" style={{ color: '#60a5fa' }}>
                    {formatNumber(security.security_events_this_week)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--pb-text-3)' }}>Security events this week</p>
                </div>
                <div
                  className="rounded-lg p-3"
                  style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}
                >
                  <p className="text-2xl font-bold" style={{ color: '#a78bfa' }}>
                    {formatNumber(security.platform_admins)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--pb-text-3)' }}>Platform admins</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Recent activity feed ── */}
          <DashboardListSection
            title="Recent Platform Activity"
            icon={ShieldCheck}
            items={activity}
            limit={DASHBOARD_LIMITS.platformActivity}
            viewAllTo="/platform/audit-log"
            emptyMessage="No recent activity logged"
            renderItem={(log) => (
              <div key={log.id}
                className="flex items-center gap-3 p-2.5 rounded-lg"
                style={{ borderBottom: '1px solid var(--pb-border)' }}
              >
                <ActivityIcon action={log.action} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--pb-text-1)' }}>
                    {log.user}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--pb-text-3)' }}>
                    {log.action} · {log.model ? `${log.model}#${log.model_id}` : ''}
                  </p>
                </div>
                <span className="text-xs shrink-0" style={{ color: 'var(--pb-text-3)' }}>
                  {formatDateTime(log.created_at)}
                </span>
              </div>
            )}
          />
        </>
      )}

      {/* ── Tenant table (dashboard preview) ── */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between gap-3 flex-wrap p-4"
          style={{ borderBottom: '1px solid var(--pb-border)' }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--pb-text-3)' }}
              />
              <input
                value={search}
                onChange={(e) => onTenantSearchChange(e.target.value)}
                placeholder="Search tenants..."
                className="input pl-9 w-56"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <p className="text-xs" style={{ color: 'var(--pb-text-3)', opacity: tenantsFetching ? 1 : 0, transition: 'opacity 0.2s' }}>
              Refreshing…
            </p>
            <Link to="/platform/tenants" className="text-sm flex items-center gap-1 hover:underline" style={{ color: '#60a5fa' }}>
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        <Table
          columns={columns}
          data={tenants}
          loading={tenantsLoading}
          emptyMessage={search || statusFilter ? 'No tenants match your filters' : 'No tenants yet'}
        />

        {/* Showing N of TOTAL — N is the defensive-capped render count, TOTAL is
            the real backend count for the active search/status filter. */}
        <div className="flex items-center justify-between px-4 py-3 text-xs"
          style={{ borderTop: '1px solid var(--pb-border)' }}>
          <span style={{ color: 'var(--pb-text-3)' }}>
            {tenantsLoading
              ? 'Loading…'
              : `Showing ${Math.min(tenants.length, DASHBOARD_LIMITS.platformTenants)} of ${tenantsTotal ?? tenants.length}`}
          </span>
          <Link to="/platform/tenants" className="flex items-center gap-1 hover:underline" style={{ color: '#60a5fa' }}>
            View all <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>

      {/* ── Suspend/activate confirmation ── */}
      <Modal
        isOpen={!!confirmTarget}
        onClose={() => !isMutating && setConfirmTarget(null)}
        title={confirmTarget?.action === 'suspend' ? 'Suspend tenant' : 'Activate tenant'}
        size="sm"
      >
        <div className="space-y-4">
          <p style={{ color: 'var(--pb-text-2)' }}>
            {confirmTarget?.action === 'suspend' ? (
              <>
                Suspend <strong style={{ color: 'var(--pb-text-1)' }}>{confirmTarget?.tenant?.name}</strong>?
                This ISP's staff and all {formatNumber(confirmTarget?.tenant?.client_count)} of their clients
                will lose access until reactivated.
              </>
            ) : (
              <>
                Activate <strong style={{ color: 'var(--pb-text-1)' }}>{confirmTarget?.tenant?.name}</strong>?
                Their staff and clients will regain access immediately.
              </>
            )}
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button onClick={() => setConfirmTarget(null)} disabled={isMutating} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleConfirmAction}
              disabled={isMutating}
              className={confirmTarget?.action === 'suspend' ? 'btn-danger' : 'btn-primary'}
            >
              {isMutating
                ? 'Please wait…'
                : confirmTarget?.action === 'suspend' ? 'Suspend tenant' : 'Activate tenant'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Tenant detail modal ── */}
      <Modal
        isOpen={showDetail}
        onClose={() => !detailLoading && setShowDetail(false)}
        title={detailTenant?.name}
        size="xl"
      >
        {detailLoading || !tenantDetail ? (
          <div className="py-10 flex justify-center"><Spinner size="lg" /></div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)' }}
                >
                  <Wifi size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: 'var(--pb-text-1)' }}>{tenantDetail.name}</p>
                  <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{tenantDetail.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={tenantStatusBadge(tenantDetail.status)}>{tenantDetail.status}</span>
                <span className="badge badge-info capitalize">{tenantDetail.plan || 'No plan'}</span>
              </div>
            </div>

            {/* Contact / company */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg p-3" style={{ background: 'var(--pb-raised)', border: '1px solid var(--pb-border)' }}>
                <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: 'var(--pb-text-3)' }}>
                  <Mail size={13} /> Contact
                </p>
                <p style={{ color: 'var(--pb-text-1)' }}>{tenantDetail.contact_email || '—'}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--pb-text-2)' }}>{tenantDetail.contact_phone || '—'}</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'var(--pb-raised)', border: '1px solid var(--pb-border)' }}>
                <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: 'var(--pb-text-3)' }}>
                  <MapPin size={13} /> Location
                </p>
                <p style={{ color: 'var(--pb-text-1)' }}>{tenantDetail.address || '—'}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--pb-text-2)' }}>
                  {tenantDetail.timezone} · {tenantDetail.currency}
                </p>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'var(--pb-raised)', border: '1px solid var(--pb-border)' }}>
                <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: 'var(--pb-text-3)' }}>
                  <Phone size={13} /> Billing
                </p>
                <p style={{ color: 'var(--pb-text-1)' }}>{tenantDetail.billing_email || '—'}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--pb-text-2)' }}>
                  Tax: {tenantDetail.tax_rate ? `${tenantDetail.tax_rate}%` : '—'} · {tenantDetail.tax_name || ''}
                </p>
              </div>
            </div>

            {/* Subscription / quotas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>Plan Price</p>
                <p className="font-semibold" style={{ color: 'var(--pb-text-1)' }}>{formatKES(tenantDetail.monthly_price)}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>Plan Expires</p>
                <p className="font-semibold" style={{ color: 'var(--pb-text-1)' }}>
                  {tenantDetail.plan_expires_at ? formatDate(tenantDetail.plan_expires_at) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>Trial Ends</p>
                <p className="font-semibold" style={{ color: 'var(--pb-text-1)' }}>
                  {tenantDetail.trial_ends_at ? formatDate(tenantDetail.trial_ends_at) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>Joined</p>
                <p className="font-semibold" style={{ color: 'var(--pb-text-1)' }}>{formatDate(tenantDetail.created_at)}</p>
              </div>
            </div>

            {/* Quota usage */}
            <div>
              <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--pb-text-1)' }}>Quota Usage</h4>
              <div className="space-y-3">
                <QuotaBar label="Clients" used={tenantDetail.client_count} limit={tenantDetail.max_clients} />
                <QuotaBar label="Storage" used={tenantDetail.storage_used_mb} limit={tenantDetail.storage_quota_gb ? tenantDetail.storage_quota_gb * 1024 : 0} unit="MB" />
                <QuotaBar label="API Calls" used={tenantDetail.api_calls_used} limit={tenantDetail.api_calls_per_month} />
                <QuotaBar label="Max Users" used={null} limit={tenantDetail.max_users} />
              </div>
            </div>

            {/* Recent payments */}
            <div>
              <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--pb-text-1)' }}>
                Recent Payments · {formatKES(tenantDetail.revenue)} total
              </h4>
              {tenantDetail.recent_payments?.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>No payments recorded</p>
              ) : (
                <Table
                  columns={[
                    { key: 'amount', label: 'Amount', render: (p) => <span style={{ color: 'var(--pb-text-1)' }}>{formatKES(p.amount)}</span> },
                    { key: 'method', label: 'Method', render: (p) => <span className="capitalize" style={{ color: 'var(--pb-text-2)' }}>{p.method}</span> },
                    { key: 'created_at', label: 'Date', render: (p) => <span style={{ color: 'var(--pb-text-3)' }}>{formatDate(p.created_at)}</span> },
                  ]}
                  data={tenantDetail.recent_payments || []}
                />
              )}
            </div>

            <button onClick={() => setShowDetail(false)} className="btn-secondary w-full">
              <ArrowLeft size={15} className="mr-2" /> Close
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ── Quota bar helper ─────────────────────────────────────────────────────
function QuotaBar({ label, used, limit, unit = '' }) {
  const pct = limit > 0 ? ((used ?? 0) / limit) * 100 : 0
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: 'var(--pb-text-2)' }}>{label}</span>
        <span style={{ color: 'var(--pb-text-3)' }}>
          {used !== null && used !== undefined ? `${formatNumber(used)} / ${formatNumber(limit)} ${unit}` : `${formatNumber(limit)} ${unit}`}
        </span>
      </div>
      <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: pct > 90 ? '#f87171' : pct > 70 ? '#fbbf24' : '#34d399',
          }}
        />
      </div>
    </div>
  )
}
