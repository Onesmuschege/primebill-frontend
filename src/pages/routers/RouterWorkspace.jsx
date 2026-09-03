import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import {
  getRouter,
  getRouterHealth,
  getRouterResources,
  getRouterSessions,
  testRouterConnection,
} from '../../api/routers.api'
import EntityHeader from '../../components/ops/EntityHeader'
import StateChain from '../../components/ops/StateChain'
import RelationshipNav from '../../components/ops/RelationshipNav'
import LocationPanel from '../../components/ops/LocationPanel'
import ActionRail from '../../components/ops/ActionRail'
import ErrorState from '../../components/common/ErrorState'
import Skeleton from '../../components/common/Skeleton'
import { formatBytes } from '../../utils/formatBytes'
import { formatDateTime, timeAgo } from '../../utils/formatDate'
import { genericStatusTone } from '../../utils/statusMeta'
import { RefreshCw, Activity, Cpu, Radio, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * RouterWorkspace — Advanced network diagnostics (P2 §22).
 *
 * Composes the REAL RouterController probe surfaces, all under the same
 * `view routers` permission as RouterList:
 *   - GET /routers/{id}            → router record (connection/identity fields)
 *   - GET /routers/{id}/health     → live RouterHealthService probe
 *       ({configured, reachable, synchronized, provisioning_ready, health_state,
 *         label, routeros_version, last_sync_age_seconds, last_health_error})
 *   - GET /routers/{id}/resources  → MikroTik /system/resource/print
 *   - GET /routers/{id}/sessions   → MikroTik /ppp/active/print
 *
 * No fabricated health percentages: reachability is the probe's authoritative
 * booleans, and empty MikroTik responses render as "no data", never as healthy.
 */

const HEALTH_TONES = {
  healthy: 'active',
  degraded: 'warning',
  unavailable: 'danger',
  unknown: 'muted',
}

const RESOURCE_LABELS = {
  uptime: 'Uptime',
  version: 'RouterOS',
  'cpu-load': 'CPU load',
  'free-memory': 'Free memory',
  'total-memory': 'Total memory',
  'board-name': 'Board',
  'cpu-count': 'CPU count',
  'cpu-frequency': 'CPU freq',
  'architecture-name': 'Architecture',
  'free-hdd-space': 'Free storage',
  'total-hdd-space': 'Total storage',
}

const SESSION_LABELS = [
  { key: 'name', label: 'User' },
  { key: 'service', label: 'Service' },
  { key: 'address', label: 'Address' },
  { key: 'caller-id', label: 'Caller ID' },
  { key: 'uptime', label: 'Uptime' },
]

function ProbeResult({ health }) {
  if (!health) return null
  const stages = [
    { id: 'configured', label: 'Configured', state: health.configured ? 'done' : health.reachable === undefined ? 'upcoming' : 'failed' },
    { id: 'reachable', label: 'Reachable', state: health.reachable ? 'done' : health.reachable === false ? 'failed' : 'upcoming' },
    { id: 'synchronized', label: 'Synchronized', state: health.synchronized ? 'done' : health.synchronized === false ? 'failed' : 'upcoming' },
    { id: 'provisioning_ready', label: 'Provisioning ready', state: health.provisioning_ready ? 'done' : 'upcoming' },
  ]
  const syncAge = health.last_sync_age_seconds != null
    ? health.last_sync_age_seconds < 60
      ? `${Math.round(health.last_sync_age_seconds)}s ago`
      : `${Math.round(health.last_sync_age_seconds / 60)}m ago`
    : null
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--pb-text-1)' }}>
          <Activity size={15} style={{ color: '#60a5fa' }} /> Live probe
        </h3>
        <span className="text-[11px]" style={{ color: 'var(--pb-text-3)' }}>
          {health.label || health.health_state}
          {syncAge ? ` · synced ${syncAge}` : ''}
        </span>
      </div>
      <StateChain items={stages} ariaLabel="Router health probe chain" />
      {health.last_sync_age_seconds != null && health.last_sync_age_seconds > 900 && (
        <p className="text-xs" style={{ color: '#fbbf24' }}>
          Last successful sync was {Math.round(health.last_sync_age_seconds / 60)} minutes ago.
        </p>
      )}
      {health.last_health_error && (
        <p className="text-xs" style={{ color: '#f87171' }}>
          Last probe error: {health.last_health_error}
        </p>
      )}
    </div>
  )
}
function ResourcePanel({ resources }) {
  const items = (resources && Object.keys(resources).length ? resources : null)
  return (
    <div className="card p-4 space-y-2">
      <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--pb-text-1)' }}>
        <Cpu size={15} style={{ color: '#60a5fa' }} /> RouterOS resources
      </h3>
      {!items ? (
        <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
          No resource data — the router did not respond to the RouterOS API.
        </p>
      ) : (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          {Object.entries(items).map(([k, v]) =>
            RESOURCE_LABELS[k] ? (
              <div key={k} className="flex justify-between gap-2 text-xs">
                <dt style={{ color: 'var(--pb-text-3)' }}>{RESOURCE_LABELS[k]}</dt>
                <dd className="font-medium text-right" style={{ color: 'var(--pb-text-2)' }}>{v}</dd>
              </div>
            ) : null
          )}
        </dl>
      )}
    </div>
  )
}

