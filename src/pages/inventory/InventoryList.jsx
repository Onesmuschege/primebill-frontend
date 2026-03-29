import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/axiosInstance'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Modal from '../../components/common/Modal'
import { formatKES } from '../../utils/formatCurrency'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function InventoryList() {
  const [page, setPage]     = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]     = useState({ name: '', category: '', quantity: '', unit_cost: '', serial_number: '', low_stock_alert: 5 })
  const queryClient         = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', page],
    queryFn: () => api.get('/inventory', { params: { page } }).then(r => r.data.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/inventory', data),
    onSuccess: () => {
      toast.success('Item added!')
      setShowForm(false)
      queryClient.invalidateQueries(['inventory'])
    },
  })

  const columns = [
    { key: 'name',      label: 'Item',      render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'category',  label: 'Category' },
    { key: 'quantity',  label: 'Qty',       render: (r) => (
      <span className={r.quantity <= r.low_stock_alert ? 'text-red-600 font-semibold' : ''}>
        {r.quantity}
      </span>
    )},
    { key: 'unit_cost', label: 'Unit Cost', render: (r) => formatKES(r.unit_cost) },
    { key: 'status',    label: 'Status',    render: (r) => <span className="badge-inactive">{r.status}</span> },
    { key: 'assigned',  label: 'Assigned To', render: (r) => r.assigned_client ? `${r.assigned_client.first_name} ${r.assigned_client.last_name}` : '—' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Item
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <Table columns={columns} data={data?.data} loading={isLoading} />
        <Pagination meta={data?.meta} onPageChange={setPage} />
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add Inventory Item">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form) }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'name',            label: 'Item Name',     required: true },
              { key: 'category',        label: 'Category',      required: true },
              { key: 'quantity',        label: 'Quantity',      required: true, type: 'number' },
              { key: 'unit_cost',       label: 'Unit Cost (KES)',required: true, type: 'number' },
              { key: 'serial_number',   label: 'Serial Number' },
              { key: 'low_stock_alert', label: 'Low Stock Alert', type: 'number' },
            ].map(({ key, label, required, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type={type || 'text'}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="input"
                  required={required}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}