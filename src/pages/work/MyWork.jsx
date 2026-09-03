import { useNavigate } from 'react-router-dom'
import { useWorkQueue } from '../../hooks/useWorkQueue'
import WorkQueue from '../../components/ops/WorkQueue'
import EntityHeader from '../../components/ops/EntityHeader'
import { Briefcase, AlertTriangle, FileText, CreditCard } from 'lucide-react'


/**
 * My Work — the operator's operational inbox (§9, §15 master prompt).
 *
 * Composes the reusable WorkQueue with real backend data sources:
 * unassigned/open tickets, overdue invoices, and failed payments. Each
 * category shows its count; clicking an item navigates to the affected
 * entity (ticket, invoice, or client).
 *
 * No sidebar entry — reached from the global "My Work" command palette
 * action and the notification center. This keeps the ten-section IA intact
 * while giving operators a single pane of glass for action-required work.
 */

export default function MyWork() {
  const navigate = useNavigate()
  const { items, loading, error, refetch, counts } = useWorkQueue()

  const handleAction = (item) => {
    if (item.source === 'ticket') navigate(`/tickets/${item.id.replace('ticket-', '')}`)
    else if (item.source === 'invoice') navigate(`/invoices`)
    else if (item.source === 'payment') navigate(`/payments`)
    else if (item.clientId) navigate(`/clients/${item.clientId}`)
  }

  const summaryCards = [
    { label: 'Open Tickets', count: counts.tickets, icon: FileText, tone: 'info' },
    { label: 'Overdue Invoices', count: counts.invoices, icon: AlertTriangle, tone: 'warning' },
    { label: 'Failed Payments', count: counts.payments, icon: CreditCard, tone: 'danger' },
  ]

  return (
    <div className="space-y-6">
      <EntityHeader
        title="My Work"
        subtitle="Work requiring your attention"
        icon={Briefcase}
        meta={[
          { label: 'Items', value: items.length },
          { label: 'Updated', value: new Date().toLocaleTimeString('en-KE') },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="card p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(99,102,241,0.1)' }}>
              <card.icon size={18} style={{ color: '#818cf8' }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--pb-text-1)' }}>{card.count}</p>
              <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--pb-border)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--pb-text-1)' }}>Action Required</h3>
          <button onClick={refetch} className="text-xs" style={{ color: '#818cf8' }}>Refresh</button>
        </div>
        <WorkQueue
          items={items}
          loading={loading}
          error={error ? 'Failed to load work queue' : null}
          onRetry={refetch}
          onAction={handleAction}
          emptyTitle="All caught up!"
          emptyDescription="No tickets, overdue invoices, or failed payments require action right now."
        />
      </div>
    </div>
  )
}
