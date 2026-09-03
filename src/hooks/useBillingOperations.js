import { useQuery } from '@tanstack/react-query'
import { getInvoices } from '../api/invoices.api'
import { getPayments } from '../api/payments.api'
import { getAging, getDunningRuns } from '../api/collections.api'

/**
 * useBillingOperations — exceptions-first billing workspace data (§17 master prompt).
 *
 * Aggregates the financial issues requiring operator action:
 *   - Unpaid + overdue invoices (with dunning state per invoice)
 *   - Failed payments
 *   - Unallocated payments (awaiting allocation to invoices)
 *   - Aging summary (0-30, 31-60, 61-90, 90+ day buckets)
 *
 * Each source is fetched independently so a failure in one does not blank the
 * others (§24 partial states).
 */

const INVOICE_EXCEPTION_STATUSES = ['unpaid', 'overdue']

function attachDunningState(invoices, runsByInvoice) {
  return (invoices || []).map((inv) => ({
    ...inv,
    dunningStep: runsByInvoice?.[inv.id]?.step_name || null,
    dunningStatus: runsByInvoice?.[inv.id]?.status || null,
    lastDunningAt: runsByInvoice?.[inv.id]?.executed_at || null,
  }))
}

export function useBillingOperations() {
  const invoicesQuery = useQuery({
    queryKey: ['billing-ops', 'invoices'],
    queryFn: () => getInvoices({ status: 'overdue', per_page: 50 }),
    retry: false,
    staleTime: 30_000,
  })

  const unpaidQuery = useQuery({
    queryKey: ['billing-ops', 'unpaid'],
    queryFn: () => getInvoices({ status: 'unpaid', per_page: 50 }),
    retry: false,
    staleTime: 30_000,
  })

  const failedPaymentsQuery = useQuery({
    queryKey: ['billing-ops', 'failed-payments'],
    queryFn: () => getPayments({ status: 'failed', per_page: 25 }),
    retry: false,
    staleTime: 30_000,
  })

  const unallocatedQuery = useQuery({
    queryKey: ['billing-ops', 'unallocated'],
    queryFn: () => getPayments({ status: 'completed', per_page: 50 }),
    retry: false,
    staleTime: 30_000,
  })

  const agingQuery = useQuery({
    queryKey: ['billing-ops', 'aging'],
    queryFn: async () => {
      const res = await getAging()
      return res.data?.data || res.data || {}
    },
    retry: false,
    staleTime: 60_000,
  })

  const dunningRunsQuery = useQuery({
    queryKey: ['billing-ops', 'dunning-runs'],
    queryFn: async () => {
      const res = await getDunningRuns({ per_page: 100 })
      return res.data?.data || res.data || []
    },
    retry: false,
    staleTime: 60_000,
  })

  // Build a lookup of latest dunning run per invoice
  const runsByInvoice = (Array.isArray(dunningRunsQuery.data) ? dunningRunsQuery.data : []).reduce((acc, run) => {
    if (!acc[run.invoice_id] || new Date(run.executed_at) > new Date(acc[run.invoice_id].executed_at)) {
      acc[run.invoice_id] = run
    }
    return acc
  }, {})

  const overdueInvoices = attachDunningState(invoicesQuery.data?.data || [], runsByInvoice)
  const unpaidInvoices = unpaidQuery.data?.data || []

  // Unallocated = completed payments whose allocated amount < payment amount
  const unallocatedPayments = (unallocatedQuery.data?.data || []).filter((p) => {
    const allocated = parseFloat(p.allocated_amount || 0)
    return allocated < parseFloat(p.amount || 0)
  })

  const loading = invoicesQuery.isLoading || unpaidQuery.isLoading || failedPaymentsQuery.isLoading || unallocatedQuery.isLoading
  const error = invoicesQuery.error || unpaidQuery.error || failedPaymentsQuery.error || unallocatedQuery.error

  const aging = agingQuery.data || {}

  // Summary metrics
  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + parseFloat(inv.balance || inv.total || 0), 0)
  const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.balance || inv.total || 0), 0)

  return {
    overdueInvoices,
    unpaidInvoices,
    failedPayments: failedPaymentsQuery.data?.data || [],
    unallocatedPayments,
    aging,
    loading,
    error,
    counts: {
      overdue: overdueInvoices.length,
      unpaid: unpaidInvoices.length,
      failedPayments: (failedPaymentsQuery.data?.data || []).length,
      unallocated: unallocatedPayments.length,
    },
    totals: {
      overdue: totalOverdue,
      unpaid: totalUnpaid,
    },
    refetch: () => {
      invoicesQuery.refetch()
      unpaidQuery.refetch()
      failedPaymentsQuery.refetch()
      unallocatedQuery.refetch()
      agingQuery.refetch()
      dunningRunsQuery.refetch()
    },
  }
}
