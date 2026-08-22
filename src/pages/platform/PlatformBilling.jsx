import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  getPlatformInvoices,
  getPlatformInvoice,
  downloadPlatformInvoicePdf,
  markPlatformInvoicePaid,
  voidPlatformInvoice,
  resendPlatformInvoice,
  sendPlatformInvoice,
  generatePlatformInvoices,
  getPlatformBillingStats,
} from '../../api/platform.api'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Modal from '../../components/common/Modal'
import Spinner from '../../components/common/Spinner'
import StatCard from '../../components/dashboard/StatCard'
import { formatDate } from '../../utils/formatDate'
import { formatKES } from '../../utils/formatCurrency'
import { CreditCard, Download, Eye, RefreshCw, Search } from 'lucide-react'

/**
 * PrimeBill Platform Console — Advanced Billing.
 *
 * Lists the invoices PrimeBill issues to its tenant ISPs for their PrimeBill
 * subscription — separate from the tenant-side billing this app otherwise
 * serves. Admins can run the monthly generation on demand, open a detail
 * view, mark paid / void / resend, and download the PDF.
 *
 * All rows span every tenant; the backend's `platform_admin` middleware
 * guarantees cross-tenant scoping server-side.
 */
const STATUS_BADGE = {
  draft: { bg: 'rgba(241,245,249,0.9)', color: '#475569' },
  sent: { bg: 'rgba(219,234,254,0.9)', color: '#1d4ed8' },
  paid: { bg: 'rgba(220,252,231,0.9)', color: '#15803d' },
  overdue: { bg: 'rgba(254,226,226,0.9)', color: '#b91c1c' },
  void: { bg: 'rgba(241,245,249,0.9)', color: '#475569' },
}

const STATUS_FILTERS = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'void', label: 'Void' },
]

function StatusBadge({ status }) {
  const style = STATUS_BADGE[status] || STATUS_BADGE.sent
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-semibold uppercase"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {status}
    </span>
  )
}

