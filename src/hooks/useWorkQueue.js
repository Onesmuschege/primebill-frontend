import { useQuery } from '@tanstack/react-query'
import { getTickets } from '../api/tickets.api'
import { getInvoices } from '../api/invoices.api'
import { getPayments } from '../api/payments.api'

/**
 * useWorkQueue — aggregates real backend sources into a unified work inbox.
 *
 * Verified backend filters:
 *   - Tickets:  GET /tickets?status=open&assigned_to=unassigned
 *   - Invoices: GET /invoices?status=overdue
 *   - Payments: GET /payments?status=failed
 *
 * Each source is fetched independently so a failure in one does not blank the
 * others (§24 partial states). Items are normalised to the WorkQueue shape:
 * { id, title, source, priority, status, createdAt, owner, onAction }.
 */

const PRIORITY_MAP = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
}

function normaliseTickets(tickets) {
  return (tickets || []).map((t) => ({
    id: `ticket-${t.id}`,
    title: `Ticket #${t.id} — ${t.subject || 'No subject'}`,
    source: 'ticket',
    priority: PRIORITY_MAP[t.priority] || 'medium',
    status: t.status || 'open',
    createdAt: t.created_at,
    owner: t.assigned_to?.name || 'Unassigned',
    clientId: t.client_id,
  }))
}

function normaliseInvoices(invoices) {
  return (invoices || []).map((inv) => ({
    id: `invoice-${inv.id}`,
    title: `Invoice ${inv.invoice_number} — ${inv.client?.first_name || ''} ${inv.client?.last_name || ''}`.trim(),
    source: 'invoice',
    priority: inv.status === 'overdue' ? 'critical' : 'high',
    status: inv.status || 'unpaid',
    createdAt: inv.due_date || inv.created_at,
    owner: inv.client ? `${inv.client.first_name} ${inv.client.last_name}`.trim() : undefined,
    clientId: inv.client_id,
  }))
}

function normalisePayments(payments) {
  return (payments || []).map((p) => ({
    id: `payment-${p.id}`,
    title: `Payment ${p.reference || p.id} — ${p.status}`,
    source: 'payment',
    priority: p.status === 'failed' ? 'high' : 'medium',
    status: p.status || 'unknown',
    createdAt: p.created_at,
    owner: p.client ? `${p.client.first_name} ${p.client.last_name}`.trim() : undefined,
    clientId: p.client_id,
  }))
}

export function useWorkQueue() {
  const ticketsQuery = useQuery({
    queryKey: ['work-queue', 'tickets'],
    queryFn: () => getTickets({ status: 'open', per_page: 25 }),
    retry: false,
    staleTime: 30_000,
  })

  const invoicesQuery = useQuery({
    queryKey: ['work-queue', 'invoices'],
    queryFn: () => getInvoices({ status: 'overdue', per_page: 25 }),
    retry: false,
    staleTime: 30_000,
  })

  const paymentsQuery = useQuery({
    queryKey: ['work-queue', 'payments'],
    queryFn: () => getPayments({ status: 'failed', per_page: 25 }),
    retry: false,
    staleTime: 30_000,
  })

  const loading = ticketsQuery.isLoading || invoicesQuery.isLoading || paymentsQuery.isLoading
  const error = ticketsQuery.error || invoicesQuery.error || paymentsQuery.error

  const items = [
    ...normaliseTickets(ticketsQuery.data?.data || []),
    ...normaliseInvoices(invoicesQuery.data?.data || []),
    ...normalisePayments(paymentsQuery.data?.data || []),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return {
    items,
    loading,
    error,
    refetch: () => {
      ticketsQuery.refetch()
      invoicesQuery.refetch()
      paymentsQuery.refetch()
    },
    counts: {
      tickets: ticketsQuery.data?.meta?.total ?? (ticketsQuery.data?.data?.length || 0),
      invoices: invoicesQuery.data?.meta?.total ?? (invoicesQuery.data?.data?.length || 0),
      payments: paymentsQuery.data?.meta?.total ?? (paymentsQuery.data?.data?.length || 0),
    },
  }
}
