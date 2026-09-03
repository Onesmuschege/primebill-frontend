import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBillingOperations } from '../../hooks/useBillingOperations'
import EntityHeader from '../../components/ops/EntityHeader'
import SavedViewsBar from '../../components/ops/SavedViewsBar'
import { formatKES } from '../../utils/formatCurrency'
import { formatDate, timeAgo } from '../../utils/formatDate'
import {
  AlertTriangle, FileText, CreditCard, Clock, XCircle, DollarSign, CheckCircle,
} from 'lucide-react'

function SummaryCard({ icon, label, value, sub, tone }) {
  const Icon = icon
  const colors = {
    danger: { fg: '#f87171', bg: 'rgba(248,113,113,0.12)' },
    warning: { fg: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
    info: { fg: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
    success: { fg: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  }
  const c = colors[tone] || colors.info
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg" style={{ background: c.bg }}>
        <Icon size={18} style={{ color: c.fg }} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: 'var(--pb-text-1)' }}>{value}</p>
        <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{label} {sub && <span className="font-medium">{sub}</span>}</p>
      </div>
    </div>
  )
}

function AgingBar({ label, amount, count, tone }) {
  const colors = { info: '#60a5fa', warning: '#fbbf24', danger: '#f87171', muted: '#94a3b8' }
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 text-xs" style={{ color: 'var(--pb-text-3)' }}>{label}</div>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--pb-raised)' }}>
        <div className="h-full rounded-full" style={{ background: colors[tone] || colors.muted, width: amount ? '100%' : '0%' }} />
      </div>
      <div className="w-24 text-right text-xs font-medium" style={{ color: 'var(--pb-text-2)' }}>{formatKES(amount)}</div>
      <div className="w-16 text-right text-xs" style={{ color: 'var(--pb-text-3)' }}>{count} inv</div>
    </div>
  )
}

export default function BillingOperations() {
  const navigate = useNavigate()
  const { overdueInvoices, failedPayments, unallocatedPayments, aging, loading, counts, totals } = useBillingOperations()
  const [activeTab, setActiveTab] = useState('exceptions')
  const agingBuckets = aging?.buckets || []
  const tabs = [
    { key: 'exceptions', label: 'Exceptions', count: counts.overdue + counts.unpaid + counts.failedPayments },
    { key: 'unallocated', label: 'Unallocated', count: counts.unallocated },
    { key: 'aging', label: 'Aging', count: agingBuckets.length },
  ]
  // Saved-view integration (P2 §21) — persists the active tab as the
  // operator's device-local Billing Operations view.
  const applySavedView = (cfg) => {
    if (cfg?.tab && tabs.some((t) => t.key === cfg.tab)) setActiveTab(cfg.tab)
  }
  return (
    <div className="space-y-6">
      <EntityHeader title="Billing Operations" subtitle="Financial exceptions requiring action" icon={DollarSign}
        meta={[{ label: 'Overdue', value: formatKES(totals.overdue) }, { label: 'Unpaid', value: formatKES(totals.unpaid) }]}
        lastUpdated={loading ? 'Loading…' : `Updated ${new Date().toLocaleTimeString('en-KE')}`} />
      <SavedViewsBar viewType="billing-operations" config={{ tab: activeTab }} onApply={applySavedView} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard icon={AlertTriangle} label="Overdue" value={counts.overdue} sub={formatKES(totals.overdue)} tone="danger" />
        <SummaryCard icon={Clock} label="Unpaid" value={counts.unpaid} sub={formatKES(totals.unpaid)} tone="warning" />
        <SummaryCard icon={XCircle} label="Failed Payments" value={counts.failedPayments} tone="danger" />
        <SummaryCard icon={CreditCard} label="Unallocated" value={counts.unallocated} tone="info" />
      </div>
      <div className="card overflow-hidden">
        <div className="flex border-b" style={{ borderColor: 'var(--pb-border)' }}>
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2.5 text-sm font-medium transition-colors"
              style={{ color: activeTab === tab.key ? '#818cf8' : 'var(--pb-text-3)', borderBottom: activeTab === tab.key ? '2px solid #818cf8' : '2px solid transparent' }}>
              {tab.label}
              {tab.count > 0 && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>{tab.count}</span>}
            </button>
          ))}
        </div>
        <div className="p-4">
          {activeTab === 'exceptions' && <ExceptionsView overdueInvoices={overdueInvoices} failedPayments={failedPayments} loading={loading} onNavigate={navigate} />}
          {activeTab === 'unallocated' && <UnallocatedView payments={unallocatedPayments} loading={loading} onNavigate={navigate} />}
          {activeTab === 'aging' && <AgingView aging={aging} loading={loading} />}
        </div>
      </div>
    </div>
  )
}

