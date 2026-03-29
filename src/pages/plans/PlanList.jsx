import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPlans, createPlan, deletePlan } from '../../api/plans.api'
import Modal from '../../components/common/Modal'
import { formatKES } from '../../utils/formatCurrency'
import { Plus, Wifi, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner'

export default function PlanList() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({
    name: '', type: 'pppoe', speed_up: '', speed_down: '',
    price: '', validity_days: 30, is_active: true,
  })
  const queryClient = useQueryClient()

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => getPlans().then(r => r.data.data),
  })

  const createMutation = useMutation({
    mutationFn: createPlan,
    onSuccess: () => {
      toast.success('Plan created!')
      setShowForm(false)
      queryClient.invalidateQueries(['plans'])
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deletePlan,
    onSuccess: () => {
      toast.success('Plan deleted!')
      queryClient.invalidateQueries(['plans'])
    },
  })

  if (isLoading) return <div className="py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans?.map(plan => (
          <div key={plan.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                <Wifi size={20} />
              </div>
              <button
                onClick={() => { if (confirm('Delete this plan?')) deleteMutation.mutate(plan.id) }}
                className="text-red-400 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <h3 className="font-semibold text-gray-900">{plan.name}</h3>
            <p className="text-sm text-gray-500 mb-3">{plan.type.toUpperCase()}</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Upload</span>
                <span className="font-medium">{(plan.speed_up / 1024).toFixed(0)} Mbps</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Download</span>
                <span className="font-medium">{(plan.speed_down / 1024).toFixed(0)} Mbps</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Validity</span>
                <span className="font-medium">{plan.validity_days} days</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-xl font-bold text-primary-600">{formatKES(plan.price)}</p>
              <p className="text-xs text-gray-400">per {plan.validity_days} days</p>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add New Plan">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form) }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input">
                <option value="pppoe">PPPoE</option>
                <option value="hotspot">Hotspot</option>
                <option value="static">Static</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (KES) *</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Speed (Kbps) *</label>
              <input type="number" value={form.speed_up} onChange={(e) => setForm({ ...form, speed_up: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Download Speed (Kbps) *</label>
              <input type="number" value={form.speed_down} onChange={(e) => setForm({ ...form, speed_down: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Validity (Days)</label>
              <input type="number" value={form.validity_days} onChange={(e) => setForm({ ...form, validity_days: e.target.value })} className="input" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Saving...' : 'Save Plan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}