import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPlans, createPlan, updatePlan, deletePlan } from '../../api/plans.api'
import Modal from '../../components/common/Modal'
import { formatKES } from '../../utils/formatCurrency'
import { Plus, Wifi, Trash2, Pencil, Radio, Network } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner'

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

// ─── Main page ───────────────────────────────────────────────────────────────
export default function PlanList() {
  const [showForm, setShowForm] = useState(false)
  const [editPlan, setEditPlan] = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [errors, setErrors]     = useState({})
  const queryClient             = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => getPlans(),
  })

  const plans = Array.isArray(data?.data) ? data.data
    : Array.isArray(data) ? data : []

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

  if (isLoading) return <div className="py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>{plans.length} plan{plans.length !== 1 ? 's' : ''} configured</p>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Plan
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="card text-center py-16" style={{ color: 'var(--pb-text-3)' }}>
          <Wifi size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium" style={{ color: 'var(--pb-text-2)' }}>No plans yet</p>
          <p className="text-sm mt-1">Click "Add Plan" to get started</p>
        </div>
      ) : (
        <div className="card p-0 divide-y overflow-hidden" style={{ borderColor: 'var(--pb-border)' }}>
          {plans.map(plan => {
            const active = isPlanActive(plan)
            return (
              <div
                key={plan.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 px-4 py-4 transition-colors hover:[background-color:var(--pb-raised)]"
                style={{ borderColor: 'var(--pb-border)' }}
              >
                {/* Icon + Name + Badges */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400 shrink-0">
                    {typeIcon(plan.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate" style={{ color: 'var(--pb-text-1)' }}>{plan.name}</h3>
                      <span className={typeBadge(plan.type)}>{plan.type.toUpperCase()}</span>
                      {!active && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full shrink-0"
                          style={{ backgroundColor: 'var(--pb-raised)', color: 'var(--pb-text-2)' }}
                        >
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Speed / FUP stats */}
                <div className="flex items-center gap-5 text-sm shrink-0">
                  <div>
                    <span className="block text-xs" style={{ color: 'var(--pb-text-3)' }}>Upload</span>
                    <span className="font-medium" style={{ color: 'var(--pb-text-1)' }}>{fmtMbps(plan.speed_up)}</span>
                  </div>
                  <div>
                    <span className="block text-xs" style={{ color: 'var(--pb-text-3)' }}>Download</span>
                    <span className="font-medium" style={{ color: 'var(--pb-text-1)' }}>{fmtMbps(plan.speed_down)}</span>
                  </div>
                  {plan.fup_limit && (
                    <div>
                      <span className="block text-xs" style={{ color: 'var(--pb-text-3)' }}>FUP</span>
                      <span className="font-medium" style={{ color: 'var(--pb-text-1)' }}>{fmtGB(plan.fup_limit)}</span>
                    </div>
                  )}
                </div>

                {/* Validity */}
                <div className="text-sm shrink-0 sm:w-20">
                  <span className="block text-xs" style={{ color: 'var(--pb-text-3)' }}>Validity</span>
                  <span className="font-medium" style={{ color: 'var(--pb-text-1)' }}>{plan.validity_days} days</span>
                </div>

                {/* Price */}
                <div className="text-left sm:text-right shrink-0 sm:w-28">
                  <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{formatKES(plan.price)}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 sm:ml-1">
                  <button onClick={() => openEdit(plan)}
                    className="p-2 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                    style={{ color: 'var(--pb-text-3)' }} title="Edit">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => { if (confirm(`Delete "${plan.name}"?`)) deleteMutation.mutate(plan.id) }}
                    className="p-2 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                    style={{ color: 'var(--pb-text-3)' }} title="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
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
    </div>
  )
}