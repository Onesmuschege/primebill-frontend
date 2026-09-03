import { useQuery } from '@tanstack/react-query'
import {
  getNetworkOverview,
  getNetworkRouters,
  getNetworkSessions,
  getNetworkEvents,
} from '../api/network.api'
import { getIncidents } from '../api/incidents.api'

/**
 * useNetworkCommand — aggregates real backend sources for the Network
 * Command Center (§18 master prompt).
 *
 * Data sources (all verified against backend controllers):
 *   - Overview:    GET /network/dashboard → routers, radius, sessions, alerts
 *   - Routers:     GET /network/routers → list with status
 *   - Sessions:    GET /network/sessions → live RADIUS sessions
 *   - Events:      GET /network/events → network events log
 *   - Incidents:   GET /incidents?status=open → active incidents
 *
 * Each source is fetched independently so a failure in one does not blank
 * others (§24 partial states).
 */

export function useNetworkCommand() {
  const overviewQuery = useQuery({
    queryKey: ['network-command', 'overview'],
    queryFn: () => getNetworkOverview(),
    retry: false,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })

  const routersQuery = useQuery({
    queryKey: ['network-command', 'routers'],
    queryFn: () => getNetworkRouters({ per_page: 25 }),
    retry: false,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })

  const sessionsQuery = useQuery({
    queryKey: ['network-command', 'sessions'],
    queryFn: () => getNetworkSessions({ per_page: 25 }),
    retry: false,
    staleTime: 15_000,
    refetchInterval: 15_000,
  })

  const eventsQuery = useQuery({
    queryKey: ['network-command', 'events'],
    queryFn: () => getNetworkEvents(),
    retry: false,
    staleTime: 30_000,
  })

  const incidentsQuery = useQuery({
    queryKey: ['network-command', 'incidents'],
    queryFn: () => getIncidents({ status: 'open', per_page: 10 }),
    retry: false,
    staleTime: 30_000,
  })

  const overview = overviewQuery.data || {}
  const loading = overviewQuery.isLoading || routersQuery.isLoading || sessionsQuery.isLoading

  // Derived metrics from the authoritative overview payload
  const routerHealth = overview.routers
    ? {
        total: overview.routers.total || 0,
        online: overview.routers.online || 0,
        offline: overview.routers.offline || 0,
        pct: overview.routers.total
          ? Math.round((overview.routers.online / overview.routers.total) * 100)
          : 0,
      }
    : { total: 0, online: 0, offline: 0, pct: 0 }

  return {
    overview,
    routerHealth,
    routers: routersQuery.data?.data || [],
    sessions: sessionsQuery.data?.data || [],
    events: eventsQuery.data?.data || [],
    incidents: incidentsQuery.data?.data || [],
    loading,
    counts: {
      offlineRouters: routerHealth.offline,
      activeSessions: overview.sessions?.total_active || 0,
      authFailures: overview.radius?.auth_failures || 0,
      provisioningFailures: overview.alerts?.provisioning_failures || 0,
      suspendedServices: overview.alerts?.suspended_services || 0,
      openIncidents: incidentsQuery.data?.data?.length || 0,
    },
    refetch: () => {
      overviewQuery.refetch()
      routersQuery.refetch()
      sessionsQuery.refetch()
      eventsQuery.refetch()
      incidentsQuery.refetch()
    },
  }
}