export default function PlatformBilling() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [tenantSearch, setTenantSearch] = useState('')
  const [period, setPeriod] = useState('')
  const [selected, setSelected] = useState(null)
  const [payRef, setPayRef] = useState('')
  const [voidReason, setVoidReason] = useState('')

  // Paginated invoice list. The backend returns a Laravel paginator, so
  // `r.data.data` is the paginator object itself: `.data` holds the rows and
  // the flat current_page / last_page / total fields feed <Pagination>.
  const { data: paginator, isLoading, isError } = useQuery({
    queryKey: ['platform-billing-invoices', page, statusFilter, tenantSearch],
    queryFn: () =>
      getPlatformInvoices({
        page,
        status: statusFilter,
        tenant: tenantSearch,
        per_page: 15,
      }).then((r) => r.data.data),
    keepPreviousData: true,
  })

  const invoices = useMemo(() => paginator?.data ?? [], [paginator])

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['platform-billing-stats'],
    queryFn: () => getPlatformBillingStats().then((r) => r.data.data),
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['platform-billing-invoices'] })
    queryClient.invalidateQueries({ queryKey: ['platform-billing-stats'] })
  }

  const generateMutation = useMutation({
    mutationFn: (payload) => generatePlatformInvoices(payload),
    onSuccess: (res) => {
      toast.success(`${res?.data?.data?.invoices ?? 0} platform invoice(s) generated`)
      refresh()
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Failed to generate invoices'),
  })

  const markPaidMutation = useMutation({
    mutationFn: ({ id, reference }) => markPlatformInvoicePaid(id, { reference }),
    onSuccess: () => {
      toast.success('Invoice marked paid')
      setSelected(null)
      refresh()
    },
    onError: () => toast.error('Failed to mark invoice paid'),
  })

  const voidMutation = useMutation({
    mutationFn: ({ id, reason }) => voidPlatformInvoice(id, { reason }),
    onSuccess: () => {
      toast.success('Invoice voided')
      setSelected(null)
      refresh()
    },
    onError: () => toast.error('Failed to void invoice'),
  })

  const resendMutation = useMutation({
    mutationFn: resendPlatformInvoice,
    onSuccess: () => toast.success('Invoice delivery queued'),
    onError: () => toast.error('Failed to resend invoice'),
  })

  const sendMutation = useMutation({
    mutationFn: sendPlatformInvoice,
    onSuccess: () => {
      toast.success('Invoice sent; delivery queued')
      refresh()
    },
    onError: () => toast.error('Failed to send invoice'),
  })

  const openDetail = async (invoice) => {
    setSelected({ ...invoice, loading: true })
    try {
      const res = await getPlatformInvoice(invoice.id)
      setSelected(res.data.data)
    } catch {
      toast.error('Could not load invoice details')
      setSelected(null)
    }
  }

  const handleGenerate = () => {
    generateMutation.mutate({ period: period || undefined })
  }

  const handleMarkPaid = () => {
    markPaidMutation.mutate({ id: selected.invoice.id, reference: payRef })
    setPayRef('')
  }

  const handleVoid = () => {
    voidMutation.mutate({ id: selected.invoice.id, reason: voidReason })
    setVoidReason('')
  }

  const handleResend = () => {
    if (!selected.invoice.recipients?.email) {
      toast.error('No billing email on file for this tenant')
      return
    }
    resendMutation.mutate(selected.invoice.id)
  }

  const handleSend = () => {
    sendMutation.mutate(selected.invoice.id)
  }

  const handleDownloadPdf = async (invoice) => {
    try {
      const res = await downloadPlatformInvoicePdf(invoice.id)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoice.invoice_number}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Could not download PDF')
    }
  }

    const columns = [
    {
      key: 'invoice_number',
      label: 'Invoice',
      render: (r) => (
        <button
          onClick={() => openDetail(r)}
          className="font-medium text-blue-400 hover:text-blue-300 text-left"
        >
          {r.invoice_number}
        </button>
      ),
    },
    {
      key: 'billing_period',
      label: 'Period',
      render: (r) => (
        <span style={{ color: 'var(--pb-text-2)' }}>{r.billing_period || '—'}</span>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      render: (r) => (
        <span style={{ color: 'var(--pb-text-1)', fontWeight: 500 }}>
          {formatKES(r.total)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (r) => (
        <span style={{ color: 'var(--pb-text-3)' }}>
          {r.due_date ? formatDate(r.due_date) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <button
          onClick={() => openDetail(r)}
          className="p-1 rounded-lg transition-colors"
          style={{ color: 'var(--pb-text-3)' }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = 'var(--pb-raised)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = 'transparent')
          }
          aria-label={`View ${r.invoice_number}`}
        >
          <Eye size={16} />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--pb-text-1)' }}>
            <CreditCard size={18} style={{ color: '#a78bfa' }} />
            Platform Billing
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pb-text-2)' }}>
            The PrimeBill ISP Platform's own invoices for its tenant ISPs — separate from tenant-side billing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="Period"
            className="input text-sm py-1.5 w-40"
            aria-label="Billing period"
          />
          <button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="btn-secondary flex items-center gap-1.5 text-sm py-1.5"
          >
            <RefreshCw size={14} className={generateMutation.isPending ? 'animate-spin' : ''} />
            {generateMutation.isPending ? 'Generating…' : 'Generate Invoices'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="py-8"><Spinner size="md" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Invoices"
            value={stats?.total_invoices ?? 0}
            subtitle="All time"
            icon={CreditCard}
            color="purple"
          />
          <StatCard
            title="Outstanding"
            value={formatKES(stats?.outstanding_total)}
            subtitle="Draft + sent + overdue"
            icon={CreditCard}
            color="orange"
          />
          <StatCard
            title="Paid This Month"
            value={formatKES(stats?.paid_this_month)}
            subtitle="Marked paid in current month"
            icon={CreditCard}
            color="green"
          />
          <StatCard
            title="Overdue"
            value={stats?.overdue_count ?? 0}
            subtitle="Past their due date"
            icon={CreditCard}
            color="red"
          />
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--pb-text-3)' }} />
            <input
              value={tenantSearch}
              onChange={(e) => {
                setTenantSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Tenant name or slug"
              className="input pl-9 w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="input w-full"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button
            onClick={() => {
              setStatusFilter('')
              setTenantSearch('')
              setPage(1)
            }}
            className="btn-secondary"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-16"><Spinner size="md" /></div>
        ) : isError ? (
          <div className="py-16 text-sm text-center" style={{ color: 'var(--pb-text-3)' }}>
            Failed to load platform invoices. Please try again.
          </div>
        ) : (
          <>
            <Table columns={columns} data={invoices} emptyMessage="No platform invoices match your filters" />
            <Pagination meta={paginator || {}} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Detail modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.invoice?.invoice_number || 'Platform Invoice'}
        size="lg"
      >
        {!selected || selected.loading ? (
          <div className="py-12"><Spinner size="md" /></div>
        ) : (
          (() => {
            const inv = selected.invoice
            const rec = selected.recipients || {}
            const items = inv.items || []
            const canAct = inv.status !== 'paid' && inv.status !== 'void'
            return (
              <div className="space-y-5">
                {/* Tenant + status */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--pb-text-3)' }}>Tenant</p>
                    <p className="font-semibold" style={{ color: 'var(--pb-text-1)' }}>{inv.tenant?.name || '—'}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--pb-text-3)' }}>
                      Billing contact: {rec.name || '—'}{rec.email ? ` · ${rec.email}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>

                {/* Meta */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>Period</p>
                    <p style={{ color: 'var(--pb-text-1)' }}>{inv.billing_period || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>Issue Date</p>
                    <p style={{ color: 'var(--pb-text-1)' }}>{inv.issue_date ? formatDate(inv.issue_date) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>Due Date</p>
                    <p style={{ color: 'var(--pb-text-1)' }}>{inv.due_date ? formatDate(inv.due_date) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>Paid At</p>
                                        <p style={{ color: 'var(--pb-text-1)' }}>{inv.paid_at ? formatDate(inv.paid_at) : '—'}</p>
                  </div>
                </div>

                {/* Line items */}
                <div className="card p-0 overflow-hidden">
                  <table className="table w-full text-sm">
                    <thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Amount</th></tr></thead>
                    <tbody>
                      {items.length === 0 && (
                        <tr><td colSpan={4} className="px-4 py-6 text-center" style={{ color: 'var(--pb-text-3)' }}>No line items.</td></tr>
                      )}
                      {items.map((it) => (
                        <tr key={it.id}>
                          <td style={{ color: 'var(--pb-text-1)' }}>{it.description}</td>
                          <td style={{ color: 'var(--pb-text-2)' }}>{it.quantity}</td>
                          <td style={{ color: 'var(--pb-text-3)' }}>{formatKES(it.unit_price)}</td>
                          <td style={{ color: 'var(--pb-text-1)' }}>{formatKES(it.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-full sm:w-64 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--pb-text-3)' }}>Subtotal</span>
                      <span style={{ color: 'var(--pb-text-1)' }}>{formatKES(inv.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--pb-text-3)' }}>Tax</span>
                      <span style={{ color: 'var(--pb-text-1)' }}>{formatKES(inv.tax_amount)}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-1.5" style={{ borderTop: '1px solid var(--pb-border)', color: 'var(--pb-text-1)' }}>
                      <span>Total</span>
                      <span>{formatKES(inv.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-3" style={{ borderTop: '1px solid var(--pb-border)' }}>
                  {canAct && (
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          value={payRef}
                          onChange={(e) => setPayRef(e.target.value)}
                          placeholder="Payment reference (optional)"
                          className="input text-sm flex-1 min-w-[180px]"
                        />
                        <button onClick={handleMarkPaid} disabled={markPaidMutation.isPending} className="btn-primary text-sm py-1.5">
                          {markPaidMutation.isPending ? 'Saving…' : 'Mark Paid'}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          value={voidReason}
                          onChange={(e) => setVoidReason(e.target.value)}
                          placeholder="Void reason (optional)"
                          className="input text-sm flex-1 min-w-[180px]"
                        />
                        <button
                          onClick={handleVoid}
                          disabled={voidMutation.isPending}
                          className="btn-secondary text-sm py-1.5"
                          style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.4)' }}
                        >
                          {voidMutation.isPending ? 'Voiding…' : 'Void Invoice'}
                        </button>
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {inv.status === 'draft' && (
                      <button onClick={handleSend} disabled={sendMutation.isPending} className="btn-secondary text-sm py-1.5">
                        {sendMutation.isPending ? 'Sending…' : 'Send Invoice'}
                      </button>
                    )}
                    <button onClick={handleResend} disabled={resendMutation.isPending} className="btn-secondary text-sm py-1.5">
                      Resend Email
                    </button>
                    <button onClick={() => handleDownloadPdf(inv)} className="btn-secondary text-sm py-1.5 flex items-center gap-1.5">
                      <Download size={14} /> Download PDF
                    </button>
                  </div>
                </div>
              </div>
            )
          })()
        )}
      </Modal>
    </div>
  )
}


