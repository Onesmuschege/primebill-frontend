import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPlans, createPlan, updatePlan, deletePlan,
  bulkUpdatePlans, duplicatePlan as duplicatePlanApi, toggleActivePlan, pushPlanToRouter, getPlanTemplates,
} from '../../api/plans.api'
import Modal from '../../components/common/Modal'
import { formatKES } from '../../utils/formatCurrency'
import {
  Plus, Wifi, Trash2, Pencil, Radio, Network, Users, Zap, Layers, Search,
  CheckSquare, Square, Copy, RefreshCw, LayoutTemplate, CheckCircle2, AlertCircle, Clock, CloudOff,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner'
import Skeleton from '../../components/common/Skeleton'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import StatCard from '../../components/dashboard/StatCard'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Badge from '../../components/common/Badge'

// ─── Unit helpers ────────────────────────────────────────────────────────────
const toMbps  = (kbps) => (kbps  ? (kbps  / 1024).toFixed(2).replace(/\.00$/, '') : '')
const toKbps  = (mbps) => (mbps  ? Math.round(parseFloat(mbps) * 1024) : null)
const fmtMbps = (kbps) => kbps   ? `${(kbps / 1024).toFixed(1)} Mbps` : '—'
const fmtGB   = (mb)   => mb     ? `${(mb   / 1024).toFixed(1)} GB`   : '—'

// ─── Blank form ──────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: '', type: 'pppoe',
  speed_up: '', speed_down: '',
  burst_up: '', burst_down: '',
  fup_limit_gb: '',
  fup_speed_up: '', fup_speed_down: '',
  validity_days: 30, price: '', is_active: true,
}

function planToForm(plan) {
  return {
    name:          plan.name,
    type:          plan.type,
    speed_up:      toMbps(plan.speed_up),
    speed_down:    toMbps(plan.speed_down),
    burst_up:      toMbps(plan.burst_up),
    burst_down:    toMbps(plan.burst_down),
    fup_limit_gb:  plan.fup_limit ? (plan.fup_limit / 1024).toFixed(2).replace(/\.00$/, '') : '',
    fup_speed_up:  toMbps(plan.fup_speed_up),
    fup_speed_down:toMbps(plan.fup_speed_down),
    validity_days: plan.validity_days,
    price:         plan.price,
    is_active:     !!plan.is_active,
  }
}

function formToPayload(form) {
  return {
    name:           form.name,
    type:           form.type,
    speed_up:       toKbps(form.speed_up),
    speed_down:     toKbps(form.speed_down),
    burst_up:       toKbps(form.burst_up)       || null,
    burst_down:     toKbps(form.burst_down)     || null,
    fup_limit:      form.fup_limit_gb ? Math.round(parseFloat(form.fup_limit_gb) * 1024) : null,
    fup_speed_up:   toKbps(form.fup_speed_up)   || null,
    fup_speed_down: toKbps(form.fup_speed_down) || null,
    validity_days:  form.validity_days,
    price:          form.price,
    is_active:      form.is_active,
  }
}

// ─── Type helpers ────────────────────────────────────────────────────────────
function typeIcon(type) {
  if (type === 'hotspot') return <Radio size={20} />
  if (type === 'static')  return <Network size={20} />
  return <Wifi size={20} />
}
function typeBadge(type) {
  const map = {
    pppoe:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    hotspot: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    static:  'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  }
  return `text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${map[type] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`
}

// ─── Active-state helper ──────────────────────────────────────────────────────
// Checks a few common field-name variants so the UI degrades gracefully even
// if the API field doesn't exactly match `is_active`.
function isPlanActive(plan) {
  if (plan.is_active !== undefined) return !!plan.is_active
  if (plan.active !== undefined) return !!plan.active
  if (plan.status !== undefined) return plan.status === 'active' || plan.status === 1
  return true
}

// ─── Sync status helper ───────────────────────────────────────────────────────
function SyncStatusChip({ status }) {
  const map = {
    synced:     { icon: CheckCircle2, label: 'Synced',     color: '#34d399' },
    pending:    { icon: Clock,        label: 'Pending',    color: '#fbbf24' },
    error:      { icon: AlertCircle,  label: 'Error',      color: '#f87171' },
    not_pushed: { icon: CloudOff,     label: 'Not Pushed',color: '#9ca3af' },
  }
  const { icon: Icon, label, color } = map[status] ?? map.not_pushed
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color }}>
      <Icon size={13} /> {label}
    </span>
  )
}

