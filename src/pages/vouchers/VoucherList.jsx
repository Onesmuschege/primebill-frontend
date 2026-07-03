import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getVouchers, bulkGenerateVouchers, deleteVoucher, getVoucherStats } from '../../api/vouchers.api'
import { getPlans } from '../../api/plans.api'
import Modal from '../../components/common/Modal'
import { Plus, Trash2, Copy, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner'

const EMPTY_FORM = {
  plan_id: '',
  quantity: 10,
  expiry_days: 30,
}

export default function VoucherList() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPlan, setFilterPlan] = useState('')
  const queryClient = useQueryClient()

  const { data: vouchersData, isLoading } = useQuery({
    queryKey: ['vouchers', filterStatus, filterPlan],
    queryFn: () => getVouchers({ status: filterStatus, plan_id: filterPlan }),
  })

  const { data: statsData } = useQuery({
    queryKey: ['vouchers-stats'],
    queryFn: () => getVoucherStats(),
  })

  const { data: plans } = useQuery({
    queryKey: ['plans-for-vouchers'],
    queryFn: () => getPlans(),
  })

  // Handles both a flat paginator ({ success, data: { data: [...] } })
  // and a double-nested paginator ({ success, data: { data: { data: [...] } } })
  const vouchers = Array.isArray(vouchersData?.data?.data?.data)
    ? vouchersData.data.data.data
    : Array.isArray(vouchersData?.data?.data)
      ? vouchersData.data.data
      : []

  const stats = statsData?.data?.data || {}
  const planList = Array.isArray(plans?.data) ? plans.data : []

  const generateMutation = useMutation({
    mutationFn: (data) => bulkGenerateVouchers(data),
    onSuccess: () => {
      toast.success('Vouchers generated successfully!')
      setShowForm(false)
      setForm(EMPTY_FORM)
      queryClient.invalidateQueries(['vouchers'])
      queryClient.invalidateQueries(['vouchers-stats'])
    },
    onError: (err) => {
      const body = err.response?.data
      if (body?.errors) {
        const mapped = {}
        Object.entries(body.errors).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : v })
        setErrors(mapped)
      }
      toast.error(body?.message || 'Failed to generate vouchers')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteVoucher,
    onSuccess: () => {
      toast.success('Voucher deleted!')
      queryClient.invalidateQueries(['vouchers'])
      queryClient.invalidateQueries(['vouchers-stats'])
    },
    onError: () => toast.error('Failed to delete voucher'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrors({})
    generateMutation.mutate(form)
  }

  const copyCode = (code) => {
    navigator.clipboard.writeText(code)
    toast.success('Copied to clipboard!')
  }

  const exportCodes = () => {
    const csv = vouchers
      .filter(v => v.status === 'unused')
      .map(v => `"${v.code}","${v.plan?.name ?? ''}","${v.expires_at}"`)
      .join('\n')

    const blob = new Blob([`Code,Plan,ExpiresAt\n${csv}`], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vouchers-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (isLoading) return <div className="py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total || 0, color: 'blue' },
          { label: 'Unused', value: stats.unused || 0, color: 'green' },
          { label: 'Redeemed', value: stats.redeemed || 0, color: 'purple' },
          { label: 'Expired', value: stats.expired || 0, color: 'red' },
        ].map(stat => (
          <div key={stat.label} className="card p-4 text-center">
            <p className="text-xs font-medium" style={{ color: `var(--pb-text-3)` }}>{stat.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: `var(--color-${stat.color}-600)` }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input"
          >
            <option value="">All Status</option>
            <option value="unused">Unused</option>
            <option value="redeemed">Redeemed</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCodes} className="btn-secondary flex items-center gap-2">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Generate
          </button>
        </div>
      </div>

      {/* List */}
      {vouchers.length === 0 ? (
        <div className="card text-center py-16" style={{ color: 'var(--pb-text-3)' }}>
          <p className="font-medium" style={{ color: 'var(--pb-text-2)' }}>No vouchers yet</p>
          <p className="text-sm mt-1">Click "Generate" to create prepaid voucher codes</p>
        </div>
      ) : (
        <div className="card p-0 divide-y overflow-hidden" style={{ borderColor: 'var(--pb-border)' }}>
          {vouchers.map(v => (
            <div key={v.id} className="flex items-center justify-between px-4 py-3 hover:[background-color:var(--pb-raised)]">
              <div className="flex-1 min-w-0">
                <p className="font-mono font-medium text-sm" style={{ color: 'var(--pb-text-1)' }}>{v.code}</p>
                <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{v.plan?.name ?? '—'}</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`px-2 py-1 rounded-full ${
                  v.status === 'unused' ? 'bg-green-100 text-green-700 dark:bg-green-900/40' :
                  v.status === 'redeemed' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-900/40'
                }`}>
                  {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => copyCode(v.code)}
                  className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  title="Copy code"
                >
                  <Copy size={14} className="text-blue-600" />
                </button>
                {v.status === 'unused' && (
                  <button
                    onClick={() => { if (confirm('Delete this voucher?')) deleteMutation.mutate(v.id) }}
                    className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                    title="Delete"
                  >
                    <Trash2 size={14} className="text-red-600" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generate Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setErrors({}) }} title="Generate Vouchers" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Plan <span className="text-red-500">*</span></label>
            <select
              value={form.plan_id}
              onChange={(e) => setForm(f => ({ ...f, plan_id: e.target.value }))}
              className={`input w-full ${errors.plan_id ? 'border-red-500' : ''}`}
              required
            >
              <option value="">Select a plan...</option>
              {planList.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
            {errors.plan_id && <p className="text-xs text-red-500 mt-1">{errors.plan_id}</p>}
          </div>

          <div>
            <label className="form-label">Quantity <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="1"
              max="1000"
              value={form.quantity}
              onChange={(e) => setForm(f => ({ ...f, quantity: parseInt(e.target.value) }))}
              className={`input w-full ${errors.quantity ? 'border-red-500' : ''}`}
              required
            />
            {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
          </div>

          <div>
            <label className="form-label">Expiry (Days)</label>
            <input
              type="number"
              min="1"
              max="365"
              value={form.expiry_days}
              onChange={(e) => setForm(f => ({ ...f, expiry_days: parseInt(e.target.value) }))}
              className="input w-full"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--pb-text-3)' }}>Leave blank for no expiry</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={generateMutation.isPending} className="btn-primary min-w-[120px]">
              {generateMutation.isPending ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}