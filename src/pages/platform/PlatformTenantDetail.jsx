import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import {
  getPlatformTenant,
  configureCompany,
  configureBranding,
  configureLocalization,
  assignPlan,
  updateQuotas,
  updateFeatureFlags,
  addFeatureFlag,
  removeFeatureFlag,
  createTenantAdmin,
  suspendTenant,
  activateTenant,
  archiveTenant,
} from '../../api/platform.api'
import Table from '../../components/common/Table'
import Modal from '../../components/common/Modal'
import Spinner from '../../components/common/Spinner'
import { formatKES, formatNumber } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import { tenantStatusBadge } from '../../utils/statusColors'
import {
  ArrowLeft, Mail, MapPin, Globe, CreditCard, Shield,
  UserCog, Archive, LogIn, CheckCircle2, PauseCircle, KeyRound,
  UserPlus, Wifi, Trash2, X,
} from 'lucide-react'

const TABS = [
  { key: 'overview',  label: 'Overview',   icon: Globe },
  { key: 'config',    label: 'Configuration', icon: Wifi },
  { key: 'quotas',    label: 'Quotas & Features', icon: KeyRound },
  { key: 'admins',    label: 'Administrators', icon: UserCog },
  { key: 'lifecycle', label: 'Lifecycle',  icon: Archive },
]

// ── Small shared UI ────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars -- used in JSX below
function InfoCard({ icon: Icon, title, lines }) {
  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--pb-raised)', border: '1px solid var(--pb-border)' }}>
      <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: 'var(--pb-text-3)' }}>
        <Icon size={13} /> {title}
      </p>
      <p style={{ color: 'var(--pb-text-1)' }}>{lines[0]}</p>
      {lines[1] && <p className="text-xs mt-1" style={{ color: 'var(--pb-text-2)' }}>{lines[1]}</p>}
    </div>
  )
}

function UsageBar({ label, used, limit }) {
  const pct = limit > 0 ? Math.round((used / limit) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: 'var(--pb-text-2)' }}>{label}</span>
        <span style={{ color: 'var(--pb-text-3)' }}>
          {formatNumber(used ?? 0)} / {formatNumber(limit ?? 0)}
        </span>
      </div>
      <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden">
        <div className="h-full rounded-full" style={{
          width: `${Math.min(pct, 100)}%`,
          background: pct > 90 ? '#f87171' : pct > 70 ? '#fbbf24' : '#a78bfa',
        }} />
      </div>
    </div>
  )
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--pb-text-3)' }}>
        {label}
      </label>
      <input {...props} className="input w-full" />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function PlatformTenantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { startImpersonation } = useAuth()
  const [tab, setTab] = useState('overview')
  const [archiveTarget, setArchiveTarget] = useState(false)
  const [archiveConfirm, setArchiveConfirm] = useState('')
  const [adminOpen, setAdminOpen] = useState(false)
  const [impersonateOpen, setImpersonateOpen] = useState(false)
  const [impersonationMode, setImpersonationMode] = useState('view')
  const [impersonationReason, setImpersonationReason] = useState('')
  const [impersonating, setImpersonating] = useState(false)

  const { data: detail, isLoading } = useQuery({
    queryKey: ['platform-tenant-detail', id],
    queryFn: () => getPlatformTenant(id),
    enabled: !!id,
  })