// ─── MRR helper ────────────────────────────────────────────────────────────────
function mrr(plan) {
  const count = plan.active_accounts_count ?? 0
  return count * Number(plan.price ?? 0)
}

// ─── Form fields component ───────────────────────────────────────────────────
function PlanFormFields({ form, onChange, errors }) {
  const f = (key) => ({
    value: form[key],
    onChange: (e) => onChange(key, e.target.value),
  })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="form-label">Plan Name <span className="text-red-500">*</span></label>
          <input {...f('name')} className={`input w-full ${errors.name ? 'border-red-500' : ''}`}
            placeholder="e.g. Home Fiber 10Mbps" required />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="form-label">Type <span className="text-red-500">*</span></label>
          <select {...f('type')} className="input w-full">
            <option value="pppoe">PPPoE</option>
            <option value="hotspot">Hotspot</option>
            <option value="static">Static IP</option>
          </select>
        </div>
        <div>
          <label className="form-label">Price (KES) <span className="text-red-500">*</span></label>
          <input type="number" min="0" step="0.01" {...f('price')}
            className={`input w-full ${errors.price ? 'border-red-500' : ''}`}
            placeholder="e.g. 2500" required />
          {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
        </div>
      </div>

      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Speed (Mbps)</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Upload <span className="text-red-500">*</span></label>
          <div className="relative">
            <input type="number" min="0.1" step="0.1" {...f('speed_up')}
              className={`input w-full pr-14 ${errors.speed_up ? 'border-red-500' : ''}`}
              placeholder="e.g. 10" required />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Mbps</span>
          </div>
          {errors.speed_up && <p className="text-xs text-red-500 mt-1">{errors.speed_up}</p>}
        </div>
        <div>
          <label className="form-label">Download <span className="text-red-500">*</span></label>
          <div className="relative">
            <input type="number" min="0.1" step="0.1" {...f('speed_down')}
              className={`input w-full pr-14 ${errors.speed_down ? 'border-red-500' : ''}`}
              placeholder="e.g. 10" required />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Mbps</span>
          </div>
          {errors.speed_down && <p className="text-xs text-red-500 mt-1">{errors.speed_down}</p>}
        </div>
      </div>

      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Burst Speed — optional</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Burst Upload</label>
          <div className="relative">
            <input type="number" min="0" step="0.1" {...f('burst_up')}
              className="input w-full pr-14" placeholder="Leave blank to disable" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Mbps</span>
          </div>
        </div>
        <div>
          <label className="form-label">Burst Download</label>
          <div className="relative">
            <input type="number" min="0" step="0.1" {...f('burst_down')}
              className="input w-full pr-14" placeholder="Leave blank to disable" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Mbps</span>
          </div>
        </div>
      </div>

      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fair Usage Policy — optional</p>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="form-label">FUP Limit</label>
          <div className="relative">
            <input type="number" min="0" step="0.1" {...f('fup_limit_gb')}
              className="input w-full pr-8" placeholder="e.g. 50" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">GB</span>
          </div>
        </div>
        <div>
          <label className="form-label">FUP Upload</label>
          <div className="relative">
            <input type="number" min="0" step="0.1" {...f('fup_speed_up')}
              className="input w-full pr-14" placeholder="Throttled" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Mbps</span>
          </div>
        </div>
        <div>
          <label className="form-label">FUP Download</label>
          <div className="relative">
            <input type="number" min="0" step="0.1" {...f('fup_speed_down')}
              className="input w-full pr-14" placeholder="Throttled" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Mbps</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Validity (Days) <span className="text-red-500">*</span></label>
          <input type="number" min="1" {...f('validity_days')} className="input w-full" required />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <input type="checkbox" id="is_active" checked={form.is_active}
            onChange={(e) => onChange('is_active', e.target.checked)}
            className="w-4 h-4 accent-primary-600" />
          <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">Active (visible to clients)</label>
        </div>
      </div>
    </div>
  )
}

// ─── Active toggle switch ─────────────────────────────────────────────────────
function ActiveToggle({ active, onToggle, disabled }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      title={active ? 'Click to deactivate' : 'Click to activate'}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50"
      style={{ backgroundColor: active ? '#10b981' : 'var(--pb-border)' }}
    >
      <span
        className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
        style={{ transform: active ? 'translateX(18px)' : 'translateX(3px)' }}
      />
    </button>
  )
}

