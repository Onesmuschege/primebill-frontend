import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api, { unwrapList } from '../../api/axiosInstance'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Modal from '../../components/common/Modal'
import { formatKES } from '../../utils/formatCurrency'
import { Plus, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function InventoryList() {
  const [page, setPage]         = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({
    name: '', category: '', quantity: '', unit_cost: '',
    serial_number: '', low_stock_alert: 5,
  })
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', page],
    queryFn: () => api.get('/inventory', { params: { page } }).then(unwrapList),
  })

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/inventory', payload),
    onSuccess: () => {
      toast.success('Item added!')
      setShowForm(false)
      setForm({ name: '', category: '', quantity: '', unit_cost: '', serial_number: '', low_stock_alert: 5 })
      queryClient.invalidateQueries(['inventory'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add item'),
  })

  const lowStockCount = data?.data?.filter(i => i.quantity <= i.low_stock_alert).length || 0

  const columns = [
    { key: 'name',      label: 'Item',     render: (r) => (
      <span className="font-medium flex items-center gap-2">
        {r.quantity <= r.low_stock_alert && <AlertTriangle size={14} className="text-red-500" />}
        {r.name}
      </span>
    )},
    { key: 'category',  label: 'Category' },
    { key: 'quantity',  label: 'Qty',      render: (r) => (
      <span className={r.quantity <= r.low_stock_alert ? 'text-red-600 font-semibold' : ''}>{r.quantity}</span>
    )},
    { key: 'unit_cost', label: 'Unit Cost', render: (r) => formatKES(r.unit_cost) },
    { key: 'status',    label: 'Status',    render: (r) => (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        r.status === 'available' ? 'bg-green-100 text-green-700' :
        r.status === 'assigned'  ? 'bg-blue-100 text-blue-700' :
        'bg-gray-100 text-gray-600'
      }`}>{r.status}</span>
    )},
    { key: 'assigned',  label: 'Assigned To', render: (r) =>
      r.assigned_client ? `${r.assigned_client.first_name} ${r.assigned_client.last_name}` : '—'
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {lowStockCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            <AlertTriangle size={15} />
            {lowStockCount} item{lowStockCount > 1 ? 's' : ''} below low stock threshold
          </div>
        )}
        <div className="ml-auto">
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <Table columns={columns} data={data?.data} loading={isLoading} />
        <Pagination meta={data?.meta} onPageChange={setPage} />
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add Inventory Item">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form) }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'name',            label: 'Item Name',       required: true },
              { key: 'category',        label: 'Category',        required: true },
              { key: 'quantity',        label: 'Quantity',        required: true, type: 'number' },
              { key: 'unit_cost',       label: 'Unit Cost (KES)', required: true, type: 'number' },
              { key: 'serial_number',   label: 'Serial Number' },
              { key: 'low_stock_alert', label: 'Low Stock Alert', type: 'number' },
            ].map(({ key, label, required, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {label} {required && <span className="text-red-500">*</span>}
                </label>
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