function SessionPanel({ sessions }) {
  const rows = Array.isArray(sessions) ? sessions : (sessions?.data ?? [])
  return (
    <div className="card p-4 space-y-2">
      <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--pb-text-1)' }}>
        <Radio size={15} style={{ color: '#34d399' }} /> Active PPP sessions
        <span className="text-[11px] font-normal" style={{ color: 'var(--pb-text-3)' }}>{rows.length} live</span>
      </h3>
      {rows.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>No active PPP sessions on this router.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left" style={{ color: 'var(--pb-text-3)' }}>
                {SESSION_LABELS.map(({ label }) => <th key={label} className="py-1 pr-3 font-medium">{label}</th>)}
                <th className="py-1 pr-3 font-medium">Down</th>
                <th className="py-1 pr-3 font-medium">Up</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s, i) => (
                <tr key={s['session-id'] || i} style={{ color: 'var(--pb-text-2)' }}>
                  {SESSION_LABELS.map(({ key }) => <td key={key} className="py-1.5 pr-3">{s[key] ?? '—'}</td>)}
                  <td className="py-1.5 pr-3">{s['bytes-in'] != null ? formatBytes(s['bytes-in']) : (s['rx-bytes'] != null ? formatBytes(s['rx-bytes']) : '—')}</td>
                  <td className="py-1.5 pr-3">{s['bytes-out'] != null ? formatBytes(s['bytes-out']) : (s['tx-bytes'] != null ? formatBytes(s['tx-bytes']) : '—')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
export default function RouterWorkspace() {
  const { id } = useParams()
  const queryClient = useQueryClient()

  const routerQuery = useQuery({
    queryKey: ['router', id],
    queryFn: () => getRouter(id),
    retry: false,
  })

  const healthQuery = useQuery({
    queryKey: ['router-health', id],
    queryFn: () => getRouterHealth(id),
    retry: false,
  })

  const resourcesQuery = useQuery({
    queryKey: ['router-resources', id],
    queryFn: () => getRouterResources(id),
    retry: false,
  })

  const sessionsQuery = useQuery({
    queryKey: ['router-sessions', id],
    queryFn: () => getRouterSessions(id),
    retry: false,
  })

  const probe = useMutation({
    mutationFn: () => testRouterConnection(id),
    onSuccess: (res) => {
      toast.success(res?.connected ? 'Router reachable' : 'Router did not respond')
      queryClient.invalidateQueries({ queryKey: ['router', id] })
      queryClient.invalidateQueries({ queryKey: ['router-health', id] })
      queryClient.invalidateQueries({ queryKey: ['router-resources', id] })
      queryClient.invalidateQueries({ queryKey: ['router-sessions', id] })
      queryClient.invalidateQueries({ queryKey: ['routers'] })
    },
    onError: () => toast.error('Probe failed'),
  })

  if (routerQuery.isError) {
    return (
      <ErrorState
        title="Could not load router"
        message={routerQuery.error?.response?.data?.message || routerQuery.error?.message}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['router', id] })}
      />
    )
  }

  if (routerQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    )
  }

  const router = routerQuery.data
  const health = healthQuery.data
  const probeState = health?.health_state || router.health_state || router.status || 'unknown'
  const probeTone = HEALTH_TONES[health?.health_state] || genericStatusTone(probeState)

  return (
    <div className="space-y-4">
      <EntityHeader
        typeLabel="ROUTER"
        title={router.name}
        identifier={router.ip_address ? `${router.ip_address}${router.port ? `:${router.port}` : ''}` : undefined}
        status={{ label: health?.label || router.health_state || router.status || 'Unknown', tone: probeTone }}
        badges={[
          ...(router.last_health_check_at
            ? [{ label: `Probed ${timeAgo(router.last_health_check_at)}` }]
            : [{ label: 'Never probed' }]),
          ...(router.routeros_version || (health?.routeros_version) ? [{ label: `RouterOS ${router.routeros_version || health.routeros_version}` }] : []),
          ...(router.location ? [{ label: router.location }] : []),
        ]}
        meta={[
          { label: 'Type', value: `${String(router.type || '').toUpperCase()}${router.vendor ? ` · ${router.vendor}` : ''}${router.model ? ` ${router.model}` : ''}`.trim() },
          { label: 'Status', value: router.status || '—' },
        ]}
        actions={
          <ActionRail
            orientation="horizontal"
            actions={[
              {
                key: 'probe',
                label: probe.isPending ? 'Probing…' : 'Probe / Test connection',
                icon: <RefreshCw size={13} />,
                onClick: () => probe.mutate(),
                pending: probe.isPending,
              },
            ]}
          />
        }
        lastUpdated={health ? `Health checked ${timeAgo(router.last_health_check_at)}` : 'No health probe yet'}
      />

      <RelationshipNav
        links={[
          { label: 'Network Command', to: '/network-command' },
          { label: 'NOC', to: '/noc' },
          { label: 'RADIUS', to: '/radius' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProbeResult health={health} />
        <ResourcePanel resources={resourcesQuery.data} />
      </div>

      <SessionPanel sessions={sessionsQuery.data} />

      <div className="card p-4">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-2" style={{ color: 'var(--pb-text-1)' }}>
          <MapPin size={15} style={{ color: 'var(--pb-text-3)' }} /> Connection details
        </h3>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-xs">
          {[
            ['Type', router.type],
            ['Device type', router.device_type],
            ['NAS identifier', router.nas_identifier],
            ['RADIUS IP', router.radius_ip],
            ['Auth port', router.radius_auth_port],
            ['CoA port', router.coa_port],
            ['Location', router.location],
            ...(router.location_lat != null ? [['Lat', String(router.location_lat)]] : []),
            ...(router.location_lng != null ? [['Lng', String(router.location_lng)]] : []),
            ['Last seen', router.last_seen ? formatDateTime(router.last_seen) : '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-2">
              <dt style={{ color: 'var(--pb-text-3)' }}>{label}</dt>
              <dd className="font-medium text-right" style={{ color: 'var(--pb-text-2)' }}>{value || '—'}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-3">
          <LocationPanel lat={router.location_lat} lng={router.location_lng} label="Router site coordinates" />
        </div>
      </div>
    </div>
  )
}