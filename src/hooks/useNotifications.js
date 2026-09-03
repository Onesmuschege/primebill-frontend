import { useQuery } from '@tanstack/react-query'
import { getTickets } from '../api/tickets.api'
import { getInvoices } from '../api/invoices.api'
import { getPayments } from '../api/payments.api'
import { getNetworkOverview } from '../api/network.api'
import { getAutomationEvents } from '../api/automation.api'
import { getSystemLogs } from '../api/system-logs.api'

function toNotifications(items, category) {
  return (items || []).map((item) => ({
    id: `${category}-${item.id}`,
    category,
    title: item.title || item.subject || item.invoice_number || item.event_type || 'Notification',
    description: item.description || item.message || item.priority || item.severity || '',
    status: item.status || 'unread',
    createdAt: item.created_at || item.due_date || new Date().toISOString(),
    source: item.source || category,
    itemId: item.id,
  }))
}

export function useNotifications() {
  const ticketsQuery = useQuery({
    queryKey: ['notifications', 'tickets'],
    queryFn: () => getTickets({ status: 'open', per_page: 10 }),
    retry: false,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const invoicesQuery = useQuery({
    queryKey: ['notifications', 'invoices'],
    queryFn: () => getInvoices({ status: 'overdue', per_page: 10 }),
    retry: false,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const paymentsQuery = useQuery({
    queryKey: ['notifications', 'payments'],
    queryFn: () => getPayments({ status: 'failed', per_page: 10 }),
    retry: false,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const networkQuery = useQuery({
    queryKey: ['notifications', 'network'],
    queryFn: () => getNetworkOverview(),
    retry: false,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })

  const automationQuery = useQuery({
    queryKey: ['notifications', 'automation'],
    queryFn: () => getAutomationEvents(),
    retry: false,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const systemQuery = useQuery({
    queryKey: ['notifications', 'system'],
    queryFn: () => getSystemLogs({ per_page: 10 }),
    retry: false,
    staleTime: 60_000,
    refetchInterval: 120_000,
  })

  const actionRequired = [
    ...toNotifications(ticketsQuery.data?.data || [], 'ticket'),
    ...toNotifications(invoicesQuery.data?.data || [], 'invoice'),
    ...toNotifications(paymentsQuery.data?.data || [], 'payment'),
  ]

  const networkAlerts = []
  const overview = networkQuery.data || {}
  if (overview.alerts) {
    if (overview.alerts.provisioning_failures > 0) {
      networkAlerts.push({ id: 'alert-provisioning', category: 'alert', title: `${overview.alerts.provisioning_failures} Provisioning Failures`, description: 'Last 24 hours', status: 'active', createdAt: overview.last_updated || new Date().toISOString(), source: 'network' })
    }
    if (overview.alerts.suspended_services > 0) {
      networkAlerts.push({ id: 'alert-suspended', category: 'alert', title: `${overview.alerts.suspended_services} Suspended Services`, description: 'Billing suspension', status: 'active', createdAt: overview.last_updated || new Date().toISOString(), source: 'network' })
    }
    if (overview.routers?.offline > 0) {
      networkAlerts.push({ id: 'alert-routers', category: 'alert', title: `${overview.routers.offline} Routers Offline`, description: `of ${overview.routers.total} total`, status: 'active', createdAt: overview.last_updated || new Date().toISOString(), source: 'network' })
    }
    if (overview.radius?.auth_failures > 0) {
      networkAlerts.push({ id: 'alert-auth', category: 'alert', title: `${overview.radius.auth_failures} Authentication Failures`, description: 'Last 24 hours', status: 'active', createdAt: overview.last_updated || new Date().toISOString(), source: 'network' })
    }
  }

  const automationInfo = []
  const autoData = automationQuery.data?.data || automationQuery.data || {}
  if (autoData.failed_jobs?.length > 0) {
    automationInfo.push({ id: 'info-automation-failed', category: 'info', title: `${autoData.failed_jobs.length} Failed Automation Jobs`, description: 'Requires investigation', status: 'active', createdAt: new Date().toISOString(), source: 'automation' })
  }

  const systemNotifications = toNotifications(systemQuery.data?.data?.data || [], 'system')

  const loading = ticketsQuery.isLoading || invoicesQuery.isLoading || networkQuery.isLoading
  const error = ticketsQuery.error || networkQuery.error

  const all = [...actionRequired, ...networkAlerts, ...automationInfo, ...systemNotifications]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return {
    actionRequired,
    alerts: networkAlerts,
    information: automationInfo,
    system: systemNotifications,
    all,
    loading,
    error,
    counts: {
      actionRequired: actionRequired.length,
      alerts: networkAlerts.length,
      information: automationInfo.length,
      system: systemNotifications.length,
      total: all.length,
    },
    unread: all.filter((n) => n.status === 'unread').length,
    refetch: () => {
      ticketsQuery.refetch()
      invoicesQuery.refetch()
      paymentsQuery.refetch()
      networkQuery.refetch()
      automationQuery.refetch()
      systemQuery.refetch()
    },
  }
}
