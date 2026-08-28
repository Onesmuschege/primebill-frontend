import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPayments, getPaymentSummary } from '../../api/payments.api'
import { getPaymentAllocations, createPaymentAllocation } from '../../api/payment-allocations.api'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import toast from 'react-hot-toast'
import { formatKES } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'
import { paymentMethodBadge } from '../../utils/statusColors'
import { DollarSign, Smartphone, Banknote, CreditCard } from 'lucide-react'

const statusVariant = (s) => {
  if (s === 'completed' || s === 'paid') return 'paid'
  if (s === 'pending' || s === 'pending_confirmation') return 'pending'
  if (s === 'failed' || s === 'reversed') return 'inactive'
  return 'inactive'
}

const EMPTY = { client_id: '', invoice_id: '', amount: '' }

export default function PaymentList() {
  const qc = useQueryClient()
  const [page, setPage]     = useState(1)
  const [method, setMethod] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page, method],
    queryFn: () => getPayments({ page, method, per_page: 50 }),
  })

  const { data: summary } = useQuery({
    queryKey: ['payment-summary'],
    queryFn: () => getPaymentSummary().then(r => r.data.data),
  })

  // per-page allocation context for the "Allocate" inline flow (mirrors PaymentAllocationsPage)
  const [allocOpen, setAllocOpen] = useState(null)
  const [allocForm, setAllocForm] = useState(EMPTY)
  const allocCreate = useMutation({
    mutationFn: () => createPaymentAllocation({
      payment_id: Number(allocOpen?.id),
      client_id: Number(allocForm.client_id),
      allocations: [{ invoice_id: Number(allocForm.invoice_id), amount: Number(allocForm.amount) }],
    }),
    onSuccess: (res) => {
      toast.success(res?.data?.message || 'Allocation created')
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['payment-allocations'] })
      setAllocOpen(null)
      setAllocForm(EMPTY)
    },
    onError: () => toast.error('Could not create allocation'),
  })

  const cols = useQuery({
    queryKey: ['payment-allocations-per-row'],
    queryFn: async () => {
      const rows = data?.data || []
      const out = {}
      await Promise.all(rows.map(async (r) => {
        try {
          const res = await getPaymentAllocations({ payment_id: r.id, per_page: 50 })
          const allocations = res?.data?.data || []
          const allocated = allocations.filter((a) => a.status === 'allocated').reduce((s, a) => s + Number(a.amount), 0)
          out[r.id] = { allocations, allocated }
        } catch {
          out[r.id] = { allocations: [], allocated: 0 }
        }
      }))
      return out
    },
    enabled: !!data?.data?.length,
    staleTime: 45_000,
  })

  const allocationsMap = cols.data || {}

  const columns = [
    {
      key: 'client', label: 'Client',
      render: (r) => `${r.client?.first_name || ''} ${r.client?.last_name || ''}`.trim() || '—',
    },
    { key: 'status', label: 'Status', render: (r) => <Badge label={r.status?.toUpperCase() || '—'} variant={statusVariant(r.status)} /> },
    { key: 'method', label: 'Method', render: (r) => (
      <span className={paymentMethodBadge(r.method)}>{r.method?.toUpperCase() || '—'}</span>
    )},
    {
      key: 'allocation', label: 'Allocation',
      render: (r) => {
        const entry = allocationsMap[r.id] || { allocations: [], allocated: 0 }
        const remaining = Number(r.amount) - entry.allocated
        const link = entry.allocations?.length ? `/payment-allocations?payment_id=${r.id}` : null
        return (
          <span className="flex flex-col text-sm">
            <span>{formatKES(entry.allocated)} allocated</span>
            <span style={{ color: 'var(--pb-text-3)' }}>{formatKES(remaining)} remaining</span>
            {link && (
              <a
                href={link}
                className="text-xs font-medium"
                style={{ color: '#2563eb' }}
                onClick={(e) => { e.preventDefault(); window.location.href = link }}
              >
                {entry.allocations.length} allocation{entry.allocations.length > 1 ? 's' : ''}
              </a>
            )}
          </span>
        )
      },
    },
    { key: 'amount', label: 'Amount', render: (r) => <span className="font-semibold text-primary-600">{formatKES(r.amount)}</span> },
    { key: 'mpesa_code', label: 'Reference', render: (r) => r.mpesa_code || r.reference || '—' },
    { key: 'created_at', label: 'Date', render: (r) => formatDateTime(r.created_at) },
    {
      key: 'actions', label: '',
      render: (r) => (
        <button
          onClick={(e) => { e.stopPropagation(); setAllocOpen(r); setAllocForm({ ...EMPTY, client_id: r.client?.id || '' }) }}
          className="p-1 rounded-lg text-xs"
          style={{ color: '#2563eb' }}
          title="Allocate to invoice"
        >
          <CreditCard size={14} />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-primary-50 rounded-xl text-primary-600"><DollarSign size={22} /></div>
          <div>
            <p className="text-sm text-gray-500">Total Payments</p>
            <p className="text-xl font-bold">{formatKES(summary?.total)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-xl text-green-600"><Smartphone size={22} /></div>
          <div>
            <p className="text-sm text-gray-500">M-Pesa</p>
            <p className="text-xl font-bold">{formatKES(summary?.mpesa)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Banknote size={22} /></div>
          <div>
            <p className="text-sm text-gray-500">Cash</p>
            <p className="text-xl font-bold">{formatKES(summary?.cash)}</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between">
        <select
          value={method}
          onChange={(e) => { setMethod(e.target.value); setPage(1) }}
          className="text-sm border rounded-lg px-3 py-2"
        >
          <option value="">All Methods</option>
          <option value="mpesa">M-Pesa</option>
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <Table columns={columns} data={data?.data} loading={isLoading} />
        <Pagination meta={data?.meta} onPageChange={setPage} />
      </div>

      <Modal
        isOpen={!!allocOpen}
        onClose={() => setAllocOpen(null)}
        title={`Allocate Payment #${allocOpen?.id ?? ''}`}
        size="md"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (!allocForm.invoice_id || !allocForm.amount) return
            allocCreate.mutate()
          }}
          className="space-y-4"
        >
          <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>
            Allocate all or part of this payment to an invoice. The mirror ledger entry is posted automatically.
          </p>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>Invoice ID</label>
            <input
              type="number"
              min="1"
              value={allocForm.invoice_id}
              onChange={(e) => setAllocForm({ ...allocForm, invoice_id: e.target.value })}
              className="input text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>Amount</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={allocForm.amount}
              onChange={(e) => setAllocForm({ ...allocForm, amount: e.target.value })}
              className="input text-sm"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAllocOpen(null)}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ background: 'var(--pb-raised)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={allocCreate.isPending}
              className="px-4 py-2 rounded-lg text-sm text-white"
              style={{ background: '#2563eb' }}
            >
              {allocCreate.isPending ? 'Allocating…' : 'Allocate'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
