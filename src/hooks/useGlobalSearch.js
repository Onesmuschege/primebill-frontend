import { useQuery } from '@tanstack/react-query'
import { getClients } from '../api/clients.api'
import { getInvoices } from '../api/invoices.api'
import { getPayments } from '../api/payments.api'
import { getTickets } from '../api/tickets.api'
import { getRouters } from '../api/routers.api'

/**
 * useGlobalSearch — cross-entity search (§18 master prompt).
 *
 * No dedicated global search endpoint exists in the backend. This hook
 * queries multiple existing endpoints in parallel, each using its supported
 * search/filter capabilities, and aggregates results into a unified view.
 *
 * Backend gap documented: a dedicated `/api/search` endpoint would allow
 * cross-entity matching in a single round-trip. Until then, this hook
 * fans out to N endpoints and merges results client-side.
 *
 * Each source is fetched independently so a failure in one does not blank
 * the others (§24 partial states).
 */

const MIN_QUERY_LENGTH = 2

function matches(query, ...fields) {
  const q = String(query || '').toLowerCase()
  if (!q) return false
  return fields.some((f) => String(f || '').toLowerCase().includes(q))
}

export function useGlobalSearch(rawQuery) {
  const query = String(rawQuery || '').trim()
  const enabled = query.length >= MIN_QUERY_LENGTH

  // Fan out to all searchable endpoints in parallel
  const clientsQuery = useQuery({
    queryKey: ['global-search', 'clients', query],
    queryFn: () => getClients({ search: query, per_page: 5 }),
    enabled,
    retry: false,
    staleTime: 30_000,
  })

  const invoicesQuery = useQuery({
    queryKey: ['global-search', 'invoices', query],
    queryFn: () => getInvoices({ search: query, per_page: 5 }),
    enabled,
    retry: false,
    staleTime: 30_000,
  })

  const paymentsQuery = useQuery({
    queryKey: ['global-search', 'payments', query],
    queryFn: () => getPayments({ search: query, per_page: 5 }),
    enabled,
    retry: false,
    staleTime: 30_000,
  })

  const ticketsQuery = useQuery({
    queryKey: ['global-search', 'tickets', query],
    queryFn: () => getTickets({ search: query, per_page: 5 }),
    enabled,
    retry: false,
    staleTime: 30_000,
  })

  const routersQuery = useQuery({
    queryKey: ['global-search', 'routers', query],
    queryFn: () => getRouters({ search: query, per_page: 5 }),
    enabled,
    retry: false,
    staleTime: 30_000,
  })

  const loading = clientsQuery.isLoading || invoicesQuery.isLoading || paymentsQuery.isLoading || ticketsQuery.isLoading || routersQuery.isLoading

  // Aggregate results into grouped format
  const results = enabled
    ? {
        clients: (clientsQuery.data?.data || []).filter((c) =>
          matches(query, c.first_name, c.last_name, c.email, c.phone, c.account_number)
        ).map((c) => ({ ...c, _type: 'client', _label: `${c.first_name} ${c.last_name}`, _href: `/clients/${c.id}` })),

        invoices: (invoicesQuery.data?.data || []).filter((inv) =>
          matches(query, inv.invoice_number, inv.client?.first_name, inv.client?.last_name)
        ).map((inv) => ({ ...inv, _type: 'invoice', _label: inv.invoice_number, _href: `/invoices/${inv.id}` })),

        payments: (paymentsQuery.data?.data || []).filter((p) =>
          matches(query, p.reference, p.mpesa_code, p.client?.first_name, p.client?.last_name)
        ).map((p) => ({ ...p, _type: 'payment', _label: p.reference || `PAY-${p.id}`, _href: `/payments/${p.id}` })),

        tickets: (ticketsQuery.data?.data || []).filter((t) =>
          matches(query, t.subject, t.description, t.client?.first_name, t.client?.last_name)
        ).map((t) => ({ ...t, _type: 'ticket', _label: `#${t.id} ${t.subject}`, _href: `/tickets/${t.id}` })),

        routers: (routersQuery.data?.data || []).filter((r) =>
          matches(query, r.name, r.ip_address, r.type)
        ).map((r) => ({ ...r, _type: 'router', _label: r.name || r.ip_address, _href: `/routers/${r.id}` })),
      }
    : { clients: [], invoices: [], payments: [], tickets: [], routers: [] }

  const total =
    results.clients.length +
    results.invoices.length +
    results.payments.length +
    results.tickets.length +
    results.routers.length

  return {
    query,
    results,
    total,
    loading,
    enabled,
    hasResults: total > 0,
    counts: {
      clients: results.clients.length,
      invoices: results.invoices.length,
      payments: results.payments.length,
      tickets: results.tickets.length,
      routers: results.routers.length,
    },
  }
}