const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['platform-tenant-detail', id] })
    queryClient.invalidateQueries({ queryKey: ['platform-tenants'] })
    queryClient.invalidateQueries({ queryKey: ['platform-stats'] })
  }

  // ── Mutations ──────────────────────────────────────────────────────────
  const companyMutation = useMutation({
    mutationFn: (payload) => configureCompany(id, payload),
    onSuccess: () => { toast.success('Company details updated'); refresh() },
    onError: () => toast.error('Failed to update company details'),
  })
  const brandingMutation = useMutation({
    mutationFn: (payload) => configureBranding(id, payload),
    onSuccess: () => { toast.success('Branding updated'); refresh() },
    onError: () => toast.error('Failed to update branding'),
  })
  const localizationMutation = useMutation({
    mutationFn: (payload) => configureLocalization(id, payload),
    onSuccess: () => { toast.success('Localization updated'); refresh() },
    onError: () => toast.error('Failed to update localization'),
  })
  const planMutation = useMutation({
    mutationFn: (payload) => assignPlan(id, payload),
    onSuccess: () => { toast.success('Plan assigned'); refresh() },
    onError: () => toast.error('Failed to assign plan'),
  })
  const quotasMutation = useMutation({
    mutationFn: (payload) => updateQuotas(id, payload),
    onSuccess: () => { toast.success('Quotas updated'); refresh() },
    onError: () => toast.error('Failed to update quotas'),
  })
  const featureMutation = useMutation({
    mutationFn: updateFeatureFlags,
    onSuccess: () => { toast.success('Feature flags updated'); refresh() },
    onError: () => toast.error('Failed to update feature flags'),
  })
  const addFeatureMutation = useMutation({
    mutationFn: addFeatureFlag,
    onSuccess: () => { toast.success('Feature added'); refresh() },
    onError: () => toast.error('Failed to add feature'),
  })
  const removeFeatureMutation = useMutation({
    mutationFn: removeFeatureFlag,
    onSuccess: () => { toast.success('Feature removed'); refresh() },
    onError: () => toast.error('Failed to remove feature'),
  })
  const adminMutation = useMutation({
    mutationFn: (payload) => createTenantAdmin(id, payload),
    onSuccess: () => { toast.success('Admin user created'); setAdminOpen(false); refresh() },
    onError: (err) => toast.error(err.response?.data?.errors?.email?.[0] || 'Failed to create admin user'),
  })
  const suspendMutation = useMutation({
    mutationFn: suspendTenant,
    onSuccess: () => { toast.success('Tenant suspended'); refresh() },
    onError: () => toast.error('Failed to suspend tenant'),
  })
  const activateMutation = useMutation({
    mutationFn: activateTenant,
    onSuccess: () => { toast.success('Tenant activated'); refresh() },
    onError: () => toast.error('Failed to activate tenant'),
  })
  const archiveMutation = useMutation({
    mutationFn: archiveTenant,
    onSuccess: () => { toast.success('Tenant archived'); setArchiveTarget(false); setArchiveConfirm(''); refresh() },
    onError: () => toast.error('Failed to archive tenant'),
  })

  if (isLoading || !detail) {
    return <div className="py-16 flex justify-center"><Spinner size="lg" /></div>
  }

  const handleArchive = () => {
    if (archiveConfirm === detail.name) archiveMutation.mutate(id)
    else toast.error('Typed name does not match')
  }

  const handleImpersonate = async () => {
    if (impersonationReason.trim().length < 10) {
      toast.error('A reason of at least 10 characters is required')
      return
    }
    setImpersonating(true)
    const res = await startImpersonation(Number(id), detail.name, impersonationReason.trim(), impersonationMode)
    setImpersonating(false)
    if (res.success) navigate('/dashboard', { replace: true })
  }

  const featureFlags = Array.isArray(detail.feature_flags) ? detail.feature_flags : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/platform/tenants')} className="btn-ghost p-2" aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold" style={{ color: 'var(--pb-text-1)' }}>{detail.name}</h2>
              <span className={tenantStatusBadge(detail.status)}>{detail.status}</span>
            </div>
            <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>{detail.slug}</p>
          </div>
        </div>
        <button onClick={() => setImpersonateOpen(true)} className="btn-primary">
          <LogIn size={15} className="mr-1.5" /> Impersonate
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(({ key, label, icon: Icon }) => ( // eslint-disable-line no-unused-vars
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            style={{
              color: tab === key ? '#a78bfa' : 'var(--pb-text-2)',
              background: tab === key ? 'rgba(139,92,246,0.12)' : 'var(--pb-raised)',
              border: `1px solid ${tab === key ? 'rgba(167,139,250,0.3)' : 'var(--pb-border)'}`,
            }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab detail={detail} />}
      {tab === 'config' && (
<ConfigTab
          detail={detail}
          companySubmitting={companyMutation.isPending}
          onCompany={companyMutation.mutate}
          brandingSubmitting={brandingMutation.isPending}
          onBranding={brandingMutation.mutate}
          localizationSubmitting={localizationMutation.isPending}
          onLocalization={localizationMutation.mutate}
          planSubmitting={planMutation.isPending}
          onPlan={planMutation.mutate}
        />
      )}
      {tab === 'quotas' && (
        <QuotasTab
          detail={detail}
          featureFlags={featureFlags}
          quotasSubmitting={quotasMutation.isPending}
          onQuotas={quotasMutation.mutate}
          onUpdateFlags={featureMutation.mutate}
          onAddFeature={addFeatureMutation.mutate}
          onRemoveFeature={removeFeatureMutation.mutate}
        />
      )}
      {tab === 'admins' && (
        <AdminsTab detail={detail} onOpen={() => setAdminOpen(true)} />
      )}
      {tab === 'lifecycle' && (
        <LifecycleTab
          detail={detail}
          onSuspend={suspendMutation.mutate}
          onActivate={activateMutation.mutate}
          onArchive={() => { setArchiveConfirm(''); setArchiveTarget(true) }}
          mutating={suspendMutation.isPending || activateMutation.isPending}
        />
      )}

      {/* ── Impersonation (reason + VIEW AS / ACT AS, audited) ── */}
      <Modal isOpen={impersonateOpen} onClose={() => !impersonating && setImpersonateOpen(false)} title="Impersonate tenant" size="md">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>
            You are about to enter <strong style={{ color: 'var(--pb-text-1)' }}>{detail.name}</strong> as its administrator.
            The reason and mode are recorded in the platform audit log, and the mode is shown in the session banner until you end it.
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--pb-text-3)' }}>
              Mode
            </label>
            <div className="space-y-2">
              <label
                className="flex items-start gap-2.5 p-3 rounded-lg cursor-pointer"
                style={{
                  background: 'var(--pb-raised)',
                  border: impersonationMode === 'view' ? '1px solid rgba(96,165,250,0.6)' : '1px solid var(--pb-border)',
                }}
              >
                <input type="radio" name="imp-mode" checked={impersonationMode === 'view'} onChange={() => setImpersonationMode('view')} className="mt-1" />
                <span>
                  <span className="block text-sm font-medium" style={{ color: 'var(--pb-text-1)' }}>
                    View as tenant <span className="text-xs font-normal" style={{ color: 'var(--pb-text-3)' }}>— inspection</span>
                  </span>
                  <span className="block text-xs mt-0.5" style={{ color: 'var(--pb-text-3)' }}>
                    Investigate the tenant's console without taking action on the ISP's behalf.
                  </span>
                </span>
              </label>
              <label
                className="flex items-start gap-2.5 p-3 rounded-lg cursor-pointer"
                style={{
                  background: 'var(--pb-raised)',
                  border: impersonationMode === 'act' ? '1px solid rgba(167,139,250,0.6)' : '1px solid var(--pb-border)',
                }}
              >
                <input type="radio" name="imp-mode" checked={impersonationMode === 'act'} onChange={() => setImpersonationMode('act')} className="mt-1" />
                <span>
                  <span className="block text-sm font-medium" style={{ color: 'var(--pb-text-1)' }}>
                    Act as tenant <span className="text-xs font-normal" style={{ color: 'var(--pb-text-3)' }}>— full authority</span>
                  </span>
                  <span className="block text-xs mt-0.5" style={{ color: 'var(--pb-text-3)' }}>
                    Operate the tenant console as this ISP's admin to resolve configuration or billing issues.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--pb-text-3)' }}>
              Reason <span className="normal-case font-normal">(required · min 10 characters)</span>
            </label>
            <textarea
              value={impersonationReason}
              onChange={(e) => setImpersonationReason(e.target.value)}
              rows={3}
              className="input w-full"
              placeholder="e.g. Investigating support ticket #4321"
            />
          </div>

          <p className="text-xs flex items-start gap-1.5" style={{ color: 'var(--pb-text-3)' }}>
            <Shield size={13} className="shrink-0 mt-0.5" />
            Session is audited (actor, tenant, reason, mode). End it from the banner when done.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setImpersonateOpen(false)} disabled={impersonating} className="btn-secondary">Cancel</button>
            <button
              onClick={handleImpersonate}
              disabled={impersonating || impersonationReason.trim().length < 10}
              className="btn-primary"
            >
              {impersonating ? 'Starting…' : impersonationMode === 'view' ? 'View tenant' : 'Act as tenant'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Create admin modal */}
      <Modal isOpen={adminOpen} onClose={() => !adminMutation.isPending && setAdminOpen(false)} title="Create tenant admin" size="md">
        <CreateAdminForm submitting={adminMutation.isPending} onSubmit={adminMutation.mutate} onCancel={() => setAdminOpen(false)} />
      </Modal>

      {/* Archive (typed destructive) */}
      <Modal isOpen={archiveTarget} onClose={() => !archiveMutation.isPending && setArchiveTarget(false)} title="Archive tenant" size="sm">
        <div className="space-y-4">
          <p style={{ color: 'var(--pb-text-2)' }}>
            This is a <strong style={{ color: '#f87171' }}>destructive</strong> action. {detail.name} and all its data will be
            archived. Type the tenant name to confirm.
          </p>
          <p className="text-sm font-semibold" style={{ color: 'var(--pb-text-1)' }}>
            Type <span className="text-purple-300">{detail.name}</span> to confirm
          </p>
          <input
            value={archiveConfirm}
            onChange={(e) => setArchiveConfirm(e.target.value)}
            className="input w-full"
            placeholder={detail.name}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setArchiveTarget(false)} disabled={archiveMutation.isPending} className="btn-secondary">Cancel</button>
            <button onClick={handleArchive} disabled={archiveMutation.isPending || archiveConfirm !== detail.name} className="btn-danger">
              {archiveMutation.isPending ? 'Archiving…' : 'Archive tenant'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── Overview tab ──────────────────────────────────────────────────────────
function OverviewTab({ detail }) {
  const health = detail.health || {}
  const billing = detail.billing || {}
  const subscription = detail.subscription_status || {}

  const grid = [
    { label: 'Status', value: subscription.status || '—' },
    { label: 'Plan', value: billing.plan_name || detail.plan || '—' },
    { label: 'Billing Cycle', value: billing.billing_cycle || detail.billing_cycle || '—' },
    { label: 'Monthly Price', value: formatKES(billing.monthly_price) },
    { label: 'Plan Expires', value: billing.plan_expires_at ? formatDate(billing.plan_expires_at) : '—' },
    { label: 'On Trial', value: billing.is_trial ? `Yes (${billing.days_until_trial_end ?? '…'}d left)` : 'No' },
    { label: 'Total Paid', value: formatKES(billing.total_paid) },
    { label: 'Total Revenue', value: formatKES(health.total_revenue) },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <InfoCard icon={Mail} title="Contact" lines={[detail.contact_email || '—', detail.contact_phone || '']} />
        <InfoCard icon={MapPin} title="Location" lines={[detail.address || '—', `${detail.timezone} · ${detail.currency}`]} />
        <InfoCard icon={CreditCard} title="Billing" lines={[detail.billing_email || '—', detail.tax_name ? `${detail.tax_name} ${detail.tax_rate}%` : 'No tax configured']} />
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--pb-text-1)' }}>Resource Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UsageBar label="Clients" used={health.client_count} limit={health.client_limit} />
          <UsageBar label="Users" used={health.user_count} limit={health.user_limit} />
          <UsageBar label="Routers" used={health.router_count} limit={health.router_limit} />
          <UsageBar label="Storage" used={health.storage_usage_mb} limit={health.storage_limit_mb} />
          <UsageBar label="API Calls" used={health.api_usage} limit={health.api_limit} />
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--pb-text-1)' }}>Subscription</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {grid.map(({ label, value }) => (
            <div key={label} className="rounded-lg p-3" style={{ background: 'var(--pb-raised)', border: '1px solid var(--pb-border)' }}>
              <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{label}</p>
              <p className="font-semibold" style={{ color: 'var(--pb-text-1)' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-4" style={{ borderBottom: '1px solid var(--pb-border)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--pb-text-1)' }}>Recent Payments</h3>
        </div>
        <Table
          columns={[
            { key: 'amount', label: 'Amount', render: (p) => <span style={{ color: 'var(--pb-text-1)' }}>{formatKES(p.amount)}</span> },
            { key: 'method', label: 'Method', render: (p) => <span className="capitalize" style={{ color: 'var(--pb-text-2)' }}>{p.method}</span> },
            { key: 'created_at', label: 'Date', render: (p) => <span style={{ color: 'var(--pb-text-3)' }}>{formatDate(p.created_at)}</span> },
          ]}
          data={(detail.recent_payments || []).slice(0, 8)}
          emptyMessage="No payments recorded"
        />
      </div>
    </div>
  )
}

// ── Configuration tab ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars -- used in JSX below
function ConfigForm({ title, icon: Icon, fields, submitting, onSubmit, submitLabel = 'Save' }) {
  const initial = {}
  fields.forEach((f) => { initial[f.name] = f.initial !== undefined ? f.initial : '' })
  const [form, setForm] = useState(initial)
  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); const payload = {}; fields.forEach((f) => { payload[f.name] = f.numeric ? Number(form[f.name]) : form[f.name] }); onSubmit(payload) }}
      className="card p-5 space-y-4"
    >
      <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--pb-text-1)' }}>
        <Icon size={15} style={{ color: '#a78bfa' }} /> {title}
      </h3>
      {fields.map((f, idx) => {
        if (f.type === 'select') {
          return (
            <div key={idx}>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--pb-text-3)' }}>{f.label}</label>
              <select value={form[f.name]} onChange={update(f.name)} className="input w-full">
                {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          )
        }
        return (
          <Field
            key={idx}
            label={f.label}
            name={f.name}
            value={form[f.name]}
            onChange={update(f.name)}
            type={f.type || 'text'}
            required={f.required}
            maxLength={f.maxLength}
          />
        )
      })}
      {!fields.some((f) => f.hideSubmit) && (
        <div className="flex justify-end">
          <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving…' : submitLabel}</button>
        </div>
      )}
    </form>
  )
}

