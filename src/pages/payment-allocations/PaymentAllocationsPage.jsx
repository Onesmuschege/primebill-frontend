import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPaymentAllocations,
  createPaymentAllocation,
  reversePaymentAllocation,
} from '../../api/payment-allocations.api'
import { getPayments } from '../../api/payments.api'
import { getClients } from '../../api/clients.api'
import { getInvoices } from '../../api/invoices.api'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Modal from '../../components/common/Modal'
import Badge from '../../components/common/Badge'
import toast from 'react-hot-toast'
import { formatKES } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'
import { ArrowRightLeft, Plus } from 'lucide-react'

const EMPTY = {
  payment_id: '',
  client_id: '',
  reference: '',
  allocations: [{ invoice_id: '', amount: '' }],
}

// Normalise a Laravel paginator/list response into { data: [], meta: {} }.
const normalise = (res) => {
  const body = res?.data
  // store → { success, message, data: [allocations] } (array directly)
  if (Array.isArray(body)) return { data: body, meta: {} }
  // list → { success, data: paginator } where paginator may be { data:[], ...}
  if (body && Array.isArray(body.data)) {
    const page = body.data
    const rows = Array.isArray(page.data) ? page.data : page
    const meta = page.meta || page || {}
    return {
      data: rows,
      meta: {
        current_page: meta.current_page,
        last_page: meta.last_page,
        total: meta.total,
        from: meta.from,
        to: meta.to,
      },
    }
  }
  return { data: [], meta: {} }
}

const statusVariant = (s) => {
  if (s === 'allocated') return 'active'
  if (s === 'reversed') return 'suspended'
  return 'inactive'
}