// ─── Batch Edit Bandwidth modal ───────────────────────────────────────────────
// Only burst + FUP fields are editable here — no name/type/price/validity,
// matching the hard rule that batch edits never touch pricing.
function BulkBandwidthModal({ isOpen, onClose, selectedCount, onSubmit, isPending }) {
  const [fields, setFields] = useState({
    burst_up: '', burst_down: '',
    fup_limit_gb: '', fup_speed_up: '', fup_speed_down: '',
  })

  const f = (key) => ({
    value: fields[key],
    onChange: (e) => setFields(prev => ({ ...prev, [key]: e.target.value })),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {}
    if (fields.burst_up !== '')       payload.burst_up       = toKbps(fields.burst_up)
    if (fields.burst_down !== '')     payload.burst_down     = toKbps(fields.burst_down)
    if (fields.fup_limit_gb !== '')   payload.fup_limit      = Math.round(parseFloat(fields.fup_limit_gb) * 1024)
    if (fields.fup_speed_up !== '')   payload.fup_speed_up   = toKbps(fields.fup_speed_up)
    if (fields.fup_speed_down !== '') payload.fup_speed_down = toKbps(fields.fup_speed_down)

    if (Object.keys(payload).length === 0) {
      toast.error('Fill in at least one field to update')
      return
    }
    onSubmit(payload)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Batch Edit Bandwidth — ${selectedCount} plan${selectedCount !== 1 ? 's' : ''}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          className="text-xs px-3 py-2 rounded-lg"
          style={{ backgroundColor: 'var(--pb-raised)', color: 'var(--pb-text-2)' }}
        >
          Only burst speed and FUP settings can be batch-edited. Leave a field blank to
          leave that value unchanged. Prices, names, and plan types are never touched here.
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--pb-text-3)' }}>Burst Speed</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Burst Upload</label>
            <div className="relative">
              <input type="number" min="0" step="0.1" {...f('burst_up')} className="input w-full pr-14" placeholder="Leave blank" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Mbps</span>
            </div>
          </div>
          <div>
            <label className="form-label">Burst Download</label>
            <div className="relative">
              <input type="number" min="0" step="0.1" {...f('burst_down')} className="input w-full pr-14" placeholder="Leave blank" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Mbps</span>
            </div>
          </div>
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--pb-text-3)' }}>Fair Usage Policy</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="form-label">FUP Limit</label>
            <div className="relative">
              <input type="number" min="0" step="0.1" {...f('fup_limit_gb')} className="input w-full pr-8" placeholder="Leave blank" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">GB</span>
            </div>
          </div>
          <div>
            <label className="form-label">FUP Upload</label>
            <div className="relative">
              <input type="number" min="0" step="0.1" {...f('fup_speed_up')} className="input w-full pr-14" placeholder="Leave blank" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Mbps</span>
            </div>
          </div>
          <div>
            <label className="form-label">FUP Download</label>
            <div className="relative">
              <input type="number" min="0" step="0.1" {...f('fup_speed_down')} className="input w-full pr-14" placeholder="Leave blank" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Mbps</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={isPending} className="btn-primary min-w-[140px]">
            {isPending ? 'Applying...' : `Apply to ${selectedCount} Plan${selectedCount !== 1 ? 's' : ''}`}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Template picker modal ─────────────────────────────────────────────────────
function TemplatePickerModal({ isOpen, onClose, templates, isLoading, onPick }) {
  const grouped = templates.reduce((acc, t) => {
    const cat = t.category || 'Other'
    acc[cat] = acc[cat] || []
    acc[cat].push(t)
    return acc
  }, {})

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Plan from Template" size="lg">
      {isLoading ? (
        <div className="py-10"><Spinner size="md" /></div>
      ) : templates.length === 0 ? (
        <p className="text-sm text-center py-10" style={{ color: 'var(--pb-text-3)' }}>No templates available yet.</p>
      ) : (
        <div className="space-y-5 max-h-[60vh] overflow-y-auto">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--pb-text-3)' }}>{category}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map(t => (
                  <button
                    key={t.id}
                    onClick={() => onPick(t)}
                    className="text-left p-3 rounded-lg border transition-colors hover:[background-color:var(--pb-raised)]"
                    style={{ borderColor: 'var(--pb-border)' }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm" style={{ color: 'var(--pb-text-1)' }}>{t.name}</span>
                      {t.suggested_price != null && (
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{formatKES(t.suggested_price)}</span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
                      {fmtMbps(t.speed_up)} / {fmtMbps(t.speed_down)}
                      {t.fup_limit ? ` · FUP ${fmtGB(t.fup_limit)}` : ' · Unlimited'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}


export default function PlanList() {
  const [showForm, setShowForm] = useState(false)
  const [editPlan, setEditPlan] = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [errors, setErrors]     = useState({})
  const [search, setSearch]     = useState('')
  const [perPage, setPerPage]   = useState(10)
  const [page, setPage]         = useState(1)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
    const queryClient = useQueryClient()

  // ── Confirmation surface (replaces ad-hoc window.confirm) ──────────────────
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState('')
  const [pendingConfirm, setPendingConfirm] = useState(null)
  const askConfirm = (message, onConfirm) => {
    setConfirmMessage(message)
    setPendingConfirm(() => onConfirm)
    setConfirmOpen(true)
  }

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['plans'],
    queryFn: () => getPlans(),
  })

  const plans = Array.isArray(data?.data) ? data.data
    : Array.isArray(data) ? data : []

  const totalPlans      = plans.length
  const activeCustomers = plans.reduce((sum, p) => sum + (p.active_accounts_count ?? 0), 0)
  const fupEnabledCount = plans.filter(p => !!p.fup_limit).length
  const unlimitedCount  = plans.filter(p => !p.fup_limit).length

  // ─── Search + client-side pagination ────────────────────────────────────
  const filteredPlans = plans.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.type.toLowerCase().includes(search.toLowerCase())
  )
  const lastPage      = Math.max(1, Math.ceil(filteredPlans.length / perPage))
  const currentPage   = Math.min(page, lastPage)
  const startIdx      = (currentPage - 1) * perPage
  const pagedPlans     = filteredPlans.slice(startIdx, startIdx + perPage)
  const paginationMeta = {
    current_page: currentPage,
    last_page:    lastPage,
    from:         filteredPlans.length === 0 ? 0 : startIdx + 1,
    to:           Math.min(startIdx + perPage, filteredPlans.length),
    total:        filteredPlans.length,
  }

  const handleSearchChange = (val) => { setSearch(val); setPage(1) }
  const handlePerPageChange = (val) => { setPerPage(val); setPage(1) }

  // ─── Row selection ───────────────────────────────────────────────────────
  const allOnPageSelected = pagedPlans.length > 0 && pagedPlans.every(p => selectedIds.has(p.id))
  const toggleRow = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const toggleAllOnPage = () => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allOnPageSelected) {
        pagedPlans.forEach(p => next.delete(p.id))
      } else {
        pagedPlans.forEach(p => next.add(p.id))
      }
      return next
    })
  }
  const clearSelection = () => setSelectedIds(new Set())

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => deletePlan(id)))
    },
    onSuccess: () => {
      toast.success(`${selectedIds.size} plan${selectedIds.size !== 1 ? 's' : ''} deleted!`)
      clearSelection()
      queryClient.invalidateQueries(['plans'])
    },
    onError: () => toast.error('Failed to delete one or more plans'),
  })
    const handleBulkDelete = () => {
    askConfirm(
      `Delete ${selectedIds.size} selected plan${selectedIds.size !== 1 ? 's' : ''}?`,
      () => bulkDeleteMutation.mutate(Array.from(selectedIds)),
    )
  }

  // ─── Templates (quick-create) ────────────────────────────────────────────
  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['plan-templates'],
    queryFn: () => getPlanTemplates(),
    enabled: showTemplates,
  })
  const templates = Array.isArray(templatesData?.data) ? templatesData.data
    : Array.isArray(templatesData) ? templatesData : []

  const handlePickTemplate = (template) => {
    setEditPlan(null)
    setForm({
      name:           template.name,
      type:           template.type,
      speed_up:       toMbps(template.speed_up),
      speed_down:     toMbps(template.speed_down),
      burst_up:       toMbps(template.burst_up),
      burst_down:     toMbps(template.burst_down),
      fup_limit_gb:   template.fup_limit ? (template.fup_limit / 1024).toFixed(2).replace(/\.00$/, '') : '',
      fup_speed_up:   toMbps(template.fup_speed_up),
      fup_speed_down: toMbps(template.fup_speed_down),
      validity_days:  template.validity_days,
      price:          template.suggested_price ?? '',
      is_active:      true,
    })
    setErrors({})
    setShowTemplates(false)
    setShowForm(true)
  }

  // ─── Duplicate ────────────────────────────────────────────────────────────
  const duplicateMutation = useMutation({
    mutationFn: (id) => duplicatePlanApi(id),
    onSuccess: () => { toast.success('Plan duplicated!'); queryClient.invalidateQueries(['plans']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to duplicate plan'),
  })

  // ─── Toggle active ─────────────────────────────────────────────────────────
  const toggleActiveMutation = useMutation({
    mutationFn: (id) => toggleActivePlan(id),
    onSuccess: () => queryClient.invalidateQueries(['plans']),
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update plan status'),
  })

  // ─── Push to router ─────────────────────────────────────────────────────────
  const pushToRouterMutation = useMutation({
    mutationFn: (id) => pushPlanToRouter(id),
    onSuccess: () => { toast.success('Plan pushed to router!'); queryClient.invalidateQueries(['plans']) },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to push plan to router')
      queryClient.invalidateQueries(['plans'])
    },
  })

  // ─── Bulk bandwidth edit ─────────────────────────────────────────────────────
  const bulkBandwidthMutation = useMutation({
    mutationFn: (payload) => bulkUpdatePlans(Array.from(selectedIds), payload),
    onSuccess: (res) => {
      toast.success(res?.message || 'Plans updated!')
      setShowBulkEdit(false)
      clearSelection()
      queryClient.invalidateQueries(['plans'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update plans'),
  })

  const openAdd = () => {
    setEditPlan(null); setForm(EMPTY_FORM); setErrors({}); setShowForm(true)
  }
  const openEdit = (plan) => {
    setEditPlan(plan); setForm(planToForm(plan)); setErrors({}); setShowForm(true)
  }
  const handleChange = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: null }))
  }
  const handleError = (err) => {
    const body = err.response?.data
    if (body?.errors) {
      const mapped = {}
      Object.entries(body.errors).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : v })
      setErrors(mapped)
      toast.error('Please fix the highlighted fields.')
    } else {
      toast.error(body?.message || 'Failed to save plan')
    }
  }

  const saveMutation = useMutation({
    mutationFn: (payload) => editPlan ? updatePlan(editPlan.id, payload) : createPlan(payload),
    onSuccess: () => {
      toast.success(editPlan ? 'Plan updated!' : 'Plan created!')
      setShowForm(false)
      queryClient.invalidateQueries(['plans'])
    },
    onError: handleError,
  })

  const deleteMutation = useMutation({
    mutationFn: deletePlan,
    onSuccess: () => { toast.success('Plan deleted!'); queryClient.invalidateQueries(['plans']) },
    onError: () => toast.error('Failed to delete plan'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    saveMutation.mutate(formToPayload(form))
  }

  // ─── Sync all to router (batched — one aggregate result, not N toasts) ──────
  const syncAllMutation = useMutation({
    mutationFn: async (ids) => {
      const results = await Promise.allSettled(ids.map(id => pushPlanToRouter(id)))
      const succeeded = results.filter(r => r.status === 'fulfilled').length
      const failed    = results.length - succeeded
      return { succeeded, failed, total: results.length }
    },
    onSuccess: ({ succeeded, failed, total }) => {
      if (failed === 0) {
        toast.success(`Synced all ${total} plan(s) to their routers`)
      } else {
        toast.error(`${succeeded}/${total} synced — ${failed} failed. Check individual rows for details.`)
      }
      queryClient.invalidateQueries(['plans'])
    },
    onError: () => toast.error('Failed to sync plans to routers'),
  })
  const handleSyncAll = () => {
    const ids = plans.filter(p => p.router_id).map(p => p.id)
    if (ids.length === 0) { toast.error('No plans have a router assigned'); return }
    toast(`Syncing ${ids.length} plan(s)...`)
    syncAllMutation.mutate(ids)
  }

    if (isError) {
    return (
      <ErrorState
        message={error?.message ?? 'Failed to load plans'}
        onRetry={() => queryClient.invalidateQueries(['plans'])}
      />
    )
  }
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Plans" value={totalPlans} icon={Wifi} color="blue" />
        <StatCard title="Active Customers" value={activeCustomers} icon={Users} color="purple" />
        <StatCard title="FUP Enabled" value={fupEnabledCount} icon={Zap} color="orange" />
        <StatCard title="Unlimited Plans" value={unlimitedCount} icon={Layers} color="cyan" />
      </div>

      {/* Quick Actions — only actions with a real backend capability behind them */}
      <div className="card flex flex-wrap items-center gap-2 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider mr-1" style={{ color: 'var(--pb-text-3)' }}>
          Quick Actions
        </span>
        <button
          onClick={handleSyncAll}
          disabled={syncAllMutation.isPending}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors hover:[background-color:var(--pb-raised)] disabled:opacity-50"
          style={{ borderColor: 'var(--pb-border)', color: 'var(--pb-text-2)' }}
        >
          <RefreshCw size={13} className={syncAllMutation.isPending ? 'animate-spin' : ''} />
          {syncAllMutation.isPending ? 'Syncing...' : 'Sync All to Router'}
        </button>
        <button
          onClick={() => setShowTemplates(true)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors hover:[background-color:var(--pb-raised)]"
          style={{ borderColor: 'var(--pb-border)', color: 'var(--pb-text-2)' }}
        >
          <LayoutTemplate size={13} /> New from Template
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>{plans.length} plan{plans.length !== 1 ? 's' : ''} configured</p>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Plan
        </button>
      </div>

            {plans.length === 0 ? (
        <EmptyState
          icon={Wifi}
          title={search ? 'No matching plans' : 'No plans yet'}
          description={search ? 'Try a different search term' : 'Click "Add Plan" to get started'}
        />
      ) : (
        <div className="card p-0 overflow-hidden" style={{ borderColor: 'var(--pb-border)' }}>
          {/* Toolbar: entries-per-page + search, or bulk-action bar when rows are selected */}
          {selectedIds.size > 0 ? (
            <div
              className="flex items-center justify-between gap-3 px-4 py-3"
              style={{ borderBottom: '1px solid var(--pb-border)', backgroundColor: 'var(--pb-raised)' }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--pb-text-1)' }}>
                {selectedIds.size} plan{selectedIds.size !== 1 ? 's' : ''} selected
              </p>
              <div className="flex items-center gap-2">
                <button onClick={clearSelection} className="btn-secondary text-sm">Clear</button>
                <button
                  onClick={() => setShowBulkEdit(true)}
                  className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <Zap size={14} /> Batch Edit Bandwidth
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                  className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                >
                  <Trash2 size={14} />
                  {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete Selected'}
                </button>
              </div>
            </div>
          ) : (
            <div
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3"
              style={{ borderBottom: '1px solid var(--pb-border)' }}
            >
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--pb-text-3)' }}>
                Show
                <select
                  value={perPage}
                  onChange={(e) => handlePerPageChange(Number(e.target.value))}
                  className="input py-1 px-2 text-sm w-auto"
                >
                  {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                entries
              </div>
              <div className="relative w-full sm:w-64">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--pb-text-3)' }} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search plans..."
                  className="input w-full pl-9 text-sm"
                />
              </div>
            </div>
          )}

          <Table
            columns={[
              {
                key: 'select',
                label: (
                  <button onClick={toggleAllOnPage} className="flex items-center" style={{ color: 'var(--pb-text-3)' }}>
                    {allOnPageSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                ),
                render: (plan) => (
                  <button onClick={() => toggleRow(plan.id)} className="flex items-center" style={{ color: 'var(--pb-text-3)' }}>
                    {selectedIds.has(plan.id) ? <CheckSquare size={16} className="text-blue-500" /> : <Square size={16} />}
                  </button>
                ),
              },
              {
                key: 'name',
                label: 'Plan Name',
                render: (plan) => (
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 bg-primary-50 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400 shrink-0">
                      {typeIcon(plan.type)}
                    </div>
                    <span className="font-semibold truncate" style={{ color: 'var(--pb-text-1)' }}>{plan.name}</span>
                  </div>
                ),
              },
              {
                key: 'type',
                label: 'Type',
                render: (plan) => <span className={typeBadge(plan.type)}>{plan.type.toUpperCase()}</span>,
              },
              {
                key: 'speed',
                label: 'Upload / Download',
                render: (plan) => (
                  <span style={{ color: 'var(--pb-text-1)' }}>
                    {fmtMbps(plan.speed_up)} / {fmtMbps(plan.speed_down)}
                  </span>
                ),
              },
              {
                key: 'fup',
                label: 'FUP',
                render: (plan) => plan.fup_limit
                  ? <span style={{ color: 'var(--pb-text-1)' }}>{fmtGB(plan.fup_limit)}</span>
                  : <Badge label="Unlimited" variant="active" />,
              },
              {
                key: 'validity_days',
                label: 'Validity',
                render: (plan) => <span style={{ color: 'var(--pb-text-1)' }}>{plan.validity_days} days</span>,
              },
              {
                key: 'active_accounts_count',
                label: 'Customers',
                render: (plan) => (
                  <div>
                    <span style={{ color: 'var(--pb-text-1)' }}>{plan.active_accounts_count ?? 0}</span>
                    {mrr(plan) > 0 && (
                      <span className="block text-xs" style={{ color: 'var(--pb-text-3)' }}>{formatKES(mrr(plan))}/mo</span>
                    )}
                  </div>
                ),
              },
              {
                key: 'sync_status',
                label: 'Router Sync',
                render: (plan) => <SyncStatusChip status={plan.sync_status ?? 'not_pushed'} />,
              },
              {
                key: 'status',
                label: 'Status',
                render: (plan) => (
                  <ActiveToggle
                    active={isPlanActive(plan)}
                    disabled={toggleActiveMutation.isPending}
                    onToggle={() => toggleActiveMutation.mutate(plan.id)}
                  />
                ),
              },
              {
                key: 'price',
                label: 'Price',
                render: (plan) => (
                  <span className="font-bold text-primary-600 dark:text-primary-400">{formatKES(plan.price)}</span>
                ),
              },
              {
                key: 'actions',
                label: 'Manage',
                render: (plan) => (
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(plan)}
                      className="p-2 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                      style={{ color: 'var(--pb-text-3)' }} title="Edit">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => duplicateMutation.mutate(plan.id)}
                      disabled={duplicateMutation.isPending}
                      className="p-2 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded"
                      style={{ color: 'var(--pb-text-3)' }} title="Duplicate">
                      <Copy size={15} />
                    </button>
                    <button
                      onClick={() => plan.router_id
                        ? pushToRouterMutation.mutate(plan.id)
                        : toast.error('Assign a router to this plan first')}
                      disabled={pushToRouterMutation.isPending}
                      className="p-2 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded"
                      style={{ color: 'var(--pb-text-3)' }} title="Push to Router">
                      <RefreshCw size={15} />
                    </button>
                                        <button onClick={() => askConfirm(`Delete "${plan.name}"?`, () => deleteMutation.mutate(plan.id))}
                      className="p-2 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                      style={{ color: 'var(--pb-text-3)' }} title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ),
              },
            ]}
            data={pagedPlans}
            emptyMessage="No plans match your search"
          />

          <Pagination meta={paginationMeta} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)}
        title={editPlan ? `Edit — ${editPlan.name}` : 'Add New Plan'} size="lg">
        <form onSubmit={handleSubmit}>
          <PlanFormFields form={form} onChange={handleChange} errors={errors} />
          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saveMutation.isPending} className="btn-primary min-w-[100px]">
              {saveMutation.isPending ? 'Saving...' : editPlan ? 'Update Plan' : 'Save Plan'}
            </button>
          </div>
        </form>
      </Modal>

      <BulkBandwidthModal
        isOpen={showBulkEdit}
        onClose={() => setShowBulkEdit(false)}
        selectedCount={selectedIds.size}
        isPending={bulkBandwidthMutation.isPending}
        onSubmit={(payload) => bulkBandwidthMutation.mutate(payload)}
      />

            <TemplatePickerModal
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        templates={templates}
        isLoading={templatesLoading}
        onPick={handlePickTemplate}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        message={confirmMessage}
        confirmLabel="Delete"
        destructive
        isPending={bulkDeleteMutation.isPending || deleteMutation.isPending}
        onConfirm={() => {
          const fn = pendingConfirm
          setConfirmOpen(false)
          setPendingConfirm(null)
          fn && fn()
        }}
      />
    </div>
  )
}