function ConfigTab({ detail, companySubmitting, onCompany, brandingSubmitting, onBranding, localizationSubmitting, onLocalization, planSubmitting, onPlan }) {
  const planOptions = [
    { value: 'starter', label: 'Starter' },
    { value: 'professional', label: 'Professional' },
    { value: 'enterprise', label: 'Enterprise' },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ConfigForm
        title="Company"
        icon={Globe}
        submitLabel="Save company"
        submitting={companySubmitting}
        onSubmit={onCompany}
        fields={[
          { name: 'contact_email', label: 'Contact Email', initial: detail.contact_email, type: 'email', required: true },
          { name: 'contact_phone', label: 'Contact Phone', initial: detail.contact_phone },
          { name: 'address', label: 'Address', initial: detail.address },
          { name: 'website', label: 'Website', initial: detail.website },
        ]}
      />

      <ConfigForm
        title="Branding"
        icon={Wifi}
        submitLabel="Save branding"
        submitting={brandingSubmitting}
        onSubmit={onBranding}
        fields={[
          { name: 'primary_color', label: 'Primary Color', initial: detail.primary_color },
          { name: 'secondary_color', label: 'Secondary Color', initial: detail.secondary_color },
          { name: 'custom_domain', label: 'Custom Domain', initial: detail.custom_domain },
        ]}
      />

      <ConfigForm
        title="Localization"
        icon={MapPin}
        submitLabel="Save localization"
        submitting={localizationSubmitting}
        onSubmit={onLocalization}
        fields={[
          { name: 'timezone', label: 'Timezone', initial: detail.timezone, required: true },
          { name: 'currency', label: 'Currency', initial: detail.currency, required: true, maxLength: 3 },
          { name: 'tax_name', label: 'Tax Name', initial: detail.tax_name },
          { name: 'tax_number', label: 'Tax Number', initial: detail.tax_number },
          { name: 'tax_rate', label: 'Tax Rate (%)', initial: detail.tax_rate, type: 'number', numeric: true },
        ]}
      />

      <ConfigForm
        title="Assign Plan"
        icon={Shield}
        submitLabel="Assign plan"
        submitting={planSubmitting}
        onSubmit={onPlan}
        fields={[
          { name: 'plan', label: 'Plan', type: 'select', initial: detail.plan, options: planOptions.map(o => o.value) },
          { name: 'billing_cycle', label: 'Billing Cycle', type: 'select', initial: detail.billing_cycle || 'monthly', options: ['monthly', 'annual'] },
        ]}
      />
    </div>
  )
}

