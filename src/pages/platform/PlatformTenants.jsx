import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  getPlatformTenants,
  createTenant,
  updateTenant,
  suspendTenant,
  activateTenant,
  archiveTenant,
} from '../../api/platform.api'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Modal from '../../components/common/Modal'
import { formatKES, formatNumber } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import { tenantStatusBadge } from '../../utils/statusColors'
import { Search, Plus, Eye, UserX, UserCheck, Archive, Wifi } from 'lucide-react'

const PLANS = ['starter', 'professional', 'enterprise']
const STATUSES = ['trial', 'active', 'suspended', 'archived']
const PER_PAGE = 20

export default function PlatformTenants() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  // Server-side state — all synced to URL for deep-linkability.
  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || '')
  const [sort, setSort] = useState({ key: searchParams.get('sort') || 'created_at', direction: searchParams.get('direction') || 'desc' })

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [archiveConfirm, setArchiveConfirm] = useState('')

  // Debounce search → avoids a query keystroke-per-keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1) // reset to first page on new search
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  // Sync state → URL (so reloads and deep links preserve filters).
  useEffect(() => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page)
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (statusFilter) params.set('status', statusFilter)
    if (sort.key !== 'created_at') params.set('sort', sort.key)
    if (sort.direction !== 'desc') params.set('direction', sort.direction)
    setSearchParams(params, { replace: true })
  }, [page, debouncedSearch, statusFilter, sort, setSearchParams])

  // ── Data ────────────────────────────────────────────────────────────────
  const { data: tenantsData, isLoading } = useQuery({
    queryKey: ['platform-tenants', 'paginated', page, PER_PAGE, debouncedSearch, statusFilter, sort.key, sort.direction],
    queryFn: () => getPlatformTenants({
      page,
      per_page: PER_PAGE,
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
      sort: sort.key,
      direction: sort.direction,
    }),
    keepPreviousData: true,
  })

  const tenants = useMemo(() => {
    return Array.isArray(tenantsData?.data) ? tenantsData.data : []
  }, [tenantsData])

  const meta = tenantsData?.meta || {}

  // ── Mutations ───────────────────────────────────────────────────────────
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['platform-tenants'] })
    queryClient.invalidateQueries({ queryKey: ['platform-stats'] })
  }

  const createMutation = useMutation({
    mutationFn: createTenant,
    onSuccess: (res) => {
      toast.success('Tenant created')
      setCreateOpen(false)
      refresh()
      const id = res?.data?.data?.id
      if (id) navigate(`/platform/tenants/${id}`)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create tenant'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateTenant(id, payload),
    onSuccess: () => { toast.success('Tenant updated'); setEditTarget(null); refresh() },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update tenant'),
  })

  const suspendMutation = useMutation({
    mutationFn: suspendTenant,
    onSuccess: () => { toast.success('Tenant suspended'); setConfirmTarget(null); refresh() },
    onError: () => toast.error('Failed to suspend tenant'),
  })

  const activateMutation = useMutation({
    mutationFn: activateTenant,
    onSuccess: () => { toast.success('Tenant activated'); setConfirmTarget(null); refresh() },
    onError: () => toast.error('Failed to activate tenant'),
  })

  const archiveMutation = useMutation({
    mutationFn: archiveTenant,
    onSuccess: () => {
      toast.success('Tenant archived')
      setArchiveTarget(null)
      setArchiveConfirm('')
      refresh()
    },
    onError: () => toast.error('Failed to archive tenant'),
  })

  const isMutating =
    suspendMutation.isPending || activateMutation.isPending ||
    archiveMutation.isPending || createMutation.isPending || updateMutation.isPending

  const handleConfirm = () => {
    if (!confirmTarget) return
    const { tenant, action } = confirmTarget
    if (action === 'suspend') suspendMutation.mutate(tenant.id)
    else activateMutation.mutate(tenant.id)
  }

  const handleArchive = () => {
    if (!archiveTarget) return
    if (archiveConfirm === archiveTarget.name) {
      archiveMutation.mutate(archiveTarget.id)
    } else {
      toast.error('Typed name does not match')
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Tenant',
      sortable: true,
      render: (t) => (
        <button
          onClick={() => navigate(`/platform/tenants/${t.id}`)}
          className="text-left hover:text-purple-300 transition-colors"
        >
          <p className="font-medium" style={{ color: 'var(--pb-text-1)' }}>{t.name}</p>
          <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{t.slug}</p>
        </button>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (t) => <span className={tenantStatusBadge(t.status)}>{t.status}</span>,
    },
    {
      key: 'plan',
      label: 'Plan',
      sortable: true,
      render: (t) => (
        <span className="capitalize" style={{ color: 'var(--pb-text-2)' }}>{t.plan || '—'}</span>
      ),
    },
    {
      key: 'client_count',
      label: 'Clients',
      sortable: true,
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
      sortable: true,
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
            onClick={() => navigate(`/platform/tenants/${t.id}`)}
            className="p-1.5 rounded-lg transition-colors"
            title="Open tenant"
            style={{ color: '#60a5fa' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.1)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => setEditTarget(t)}
            className="p-1.5 rounded-lg transition-colors"
            title="Edit tenant"
            style={{ color: '#a78bfa' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.1)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Wifi size={15} />
          </button>
          {t.status === 'suspended' ? (
            <button
              onClick={() => setConfirmTarget({ tenant: t, action: 'activate' })}
              className="p-1.5 rounded-lg transition-colors"
              title="Activate"
              style={{ color: '#34d399' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.1)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <UserCheck size={15} />
            </button>
          ) : t.status !== 'archived' ? (
            <button
              onClick={() => setConfirmTarget({ tenant: t, action: 'suspend' })}
              className="p-1.5 rounded-lg transition-colors"
              title="Suspend"
              style={{ color: '#fbbf24' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(245,158,11,0.1)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <UserX size={15} />
            </button>
          ) : null}
          {t.status !== 'archived' && (
            <button
              onClick={() => { setArchiveTarget(t); setArchiveConfirm('') }}
              className="p-1.5 rounded-lg transition-colors"
              title="Archive (destructive)"
              style={{ color: '#f87171' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Archive size={15} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--pb-text-1)' }}>
            All Tenants
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pb-text-2)' }}>
            Every ISP running on the PrimeBill ISP Platform — status, plan, quota usage and lifecycle.
          </p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary">
          <Plus size={15} className="mr-1.5" /> New Tenant
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--pb-text-3)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or slug..."
              className="input pl-9 w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="input w-auto"
          >
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <Table
          columns={columns}
          data={tenants}
          loading={isLoading}
          sort={sort}
          onSort={setSort}
          emptyMessage={search || statusFilter ? 'No tenants match your filters' : 'No tenants yet'}
        />
        {meta?.last_page > 1 && <Pagination meta={meta} onPageChange={setPage} />}
      </div>

      {/* ── Create Tenant modal ── */}
      <Modal isOpen={createOpen} onClose={() => !createMutation.isPending && setCreateOpen(false)} title="Create Tenant" size="lg">
        <CreateTenantForm
          plans={PLANS}
          submitting={createMutation.isPending}
          onSubmit={(payload) => createMutation.mutate(payload)}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      {/* ── Edit Tenant modal ── */}
      <Modal isOpen={!!editTarget} onClose={() => !updateMutation.isPending && setEditTarget(null)} title={`Edit ${editTarget?.name}`} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--pb-text-3)' }}>
              Name
            </label>
            <input
              defaultValue={editTarget?.name}
              className="input w-full"
              placeholder="Tenant name"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--pb-text-3)' }}>
              Contact Email
            </label>
            <input
              defaultValue={editTarget?.contact_email}
              type="email"
              className="input w-full"
              placeholder="contact@isp.com"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setEditTarget(null)} disabled={updateMutation.isPending} className="btn-secondary">Cancel</button>
            <button
              onClick={(e) => {
                const formEls = e.currentTarget.form?.elements || []
                const name = formEls[0]?.value ?? editTarget?.name
                const email = formEls[1]?.value ?? editTarget?.contact_email
                updateMutation.mutate({ id: editTarget.id, payload: { name, contact_email: email } })
              }}
              disabled={updateMutation.isPending}
              className="btn-primary"
            >
              {updateMutation.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Suspend/activate confirm ── */}
      <Modal
        isOpen={!!confirmTarget}
        onClose={() => !isMutating && setConfirmTarget(null)}
        title={confirmTarget?.action === 'suspend' ? 'Suspend tenant' : 'Activate tenant'}
        size="sm"
      >
        <div className="space-y-4">
          <p style={{ color: 'var(--pb-text-2)' }}>
            {confirmTarget?.action === 'suspend' ? (
              <>Suspend <strong style={{ color: 'var(--pb-text-1)' }}>{confirmTarget?.tenant?.name}</strong>? This ISP's staff and clients will lose access until reactivated.</>
            ) : (
              <>Activate <strong style={{ color: 'var(--pb-text-1)' }}>{confirmTarget?.tenant?.name}</strong>? Their staff and clients will regain access immediately.</>
            )}
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setConfirmTarget(null)} disabled={isMutating} className="btn-secondary">Cancel</button>
            <button
              onClick={handleConfirm}
              disabled={isMutating}
              className={confirmTarget?.action === 'suspend' ? 'btn-danger' : 'btn-primary'}
            >
              {isMutating ? 'Please wait…' : confirmTarget?.action === 'suspend' ? 'Suspend tenant' : 'Activate tenant'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Archive (typed destructive) ── */}
      <Modal isOpen={!!archiveTarget} onClose={() => !archiveMutation.isPending && setArchiveTarget(null)} title="Archive tenant" size="sm">
        <div className="space-y-4">
          <p style={{ color: 'var(--pb-text-2)' }}>
            This is a <strong style={{ color: '#f87171' }}>destructive</strong> action. {archiveTarget?.name} and all its data will be
            archived and its staff will lose access. Type the tenant name to confirm.
          </p>
          <p className="text-sm font-semibold" style={{ color: 'var(--pb-text-1)' }}>
            Type <span className="text-purple-300">{archiveTarget?.name}</span> to confirm
          </p>
          <input
            value={archiveConfirm}
            onChange={(e) => setArchiveConfirm(e.target.value)}
            className="input w-full"
            placeholder={archiveTarget?.name}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setArchiveTarget(null)} disabled={archiveMutation.isPending} className="btn-secondary">Cancel</button>
            <button
              onClick={handleArchive}
              disabled={archiveMutation.isPending || archiveConfirm !== archiveTarget?.name}
              className="btn-danger"
            >
              {archiveMutation.isPending ? 'Archiving…' : 'Archive tenant'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── Create Tenant form ─────────────────────────────────────────────────────
function CreateTenantForm({ plans, submitting, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    plan: 'starter',
    billing_cycle: 'monthly',
    trial_days: 14,
    timezone: 'Africa/Nairobi',
    currency: 'KES',
    contact_email: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    admin_password_confirmation: '',
  })

  const updateField = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--pb-text-3)' }}>
            Tenant Name *
          </label>
          <input value={form.name} onChange={updateField('name')} className="input w-full" placeholder="e.g. Acme ISP" required />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--pb-text-3)' }}>
            Plan
          </label>
          <select value={form.plan} onChange={updateField('plan')} className="input w-full">
            {plans.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--pb-text-3)' }}>
            Billing Cycle
          </label>
          <select value={form.billing_cycle} onChange={updateField('billing_cycle')} className="input w-full">
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--pb-text-3)' }}>
            Trial Days
          </label>
          <input value={form.trial_days} onChange={updateField('trial_days')} type="number" min="0" max="90" className="input w-full" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--pb-text-3)' }}>
            Timezone
          </label>
          <input value={form.timezone} onChange={updateField('timezone')} className="input w-full" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--pb-text-3)' }}>
            Currency
          </label>
          <input value={form.currency} onChange={updateField('currency')} className="input w-full" maxLength={3} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--pb-text-3)' }}>
            Contact Email
          </label>
          <input value={form.contact_email} onChange={updateField('contact_email')} type="email" className="input w-full" placeholder="info@isp.com" />
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--pb-border)' }} className="pt-4">
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--pb-text-1)' }}>
          Initial Administrator
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--pb-text-3)' }}>
              Admin Name
            </label>
            <input value={form.admin_name} onChange={updateField('admin_name')} className="input w-full" placeholder="Tenant Admin" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--pb-text-3)' }}>
              Admin Email
            </label>
            <input value={form.admin_email} onChange={updateField('admin_email')} type="email" className="input w-full" placeholder="admin@isp.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--pb-text-3)' }}>
              Admin Password
            </label>
            <input value={form.admin_password} onChange={updateField('admin_password')} type="password" className="input w-full" placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--pb-text-3)' }}>
              Confirm Password
            </label>
            <input value={form.admin_password_confirmation} onChange={updateField('admin_password_confirmation')} type="password" className="input w-full" placeholder="••••••••" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} disabled={submitting} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Creating…' : 'Create Tenant'}
        </button>
      </div>
    </form>
  )
}

