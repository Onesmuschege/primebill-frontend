import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getInvoices, createInvoice } from '../../api/invoices.api'
import { createPayment } from '../../api/payments.api'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Modal from '../../components/common/Modal'
import { invoiceStatusBadge } from '../../utils/statusColors'
import { formatDate } from '../../utils/formatDate'
import { formatKES } from '../../utils/formatCurrency'
import { Plus, CreditCard, Search } from 'lucide-react'
import toast from 'react-hot-toast'

export default function InvoiceList() {
  const [page, setPage]             = useState(1)
  const [status, setStatus]         = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showPay, setShowPay]       = useState(false)
  const [selected, setSelected]     = useState(null)
  const [payForm, setPayForm]       = useState({ method: 'cash', reference: '' })
  const queryClient                 = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, status],
    queryFn: () => getInvoices({ page, status, per_page: 15 }).then(r => r.data.data),
  })

  const payMutation = useMutation({
    mutationFn: (data) => createPayment(data),
    onSuccess: () => {
      toast.success('Payment recorded!')
      setShowPay(false)
      queryClient.invalidateQueries(['invoices'])
    },
    onError: () => toast.error('Failed to record payment'),
  })

  const handlePay = () => {
    payMutation.mutate({
      client_id:  selected.client_id,
      invoice_id: selected.id,
      amount:     selected.total,
      method:     payForm.method,
      reference:  payForm.reference,
    })
  }

  const columns = [
    { key: 'invoice_number', label: 'Invoice #' },
    { key: 'client',         label: 'Client', render: (r) => `${r.client?.first_name} ${r.client?.last_name}` },
    { key: 'total',          label: 'Amount', render: (r) => formatKES(r.total) },
    { key: 'status',         label: 'Status', render: (r) => <span className={invoiceStatusBadge(r.status)}>{r.status}</span> },
    { key: 'due_date',       label: 'Due Date', render: (r) => formatDate(r.due_date) },
    { key: 'actions',        label: 'Actions', render: (r) => (
      r.status !== 'paid' && (
        <button
          onClick={() => { setSelected(r); setShowPay(true) }}
          className="flex items-center gap-1 text-xs btn-primary py-1 px-2"
        >
          <CreditCard size={12} /> Pay
        </button>
      )
    )},
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Status</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Invoice
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <Table columns={columns} data={data?.data} loading={isLoading} />
        <Pagination meta={data?.meta} onPageChange={setPage} />
      </div>

      {/* Pay Modal */}
      <Modal isOpen={showPay} onClose={() => setShowPay(false)} title={`Pay ${selected?.invoice_number}`}>
        <div className="space-y-4">
          <p className="text-2xl font-bold text-primary-600">{formatKES(selected?.total)}</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={payForm.method}
              onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
              className="input"
            >
              <option value="cash">Cash</option>
              <option value="mpesa">M-Pesa</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {payForm.method === 'mpesa' ? 'M-Pesa Code' : 'Reference'}
            </label>
            <input
              value={payForm.reference}
              onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })}
              className="input"
              placeholder={payForm.method === 'mpesa' ? 'QGH7XXXXX' : 'Optional reference'}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowPay(false)} className="btn-secondary">Cancel</button>
            <button onClick={handlePay} disabled={payMutation.isPending} className="btn-primary">
              {payMutation.isPending ? 'Processing...' : 'Record Payment'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}