// ── Quotas & Features tab ──────────────────────────────────────────────────
function QuotasTab({ detail, featureFlags, quotasSubmitting, onQuotas, onUpdateFlags, onAddFeature, onRemoveFeature }) {
  const [form, setForm] = useState({
    max_clients: detail.max_clients,
    max_users: detail.max_users,
    max_routers: detail.max_routers,
    storage_quota_gb: detail.storage_quota_gb,
    api_calls_per_month: detail.api_calls_per_month,
  })
  const [newFeature, setNewFeature] = useState('')
  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--pb-text-1)' }}>Quotas & Limits</h3>
        {[
          ['max_clients', 'Max Clients'],
          ['max_users', 'Max Users'],
          ['max_routers', 'Max Routers'],
          ['storage_quota_gb', 'Storage Quota (GB)'],
          ['api_calls_per_month', 'API Calls / Month'],
        ].map(([key, label]) => (
          <Field key={key} label={label} name={key} value={form[key]} onChange={update(key)} type="number" min="1" />
        ))}
        <div className="flex justify-end">
          <button
            onClick={() => onQuotas({ ...form, max_clients: +form.max_clients, max_users: +form.max_users, max_routers: +form.max_routers, storage_quota_gb: +form.storage_quota_gb, api_calls_per_month: +form.api_calls_per_month })}
            disabled={quotasSubmitting}
            className="btn-primary"
          >
            {quotasSubmitting ? 'Saving…' : 'Save quotas'}
          </button>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--pb-text-1)' }}>Feature Flags</h3>
          <button onClick={() => onUpdateFlags(featureFlags)} className="btn-ghost text-xs">Save flags</button>
        </div>
        <div className="space-y-2">
          {featureFlags.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>No feature flags set</p>
          )}
          {featureFlags.map((f) => (
            <div key={f} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'var(--pb-raised)', border: '1px solid var(--pb-border)' }}>
              <span className="text-sm" style={{ color: 'var(--pb-text-1)' }}>{f}</span>
              <button onClick={() => onRemoveFeature(f)} className="p-1 text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Remove">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newFeature} onChange={(e) => setNewFeature(e.target.value)} className="input flex-1" placeholder="New feature flag" />
          <button
            onClick={() => { if (newFeature.trim()) { onAddFeature(newFeature.trim()); setNewFeature('') } }}
            className="btn-secondary"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Administrators tab ─────────────────────────────────────────────────────