function ExceptionsView({ overdueInvoices, failedPayments, loading, onNavigate }) {
  if (loading) return <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>Loading…</p>
  if (overdueInvoices.length === 0 && failedPayments.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle size={28} className="mx-auto mb-2" style={{ color: '#34d399' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--pb-text-2)' }}>All clear</p>
        <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>No overdue invoices or failed payments.</p>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {overdueInvoices.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--pb-text-1)' }}>Overdue ({overdueInvoices.length})</h4>
          <div className="space-y-2">
            {overdueInvoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg gap-3" style={{ background: 'var(--pb-raised)' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={16} style={{ color: '#f87171' }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--pb-text-1)' }}>{inv.invoice_number}</p>
                    <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{inv.client?.first_name} {inv.client?.last_name} · Due {formatDate(inv.due_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {inv.dunningStep && <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>{inv.dunningStep}</span>}
                  <span className="text-sm font-bold" style={{ color: '#f87171' }}>{formatKES(inv.balance)}</span>
                  <button onClick={() => onNavigate(`/clients/${inv.client_id}`)} className="text-xs underline" style={{ color: '#818cf8' }}>View</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {failedPayments.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--pb-text-1)' }}>Failed Payments ({failedPayments.length})</h4>
          <div className="space-y-2">
            {failedPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg gap-3" style={{ background: 'var(--pb-raised)' }}>
                <div className="flex items-center gap-3">
                  <XCircle size={16} style={{ color: '#f87171' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--pb-text-1)' }}>{p.reference || `PAY-${p.id}`}</p>
                    <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{p.client?.first_name} {p.client?.last_name} · {timeAgo(p.created_at)}</p>
                  </div>
                </div>
                <span className="text-sm font-bold shrink-0" style={{ color: 'var(--pb-text-1)' }}>{formatKES(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function UnallocatedView({ payments, loading, onNavigate }) {
  if (loading) return <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>Loading…</p>
  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle size={28} className="mx-auto mb-2" style={{ color: '#34d399' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--pb-text-2)' }}>All payments allocated</p>
        <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>No completed payments awaiting allocation.</p>
      </div>
    )
  }
  return (
    <div className="space-y-2">
      {payments.map((p) => {
        const remaining = parseFloat(p.amount || 0) - parseFloat(p.allocated_amount || 0)
        return (
          <div key={p.id} className="flex items-center justify-between p-3 rounded-lg gap-3" style={{ background: 'var(--pb-raised)' }}>
            <div className="flex items-center gap-3">
              <CreditCard size={16} style={{ color: '#60a5fa' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--pb-text-1)' }}>{p.reference || `PAY-${p.id}`}</p>
                <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{p.client?.first_name} {p.client?.last_name} · {timeAgo(p.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <p className="text-sm font-bold" style={{ color: 'var(--pb-text-1)' }}>{formatKES(remaining)}</p>
                <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>of {formatKES(p.amount)}</p>
              </div>
              <button onClick={() => onNavigate(`/payment-allocations?payment_id=${p.id}`)} className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>Allocate</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AgingView({ aging, loading }) {
  if (loading) return <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>Loading…</p>
  const buckets = aging?.buckets || []
  if (buckets.length === 0) return <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>No aging data available.</p>
  return (
    <div className="space-y-3">
      {buckets.map((b, i) => (
        <AgingBar key={i} label={b.label || b.range} amount={b.total_amount || b.amount || 0} count={b.invoice_count || b.count || 0} tone={i === 0 ? 'info' : i === 1 ? 'warning' : 'danger'} />
      ))}
    </div>
  )
}