export default function PaymentAllocationsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [modal, setModal] = useState(false)
  const [reverseOpen, setReverseOpen] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [reason, setReason] = useState('')


  // ── List ──────────────────────────────────────────────────────────────
  const listQuery = useQuery({
    queryKey: ['payment-allocations', page, status, from, to],
    queryFn: async () => {
      const res = await getPaymentAllocations({
        page,
        per_page: 20,
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
      })
      return normalise(res)
    },
  })

  // ── Pickers (for the create form) ─────────────────────────────────────
  const payments = useQuery({
    queryKey: ['payments-for-allocation'],
    queryFn: async () => {
      const res = await getPayments({ status: 'completed', per_page: 100 })
      return res.data || []
    },
    enabled: modal,
  })
  const clients = useQuery({
    queryKey: ['clients-for-allocation'],
    queryFn: async () => {
      const res = await getClients({ per_page: 100 })
      return res.data || []
    },
    enabled: modal,
  })
  const invoiceOptions = useQuery({
    queryKey: ['invoices-for-allocation', form.client_id],
        queryFn: async () => {
      const res = await getInvoices({ client_id: form.client_id || undefined, status: 'unpaid', per_page: 100 })
      return Array.isArray(res?.data) ? res.data : []
    },
    enabled: !!modal && !!form.client_id,
  })

  // ── Mutations ─────────────────────────────────────────────────────────
  const create = useMutation({
    mutationFn: () => {
      const allocations = form.allocations
        .filter((l) => l.invoice_id && Number(l.amount) > 0)
        .map((l) => ({ invoice_id: Number(l.invoice_id), amount: Number(l.amount) }))
      return createPaymentAllocation({
        payment_id: Number(form.payment_id),
        client_id: Number(form.client_id),
        reference: form.reference || undefined,
        allocations,
      })
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Payment allocated successfully')
      setModal(false)
      setForm(EMPTY)
      qc.invalidateQueries(['payment-allocations', 'payments', 'invoices'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Allocation failed'),
  })

  const reverse = useMutation({
    mutationFn: () => reversePaymentAllocation(reverseOpen.id, { reason: reason || undefined }),
    onSuccess: (res) => {
      toast.success(res.message || 'Allocation reversed')
      setReverseOpen(null)
      setReason('')
      qc.invalidateQueries(['payment-allocations'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Reverse failed'),
  })

  const rows = listQuery.data?.data || []
  const paymentRows = Array.isArray(payments.data) ? payments.data : []
  const clientRows = Array.isArray(clients.data) ? clients.data : []
  const invRows = Array.isArray(invoiceOptions.data) ? invoiceOptions.data : []

  const addAllocLine = () =>
    setForm((f) => ({ ...f, allocations: [...f.allocations, { invoice_id: '', amount: '' }] }))
  const setAllocLine = (idx, key, value) =>
    setForm((f) => ({
      ...f,
      allocations: f.allocations.map((l, i) => (i === idx ? { ...l, [key]: value } : l)),
    }))

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ background: 'rgba(37,99,235,0.1)' }}>
            <ArrowRightLeft size={20} style={{ color: '#2563eb' }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Payment Allocations</h2>
            <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>
              Split collected payments across one or more invoices
            </p>
          </div>
        </div>
        <button
          onClick={() => setModal(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2"
          style={{ background: '#2563eb' }}
        >
          <Plus size={15} /> New Allocation
        </button>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="input text-sm w-40"
        >
          <option value="">All statuses</option>
          <option value="allocated">Allocated</option>
          <option value="reversed">Reversed</option>
        </select>
        <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} className="input text-sm" title="From" />
        <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} className="input text-sm" title="To" />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <Table
          loading={listQuery.isLoading}
          data={rows}
          emptyMessage="No payment allocations found"
          columns={[
            { key: 'id', label: 'ID' },
            {
              key: 'payment',
              label: 'Payment',
              render: (r) => r.payment ? `${formatKES(r.payment.amount)} · ${r.payment.method ?? ''}`.trim() : `#${r.payment_id}`,
            },
            {
              key: 'invoice',
              label: 'Invoice',
              render: (r) => r.invoice ? `#${r.invoice.invoice_number || r.invoice.id}` : `#${r.invoice_id}`,
            },
            {
              key: 'client',
              label: 'Client',
              render: (r) => r.client ? `${r.client.first_name} ${r.client.last_name}`.trim() : `#${r.client_id}`,
            },
            { key: 'amount', label: 'Amount', render: (r) => <span className="font-semibold">{formatKES(r.amount)}</span> },
            { key: 'status', label: 'Status', render: (r) => <Badge label={r.status} variant={statusVariant(r.status)} /> },
            { key: 'created_at', label: 'Date', render: (r) => r.created_at ? formatDateTime(r.created_at) : '—' },
            {
              key: 'actions',
              label: '',
              render: (r) => (
                <div className="flex items-center justify-end">
                  {r.status !== 'reversed' && (
                    <button
                      onClick={() => setReverseOpen(r)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-white"
                      style={{ background: '#f59e0b' }}
                    >
                      Reverse
                    </button>
                  )}
                </div>
              ),
            },
          ]}
        />
        <Pagination meta={listQuery.data?.meta} onPageChange={setPage} />
      </div>


      {/* Create modal */}
      <Modal isOpen={!!modal} onClose={() => setModal(false)} title="New Payment Allocation" size="lg">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate() }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>Client *</label>
              <select
                value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value, allocations: [{ invoice_id: '', amount: '' }] })}
                className="input text-sm"
                required
              >
                <option value="">Select client</option>
                {clientRows.map((c) => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>Payment *</label>
              <select
                value={form.payment_id}
                onChange={(e) => {
                  const sel = paymentRows.find((p) => String(p.id) === e.target.value)
                  setForm((f) => ({
                    ...f,
                    payment_id: e.target.value,
                    client_id: sel?.client_id ? String(sel.client_id) : f.client_id,
                  }))
                }}
                className="input text-sm"
                required
              >
                <option value="">Select completed payment</option>
                {paymentRows.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.id} · {formatKES(p.amount)} {p.method ? `· ${p.method}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>Reference (optional)</label>
            <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="input text-sm" placeholder="e.g. manual split" />
          </div>


          <div className="space-y-2">
            <label className="block text-xs font-medium" style={{ color: 'var(--pb-text-2)' }}>Allocate to invoices *</label>
            {form.allocations.map((line, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_180px_auto] gap-2 items-center">
                <select
                  value={line.invoice_id}
                  onChange={(e) => setAllocLine(idx, 'invoice_id', e.target.value)}
                  className="input text-sm"
                  required
                >
                  <option value="">Select invoice</option>
                  {invRows.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      #{inv.invoice_number || inv.id} · {formatKES(inv.total || inv.grand_total || inv.amount)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={line.amount}
                  onChange={(e) => setAllocLine(idx, 'amount', e.target.value)}
                  className="input text-sm"
                  placeholder="Amount"
                  required
                />
                <button
                  type="button"
                  onClick={() => form.allocations.length > 1 && setForm((f) => ({ ...f, allocations: f.allocations.filter((_, i) => i !== idx) }))}
                  className="p-2 rounded-lg text-xs"
                  style={{ color: '#dc2626' }}
                  disabled={form.allocations.length === 1}
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" onClick={addAllocLine} className="text-sm font-medium" style={{ color: '#2563eb' }}>
              + Add invoice line
            </button>
            {!form.client_id && <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>Select a client to load its unpaid invoices.</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--pb-raised)' }}>Cancel</button>
            <button
              type="submit"
              disabled={create.isPending}
              className="px-4 py-2 rounded-lg text-sm text-white"
              style={{ background: '#2563eb' }}
            >
              {create.isPending ? 'Allocating…' : 'Allocate Payment'}
            </button>
          </div>
        </form>
      </Modal>


      {/* Reverse modal */}
      <Modal isOpen={!!reverseOpen} onClose={() => setReverseOpen(null)} title={`Reverse Allocation #${reverseOpen?.id ?? ''}`} size="md">
        <form onSubmit={(e) => { e.preventDefault(); reverse.mutate() }} className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>
            Reversing will post the mirror ledger pair and mark this allocation as reversed. This cannot be undone.
          </p>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>Reason (optional)</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="input text-sm" rows={3} placeholder="e.g. applied to wrong invoice" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setReverseOpen(null)} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--pb-raised)' }}>Cancel</button>
            <button type="submit" disabled={reverse.isPending} className="px-4 py-2 rounded-lg text-sm text-white" style={{ background: '#f59e0b' }}>
              {reverse.isPending ? 'Reversing…' : 'Reverse Allocation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