function AdminsTab({ detail, onOpen }) {
  const admins = detail.users || []
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--pb-text-1)' }}>Tenant Administrators</h3>
        <button onClick={onOpen} className="btn-primary"><UserPlus size={14} className="mr-1.5" /> Add admin</button>
      </div>
      <Table
        columns={[
          { key: 'name', label: 'Name', render: (u) => <span style={{ color: 'var(--pb-text-1)' }}>{u.name}</span> },
          { key: 'email', label: 'Email', render: (u) => <span style={{ color: 'var(--pb-text-2)' }}>{u.email}</span> },
        ]}
        data={admins}
        emptyMessage="No administrators found"
      />
    </div>
  )
}

// ── Lifecycle tab ──────────────────────────────────────────────────────────
function LifecycleTab({ detail, onSuspend, onActivate, onArchive, mutating }) {
  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--pb-text-1)' }}>Status Control</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--pb-text-3)' }}>
          Current status: <span className={tenantStatusBadge(detail.status)}>{detail.status}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {detail.status === 'suspended' ? (
            <button onClick={() => onActivate(detail.id)} disabled={mutating} className="btn-primary">
              <CheckCircle2 size={15} className="mr-1.5" /> Activate tenant
            </button>
          ) : detail.status !== 'archived' ? (
            <button onClick={() => onSuspend(detail.id)} disabled={mutating} className="btn-secondary">
              <PauseCircle size={15} className="mr-1.5" /> Suspend tenant
            </button>
          ) : null}
          {detail.status !== 'archived' && (
            <button onClick={onArchive} disabled={mutating} className="btn-danger">
              <Archive size={15} className="mr-1.5" /> Archive tenant
            </button>
          )}
        </div>
      </div>

      <div className="card p-5" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
        <h3 className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: '#f87171' }}>
          <Trash2 size={15} /> Destructive actions
        </h3>
        <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>
          Archiving a tenant requires typed confirmation and is audited. There is no unrestricted delete from the UI.
        </p>
      </div>
    </div>
  )
}

// ── Create admin form ──────────────────────────────────────────────────────
function CreateAdminForm({ submitting, onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <Field label="Name" value={form.name} onChange={update('name')} required />
      <Field label="Email" value={form.email} onChange={update('email')} type="email" required />
      <Field label="Password" value={form.password} onChange={update('password')} type="password" minLength={8} required />
      <Field label="Confirm Password" value={form.password_confirmation} onChange={update('password_confirmation')} type="password" minLength={8} required />
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} disabled={submitting} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Creating…' : 'Create admin'}</button>
      </div>
    </form>
  )
}

