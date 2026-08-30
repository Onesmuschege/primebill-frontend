import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getInvoices, createInvoice, deleteInvoice, downloadInvoicePdf } from '../../api/invoices.api'
import { createPayment } from '../../api/payments.api'
import { getClients } from '../../api/clients.api'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Modal from '../../components/common/Modal'
import Skeleton from '../../components/common/Skeleton'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { invoiceStatusBadge } from '../../utils/statusColors'
import { formatDate } from '../../utils/formatDate'
import { formatKES } from '../../utils/formatCurrency'
import { Plus, CreditCard, Trash2, Download } from 'lucide-react'
import toast from 'react-hot-toast'

const emptyInvoice = {
  client_id: '',
  due_date: '',
  items: [{ description: '', amount: '' }],
  notes: '',
}

export default function InvoiceList() {
  const [page, setPage]             = useState(1)
  const [status, setStatus]         = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showPay, setShowPay]       = useState(false)
  const [selected, setSelected]     = useState(null)
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoice)
  const [payForm, setPayForm]       = useState({ method: 'cash', reference: '' })
    const queryClient = useQueryClient()

  // ── Confirmation surface (replaces ad-hoc window.confirm) ──────────────────
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState('')
  const [pendingConfirm, setPendingConfirm] = useState(null)
  const askConfirm = (message, action) => {
    setConfirmMessage(message)
    setPendingConfirm(() => action)
    setConfirmOpen(true)
  }

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['invoices', page, status],
        queryFn: () => getInvoices({ page, status, per_page: 15 }),
  })

  // Fetch clients for the dropdown in create form
  // getClients() already calls unwrapList() internally → returns { data, meta }
  const { data: clientsData } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => getClients({ per_page: 200 }),
    enabled: showCreate,
  })

  const createMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      toast.success('Invoice created!')
      setShowCreate(false)
      setInvoiceForm(emptyInvoice)
      queryClient.invalidateQueries(['invoices'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create invoice'),
  })

    const deleteMutation = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      toast.success('Invoice deleted')
      queryClient.invalidateQueries(['invoices'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete invoice'),
  })

  const payMutation = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      toast.success('Payment recorded!')
      setShowPay(false)
      queryClient.invalidateQueries(['invoices'])
    },
    onError: () => toast.error('Failed to record payment'),
  })

  // Line item helpers
  const updateItem = (index, field, value) => {
    const items = [...invoiceForm.items]
    items[index] = { ...items[index], [field]: value }
    setInvoiceForm({ ...invoiceForm, items })
  }

  const addItem = () =>
    setInvoiceForm({ ...invoiceForm, items: [...invoiceForm.items, { description: '', amount: '' }] })

  const removeItem = (index) =>
    setInvoiceForm({ ...invoiceForm, items: invoiceForm.items.filter((_, i) => i !== index) })

  const invoiceTotal = invoiceForm.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)

  const handleCreateSubmit = (e) => {
    e.preventDefault()
    if (!invoiceForm.client_id) return toast.error('Please select a client')
    if (invoiceForm.items.some(i => !i.description || !i.amount))
      return toast.error('Please fill all line items')
    createMutation.mutate(invoiceForm)
  }

  const handlePay = () => {
    payMutation.mutate({
      client_id:  selected.client_id,
      invoice_id: selected.id,
      amount:     selected.total,
      method:     payForm.method,
      reference:  payForm.reference,
    })
  }

  const handleDownloadPdf = async (id, invoiceNumber) => {
    try {
      const res = await downloadInvoicePdf(id)
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `${invoiceNumber}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download PDF')
    }
  }

  const columns = [
    { key: 'invoice_number', label: 'Invoice #' },
    { key: 'client',         label: 'Client',  render: (r) => `${r.client?.first_name} ${r.client?.last_name}` },
    { key: 'total',          label: 'Amount',  render: (r) => formatKES(r.total) },
    { key: 'status',         label: 'Status',  render: (r) => <span className={invoiceStatusBadge(r.status)}>{r.status}</span> },
    { key: 'due_date',       label: 'Due Date', render: (r) => formatDate(r.due_date) },
    { key: 'actions',        label: 'Actions', render: (r) => (
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleDownloadPdf(r.id, r.invoice_number)}
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded"
          title="Download PDF"
        >
          <Download size={15} />
        </button>
        {r.status !== 'paid' && (
          <button
            onClick={() => { setSelected(r); setShowPay(true) }}
            className="flex items-center gap-1 text-xs btn-primary py-1 px-2"
          >
            <CreditCard size={12} /> Pay
          </button>
        )}
        {r.status !== 'paid' && (
          <button
                        onClick={() => askConfirm('Delete this invoice?', () => deleteMutation.mutate(r.id))}
            className="p-1 text-red-500 hover:bg-red-50 rounded"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    )},
  ]

    if (isError) {
    return (
      <ErrorState
        message={error?.message ?? 'Failed to load invoices'}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['invoices'] })}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
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

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <Table columns={columns} data={data?.data} loading={isLoading} />
        <Pagination meta={data?.meta} onPageChange={setPage} />
      </div>

      {/* ── Create Invoice Modal ── */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Invoice" size="lg">
        <form onSubmit={handleCreateSubmit} className="space-y-5">
          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
            <select
              value={invoiceForm.client_id}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, client_id: e.target.value })}
              className="input"
              required
            >
              <option value="">Select a client...</option>
              {clientsData?.data?.map(c => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name} — {c.phone}</option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
            <input
              type="date"
              value={invoiceForm.due_date}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
              className="input"
              required
            />
          </div>

          {/* Line Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Line Items *</label>
            <div className="space-y-2">
              {invoiceForm.items.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Description"
                    className="input flex-1"
                    required
                  />
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => updateItem(index, 'amount', e.target.value)}
                    placeholder="Amount"
                    className="input w-32"
                    min="0"
                    step="0.01"
                    required
                  />
                  {invoiceForm.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addItem}
              className="mt-2 text-sm text-primary-600 hover:underline"
            >
              + Add line item
            </button>
          </div>

          {/* Total */}
          <div className="flex justify-end">
            <p className="text-sm text-gray-500">
              Total: <span className="text-lg font-bold text-primary-600">{formatKES(invoiceTotal)}</span>
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={invoiceForm.notes}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
              className="input resize-none"
              rows={2}
              placeholder="Optional notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Pay Modal ── */}
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

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        message={confirmMessage}
        confirmLabel="Delete"
        destructive
        isPending={deleteMutation.isPending}
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