import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  getPlatformStats,
  getPlatformTenants,
  suspendTenant,
  activateTenant,
} from '../../api/platform.api'
import Table from '../../components/common/Table'
import Modal from '../../components/common/Modal'
import StatCard from '../../components/dashboard/StatCard'
import Spinner from '../../components/common/Spinner'
import { formatKES, formatNumber } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import { tenantStatusBadge } from '../../utils/statusColors'
import {
  Globe, Building2, Users, DollarSign, AlertCircle,
  Search, UserX, UserCheck, ShieldAlert,
} from 'lucide-react'

export default function PlatformDashboard() {
  const queryClient = useQueryClient()
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [confirmTarget, setConfirmTarget] = useState(null) // { tenant, action: 'suspend' | 'activate' }

  // ── Data ────────────────────────────────────────────────────────────────
  // No 'tenant' or 'permission' middleware on these — the backend gates
  // everything through platform_admin (users.is_platform_admin). A 403 here
  // means the flag was revoked server-side after this page already loaded;
  // the ProtectedRoute guard covers the normal entry path.
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => getPlatformStats().then(r => r.data.data),
    refetchInterval: 60000,
  })

  const { data: tenantsData, isLoading: tenantsLoading, isFetching: tenantsFetching } = useQuery({
    queryKey: ['platform-tenants'],
    queryFn: () => getPlatformTenants().then(r => r.data.data),
    refetchInterval: 60000,
  })

  // ── Mutations ───────────────────────────────────────────────────────────
  const suspendMutation = useMutation({
    mutationFn: suspendTenant,
    onSuccess: (_, tenantId) => {
      const tenant = (tenantsData || []).find(t => t.id === tenantId)
      toast.success(`${tenant?.name ?? 'Tenant'} suspended`)
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] })
      queryClient.invalidateQueries({ queryKey: ['platform-stats'] })
      setConfirmTarget(null)
    },
    onError: () => {
      toast.error('Failed to suspend tenant')
      setConfirmTarget(null)
    },
  })

  const activateMutation = useMutation({
    mutationFn: activateTenant,
    onSuccess: (_, tenantId) => {
      const tenant = (tenantsData || []).find(t => t.id === tenantId)
      toast.success(`${tenant?.name ?? 'Tenant'} activated`)
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] })
      queryClient.invalidateQueries({ queryKey: ['platform-stats'] })
      setConfirmTarget(null)
    },
    onError: () => {
      toast.error('Failed to activate tenant')
      setConfirmTarget(null)
    },
  })

  const isMutating = suspendMutation.isPending || activateMutation.isPending

  // ── Client-side filtering ──────────────────────────────────────────────
  // The /platform/tenants endpoint returns every tenant unpaginated — the
  // platform is expected to have dozens to low hundreds of ISPs, not the
  // volume that would need server-side pagination. Filtering client-side
  // keeps the tenant list snappy with no extra round-trips.
  const filteredTenants = useMemo(() => {
    const list = Array.isArray(tenantsData) ? tenantsData : []
    const term = search.trim().toLowerCase()

    return list.filter(t => {
      const matchesSearch = !term
        || t.name.toLowerCase().includes(term)
        || t.slug.toLowerCase().includes(term)
      const matchesStatus = !statusFilter || t.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [tenantsData, search, statusFilter])

  const handleConfirmAction = () => {
    if (!confirmTarget) return
    const { tenant, action } = confirmTarget
    if (action === 'suspend') {
      suspendMutation.mutate(tenant.id)
    } else {
      activateMutation.mutate(tenant.id)
    }
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
        <span className="capitalize" style={{ color: 'var(--pb-text-2)' }}>{t.plan}</span>
      ),
    },
    {
      key: 'client_count',
      label: 'Clients',
      render: (t) => (
        <span style={{ color: 'var(--pb-text-2)' }}>{formatNumber(t.client_count)}</span>
      ),
    },
    {
      key: 'revenue',
      label: 'Revenue',
      render: (t) => (
        <span className="font-medium" style={{ color: 'var(--pb-text-1)' }}>
          {formatKES(t.revenue)}
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

      {/* ── Platform banner ──────────────────────────────────────────────
          Deliberately distinct from every other page in the app — a violet
          accent bar signals "you are outside your tenant" at a glance. This
          is the one screen in PrimeBill that shows data across every ISP. */}
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
            Cross-tenant view — every ISP running on PrimeBill, not just your own workspace.
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

      {/* ── Stats cards ── */}
      {statsLoading ? (
        <div className="py-10"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Tenants"
            value={formatNumber(statsData?.tenants?.total)}
            subtitle={`${statsData?.tenants?.active ?? 0} active · ${statsData?.tenants?.trial ?? 0} trial · ${statsData?.tenants?.suspended ?? 0} suspended`}
            icon={Building2}
            color="purple"
          />
          <StatCard
            title="Total Clients"
            value={formatNumber(statsData?.total_clients)}
            subtitle="Across every tenant"
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Platform Revenue"
            value={formatKES(statsData?.total_platform_revenue)}
            subtitle="Completed payments, all tenants"
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Outstanding Invoices"
            value={formatKES(statsData?.outstanding_invoices)}
            subtitle="Pending & overdue, all tenants"
            icon={AlertCircle}
            color="orange"
          />
        </div>
      )}

      {/* ── Tenant table ── */}
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
                onChange={(e) => setSearch(e.target.value)}
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

          <p className="text-xs" style={{ color: 'var(--pb-text-3)', opacity: tenantsFetching ? 1 : 0, transition: 'opacity 0.2s' }}>
            Refreshing…
          </p>
        </div>

        <Table
          columns={columns}
          data={filteredTenants}
          loading={tenantsLoading}
          emptyMessage={search || statusFilter ? 'No tenants match your filters' : 'No tenants yet'}
        />
      </div>

      {/* ── Suspend/activate confirmation ──────────────────────────────
          Suspending a tenant suspends an entire ISP's operations for every
          one of their clients — deliberately requires an explicit confirm
          step, unlike the single-client suspend/activate buttons elsewhere
          in the app which act immediately on click. */}
      <Modal
        isOpen={!!confirmTarget}
        onClose={() => !isMutating && setConfirmTarget(null)}
        title={confirmTarget?.action === 'suspend' ? 'Suspend tenant' : 'Activate tenant'}
        size="sm"
      >
        <div className="p-6 space-y-4">
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
            <button
              onClick={() => setConfirmTarget(null)}
              disabled={isMutating}
              className="btn-secondary"
            >
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
    </div>
  )
}