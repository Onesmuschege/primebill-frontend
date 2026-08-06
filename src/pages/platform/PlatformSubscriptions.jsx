import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  getPlatformSubscriptions,
  getSubscriptionStats,
  getPlatformPlans,
  upgradeSubscription,
  suspendSubscription,
  resumeSubscription,
  cancelSubscription,
} from '../../api/platform.api'
import Table from '../../components/common/Table'
import Modal from '../../components/common/Modal'
import StatCard from '../../components/dashboard/StatCard'
import Spinner from '../../components/common/Spinner'
import { formatKES } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import {
  Users, CheckCircle, Clock, DollarSign, Search,
  Eye, ArrowLeft, TrendingUp, PauseCircle,
  PlayCircle, XCircle,
} from 'lucide-react'

const STATUS_COLORS = {
  trial:   { fg: '#60a5fa', bg: 'rgba(37,99,235,0.12)' },
  active:  { fg: '#34d399', bg: 'rgba(16,185,129,0.12)' },
  past_due:{ fg: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
  suspended:{ fg: '#f87171', bg: 'rgba(239,68,68,0.12)' },
  cancelled:{ fg: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  expired: { fg: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
}

function statusBadge(status) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.cancelled
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
      style={{ color: s.fg, background: s.bg }}
    >
      {status?.replace('_', ' ') || '—'}
    </span>
  )
}

export default function PlatformSubscriptions() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  // ── Data ────────────────────────────────────────────────────────────────
  const { data: subsData, isLoading } = useQuery({
    queryKey: ['platform-subscriptions'],
    queryFn: () => getPlatformSubscriptions().then(r => r.data.data),
    refetchInterval: 60000,
  })

  const { data: stats } = useQuery({
    queryKey: ['subscription-stats'],
    queryFn: () => getSubscriptionStats().then(r => r.data.data),
    refetchInterval: 60000,
  })

  const { data: plans } = useQuery({
    queryKey: ['platform-plans'],
    queryFn: () => getPlatformPlans().then(r => r.data.data),
  })

  const subs = Array.isArray(subsData) ? subsData : []
  const planList = Array.isArray(plans) ? plans : []

  // ── Mutations ───────────────────────────────────────────────────────────
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['platform-subscriptions'] })
    queryClient.invalidateQueries({ queryKey: ['subscription-stats'] })
  }

  const suspendMutation = useMutation({
    mutationFn: suspendSubscription,
    onSuccess: () => { toast.success('Subscription suspended'); refresh(); setShowDetail(false) },
    onError: () => toast.error('Failed to suspend subscription'),
  })
  const resumeMutation = useMutation({
    mutationFn: resumeSubscription,
    onSuccess: () => { toast.success('Subscription resumed'); refresh(); setShowDetail(false) },
    onError: () => toast.error('Failed to resume subscription'),
  })
  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => { toast.success('Subscription cancelled'); refresh(); setShowDetail(false) },
    onError: () => toast.error('Failed to cancel subscription'),
  })
  const upgradeMutation = useMutation({
    mutationFn: ({ id, payload }) => upgradeSubscription(id, payload),
    onSuccess: () => { toast.success('Plan upgraded'); refresh(); setUpgradeOpen(false); setShowDetail(false) },
    onError: () => toast.error('Failed to upgrade plan'),
  })

  const isMutating =
    suspendMutation.isPending || resumeMutation.isPending ||
    cancelMutation.isPending || upgradeMutation.isPending

  // ── Filtering ──────────────────────────────────────────────────────────
  const filtered = subs.filter(s => {
    const term = search.trim().toLowerCase()
    const matchesSearch = !term ||
      (s.tenant?.name || '').toLowerCase().includes(term) ||
      (s.tenant?.slug || '').toLowerCase().includes(term) ||
      (s.plan?.name || '').toLowerCase().includes(term)
    const matchesStatus = !statusFilter || s.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const columns = [
    {
      key: 'tenant',
      label: 'Tenant',
      render: (s) => (
        <div>
          <p className="font-medium" style={{ color: 'var(--pb-text-1)' }}>{s.tenant?.name}</p>
          <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{s.tenant?.slug}</p>
        </div>
      ),
    },
    {
      key: 'plan',
      label: 'Plan',
      render: (s) => (
        <div>
          <p className="font-medium" style={{ color: 'var(--pb-text-1)' }}>{s.plan?.name}</p>
          <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{s.plan?.slug}</p>
        </div>
      ),
    },
    { key: 'status', label: 'Status', render: (s) => statusBadge(s.status) },
    {
      key: 'billing_cycle',
      label: 'Billing',
      render: (s) => (
        <span
          className="px-2 py-0.5 rounded-full text-xs capitalize"
          style={{ color: '#a78bfa', background: 'rgba(139,92,246,0.12)' }}
        >
          {s.billing_cycle || 'monthly'}
        </span>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      render: (s) => (
        <span className="font-medium" style={{ color: 'var(--pb-text-1)' }}>{formatKES(s.price)}</span>
      ),
    },
    {
      key: 'ends_at',
      label: 'Renews',
      render: (s) => (
        <span style={{ color: 'var(--pb-text-3)' }}>{s.ends_at ? formatDate(s.ends_at) : '—'}</span>
      ),
    },
    {
      key: 'usage',
      label: 'Clients',
      render: (s) => {
        const used = s.usage?.clients || 0
        const limit = s.plan?.limits?.max_clients || 0
        return (
          <div className="min-w-[90px]">
            <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(limit > 0 ? (used / limit) * 100 : 0, 100)}%`,
                  background: limit > 0 && used / limit > 0.9 ? '#f87171' : '#a78bfa',
                }}
              />
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--pb-text-3)' }}>
              {used} / {limit}
            </div>
          </div>
        )
      },
    },
    {
      key: 'actions',
      label: '',
      render: (s) => (
        <button
          onClick={() => { setSelected(s); setShowDetail(true) }}
          className="p-1.5 rounded-lg transition-colors"
          title="View subscription"
          style={{ color: '#60a5fa' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.1)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Eye size={15} />
        </button>
      ),
    },
  ]

return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--pb-text-1)' }}>
            Subscription Management
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pb-text-2)' }}>
            Manage every ISP tenant's SaaS plan and billing across the platform.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Subscriptions"
          value={stats?.total_subscriptions ?? 0}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Active"
          value={stats?.active_subscriptions ?? 0}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Trial"
          value={stats?.trial_subscriptions ?? 0}
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Monthly Recurring Revenue"
          value={formatKES(stats?.mrr ?? 0)}
          subtitle={`Annual ${formatKES(stats?.arr ?? 0)}`}
          icon={DollarSign}
          color="cyan"
        />
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--pb-text-3)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tenant or plan..."
              className="input pl-9 w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="">All Status</option>
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="past_due">Past Due</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <Table
          columns={columns}
          data={filtered}
          loading={isLoading}
          emptyMessage={search || statusFilter ? 'No subscriptions match your filters' : 'No subscriptions yet'}
        />
      </div>

      {/* Detail modal */}
      <Modal isOpen={showDetail} onClose={() => !isMutating && setShowDetail(false)} title="Subscription Details" size="xl">
        {!selected ? (
          <div className="py-10 flex justify-center"><Spinner size="lg" /></div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-lg font-bold" style={{ color: 'var(--pb-text-1)' }}>
                  {selected.tenant?.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{selected.tenant?.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(selected.status)}
                <span className="px-2 py-0.5 rounded-full text-xs capitalize"
                  style={{ color: '#a78bfa', background: 'rgba(139,92,246,0.12)' }}>
                  {selected.billing_cycle}
                </span>
              </div>
            </div>

            {/* Plan / price / renewal */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="rounded-lg p-3" style={{ background: 'var(--pb-raised)', border: '1px solid var(--pb-border)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--pb-text-3)' }}>Current Plan</p>
                <p className="font-semibold" style={{ color: 'var(--pb-text-1)' }}>{selected.plan?.name}</p>
                <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{selected.plan?.slug}</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'var(--pb-raised)', border: '1px solid var(--pb-border)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--pb-text-3)' }}>Price</p>
                <p className="font-semibold text-lg" style={{ color: 'var(--pb-text-1)' }}>{formatKES(selected.price)}</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'var(--pb-raised)', border: '1px solid var(--pb-border)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--pb-text-3)' }}>Started</p>
                <p className="font-semibold" style={{ color: 'var(--pb-text-1)' }}>
                  {selected.created_at ? formatDate(selected.created_at) : '—'}
                </p>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'var(--pb-raised)', border: '1px solid var(--pb-border)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--pb-text-3)' }}>Renews</p>
                <p className="font-semibold" style={{ color: 'var(--pb-text-1)' }}>
                  {selected.ends_at ? formatDate(selected.ends_at) : '—'}
                </p>
              </div>
            </div>

            {/* Usage */}
            <div>
              <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--pb-text-1)' }}>Resource Usage</h4>
              <div className="space-y-3">
                <UsageBar label="Clients" used={selected.usage?.clients || 0} limit={selected.plan?.limits?.max_clients || 0} />
                <UsageBar label="Users" used={selected.usage?.users || 0} limit={selected.plan?.limits?.max_users || 0} />
                <UsageBar label="Routers" used={selected.usage?.routers || 0} limit={selected.plan?.limits?.max_routers || 0} />
                <UsageBar label="Storage" used={selected.usage?.storage_used_mb || 0} limit={(selected.plan?.limits?.storage_quota_gb || 0) * 1024} unit="MB" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-3" style={{ borderTop: '1px solid var(--pb-border)' }}>
              <button onClick={() => setUpgradeOpen(true)} disabled={isMutating} className="btn-primary">
                <TrendingUp size={15} className="mr-1.5" /> Change Plan
              </button>
              {selected.status === 'active' && (
                <button onClick={() => suspendMutation.mutate(selected.id)} disabled={isMutating} className="btn-secondary">
                  <PauseCircle size={15} className="mr-1.5" /> Suspend
                </button>
              )}
              {selected.status === 'suspended' && (
                <button onClick={() => resumeMutation.mutate(selected.id)} disabled={isMutating} className="btn-secondary">
                  <PlayCircle size={15} className="mr-1.5" /> Resume
                </button>
              )}
              {selected.status !== 'cancelled' && (
                <button onClick={() => cancelMutation.mutate(selected.id)} disabled={isMutating} className="btn-danger">
                  <XCircle size={15} className="mr-1.5" /> Cancel
                </button>
              )}
              <button onClick={() => setShowDetail(false)} disabled={isMutating} className="btn-secondary ml-auto">
                <ArrowLeft size={15} className="mr-1.5" /> Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Upgrade modal */}
      <Modal isOpen={upgradeOpen} onClose={() => !upgradeMutation.isPending && setUpgradeOpen(false)} title="Change Plan" size="md">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>
            Select a new plan for <strong style={{ color: 'var(--pb-text-1)' }}>{selected?.tenant?.name}</strong>.
          </p>
          <div className="space-y-2">
            {planList.map((plan) => (
              <button
                key={plan.id}
                onClick={() => upgradeMutation.mutate({ id: selected.id, payload: { plan_id: plan.id } })}
                disabled={upgradeMutation.isPending}
                className="w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors disabled:opacity-50"
                style={{
                  background: 'var(--pb-raised)',
                  border: `1px solid ${selected?.plan?.id === plan.id ? 'var(--pb-primary)' : 'var(--pb-border)'}`,
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--pb-primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = selected?.plan?.id === plan.id ? 'var(--pb-primary)' : 'var(--pb-border)'}
              >
                <div>
                  <p className="font-medium" style={{ color: 'var(--pb-text-1)' }}>{plan.name}</p>
                  <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
                    {plan.max_clients} clients · {plan.max_users} users · {plan.max_routers} routers
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold" style={{ color: 'var(--pb-text-1)' }}>{formatKES(plan.price_monthly)}</p>
                  <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>/month</p>
                </div>
              </button>
            ))}
            {planList.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>No plans available</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setUpgradeOpen(false)} disabled={upgradeMutation.isPending} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function UsageBar({ label, used, limit, unit = '' }) {
  const pct = limit > 0 ? (used / limit) * 100 : 0
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: 'var(--pb-text-2)' }}>{label}</span>
        <span style={{ color: 'var(--pb-text-3)' }}>{used} / {limit} {unit}</span>
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
