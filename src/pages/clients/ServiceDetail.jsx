import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getServiceNetworkStatus,
  suspendService,
  restoreService,
  disconnectService,
  sendServiceCoA,
} from '../../api/service-network.api'
import { getClient } from '../../api/clients.api'
import EntityHeader from '../../components/ops/EntityHeader'
import StateChain from '../../components/ops/StateChain'
import OperationalTimeline from '../../components/ops/OperationalTimeline'
import RelationshipNav from '../../components/ops/RelationshipNav'
import ServiceActionsRail from './ServiceActionsRail'
import DiagnosticsPanel from '../../components/ops/DiagnosticsPanel'

import {
  buildServiceStateChain,
  serviceStateMeta,
  serviceStateToneClass,
  SERVICE_ALLOWED_TRANSITIONS,
} from '../../utils/statusMeta'

import { formatDateTime } from '../../utils/formatDate'
import ErrorState from '../../components/common/ErrorState'
import Skeleton from '../../components/common/Skeleton'
import Modal from '../../components/common/Modal'
import toast from 'react-hot-toast'

/**
 * ServiceDetail — the Service 360 operating workspace (§15 master prompt).
 *
 * Single authoritative source: GET /network/services/{id}/status
 * (ServiceNetworkController::status) — account + plan + NAS relations,
 * service_state, entitlement, access method, active RADIUS sessions and
 * recent RadiusControlLog entries. Every panel renders ONLY fields proven
 * to exist in that payload. No fabricated network or provisioning state.
 *
 * Route: /subscribers/services/:accountId (reached from Client 360 account
 * cards and relationship navigation — deliberately no sidebar entry).
 */

const fmtBytes = (n) => {
  const v = Number(n || 0)
  if (v >= 1024 ** 3) return `${(v / 1024 ** 3).toFixed(2)} GB`
  if (v >= 1024 ** 2) return `${(v / 1024 ** 2).toFixed(1)} MB`
  if (v >= 1024) return `${(v / 1024).toFixed(1)} KB`
  return `${v} B`
}

// ---- (logTone removed — tone mapping now lives in the OperationalTimeline event mapper) ----

export default function ServiceDetail() {
  const { accountId } = useParams()
  const queryClient = useQueryClient()

  const [reason, setReason] = useState('')
  const [lastResult, setLastResult] = useState(null)
  const [coaOpen, setCoaOpen] = useState(false)
  const [coaForm, setCoaForm] = useState({
    download_speed: '',
    upload_speed: '',
    session_timeout: '',
    idle_timeout: '',
  })

  const statusQuery = useQuery({
    queryKey: ['service-network', accountId],
    // The axios instance does NOT unwrap responses (interceptor returns the
    // raw axios response), so extract the body here — same convention as
    // ServiceNetworkActions. Without this, st would be the axios envelope
    // and every panel would silently render empty (caught by the workspace
    // integration test).
    queryFn: async () => {
      const res = await getServiceNetworkStatus(accountId)
      return res.data
    },
  })

  const st = statusQuery.data
  const account = st?.account
  const clientId = account?.client_id

  // Non-blocking: used only for the breadcrumb label; a failure here must not
  // blank the workspace (§24 partial states).
  const clientQuery = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => getClient(clientId),
    enabled: Boolean(clientId),
    retry: false,
    staleTime: 60_000,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['service-network', accountId] })
    if (clientId) queryClient.invalidateQueries({ queryKey: ['client-accounts', clientId] })
  }

  // ── Mutations — §6/§15 universal action lifecycle. Every success reports the
  // AUTHORITATIVE post-action state returned by the backend (message,
  // service_state, is_entitled, administrative_hold) in a persistent inline
  // result panel — never a bare "Success." toast alone.
  const recordResult = (operation, res, error) => {
    setLastResult({
      operation,
      ok: !error,
      message: error ? (error.response?.data?.message || `${operation} failed`) : (res?.message ?? `${operation} accepted`),
      service_state: res?.service_state ?? st?.service_state,
      is_entitled: res?.is_entitled ?? st?.is_entitled,
      administrative_hold: res?.administrative_hold ?? st?.administrative_hold,
      at: new Date().toLocaleTimeString(),
    })
  }

  const suspend = useMutation({
    mutationFn: () => suspendService(accountId, { reason: reason || undefined }),
    onSuccess: (res) => {
      recordResult('Suspend', res)
      toast.success(res?.message ?? 'Service suspended')
      setReason('')
      invalidate()
    },
    onError: (e) => {
      recordResult('Suspend', null, e)
      toast.error(e.response?.data?.message || 'Suspend failed')
    },
  })

  const restore = useMutation({
    mutationFn: () => restoreService(accountId, { reason: reason || undefined }),
    onSuccess: (res) => {
      recordResult('Restore', res)
      toast.success(res?.message ?? 'Service restored')
      setReason('')
      invalidate()
    },
    onError: (e) => {
      recordResult('Restore', null, e)
      toast.error(e.response?.data?.message || 'Restore failed')
    },
  })

  const disconnect = useMutation({
    mutationFn: () => disconnectService(accountId, {}),
    onSuccess: (res) => {
      recordResult('Disconnect', res)
      toast.success(res?.message ?? 'Disconnect command sent')
      invalidate()
    },
    onError: (e) => {
      recordResult('Disconnect', null, e)
      toast.error(e.response?.data?.message || 'Disconnect failed')
    },
  })

  const coa = useMutation({
    mutationFn: () => {
      const payload = {}
      if (coaForm.download_speed !== '') payload.download_speed = Number(coaForm.download_speed)
      if (coaForm.upload_speed !== '') payload.upload_speed = Number(coaForm.upload_speed)
      if (coaForm.session_timeout !== '') payload.session_timeout = Number(coaForm.session_timeout)
      if (coaForm.idle_timeout !== '') payload.idle_timeout = Number(coaForm.idle_timeout)
      return sendServiceCoA(accountId, payload)
    },
    onSuccess: (res) => {
      recordResult('CoA', res)
      toast.success(res?.result ?? res?.message ?? 'CoA submitted')
      setCoaOpen(false)
      invalidate()
    },
    onError: (e) => {
      recordResult('CoA', null, e)
      toast.error(e.response?.data?.message || 'CoA failed')
    },
  })

  const refetchLabel = statusQuery.isFetching
    ? 'Refreshing…'
    : statusQuery.dataUpdatedAt
      ? `Updated ${formatDateTime(new Date(statusQuery.dataUpdatedAt))}`
      : null

  return (
    <div className="space-y-4">
      {/* ── Breadcrumb: Customer → Service (context never lost, §8) ── */}
      <div className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
        <Link to="/clients" className="hover:underline">Subscribers</Link>
        <span className="mx-1">/</span>
        {clientQuery.data ? (
          <Link to={`/clients/${clientId}`} className="hover:underline">
            {clientQuery.data.name || clientQuery.data.full_name || clientQuery.data.email || `Client #${clientId}`}
          </Link>
        ) : (
          <span>Client #{clientId ?? '…'}</span>
        )}
        <span className="mx-1">/</span>
        <span style={{ color: 'var(--pb-text-2)' }}>Service #{accountId}</span>
      </div>

      {statusQuery.isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {statusQuery.isError && (
        <ErrorState
          title="Could not load service"
          message={statusQuery.error?.response?.data?.message || statusQuery.error?.message}
          onRetry={statusQuery.refetch}
        />
      )}

      {!statusQuery.isLoading && !statusQuery.isError && account && (
        <>
          <EntityHeader
            typeLabel="SERVICE"
            title={account.username || `Service #${accountId}`}
            identifier={`#${accountId} · ${String(account.type || '').toUpperCase()}`}
            status={serviceStateMeta(st.service_state)}
            badges={[
              { label: st.is_entitled ? 'Entitled' : 'Not entitled', tone: st.is_entitled ? 'success' : 'warning' },
              ...(st.administrative_hold ? [{ label: 'Admin hold', tone: 'danger' }] : []),
              ...((st.active_sessions?.length ?? 0) > 0 ? [{ label: `${st.active_sessions.length} online`, tone: 'info' }] : []),
            ]}
            meta={[
              { label: 'Plan', value: account.plan?.name || '—' },
              { label: 'NAS', value: account.nas?.name || '—' },
              { label: 'Access', value: st.access_method || account.access_method || '—' },
            ]}
            lastUpdated={refetchLabel}
            actions={
              <ServiceActionsRail
                stateLabel={serviceStateMeta(st.service_state).label}
                username={account.username}
                canSuspend={(SERVICE_ALLOWED_TRANSITIONS[st.service_state] || []).includes('SUSPENDED')}
                canRestore={(SERVICE_ALLOWED_TRANSITIONS[st.service_state] || []).includes('ACTIVE')}
                isTerminal={st.service_state === 'TERMINATED'}
                hasSession={(st.active_sessions?.length ?? 0) > 0}
                sessionCount={st.active_sessions?.length ?? 0}
                suspend={suspend}
                restore={restore}
                disconnect={disconnect}
                onCoa={() => setCoaOpen(true)}
                onRefresh={statusQuery.refetch}
                isFetching={statusQuery.isFetching}
              />
            }
          />

          {/* ── Universal action lifecycle result (§6): backend-verified outcome ── */}
          {lastResult && (
            <div className="card p-3 text-sm" role="status" style={{
              borderColor: lastResult.ok ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)',
              background: lastResult.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            }}>
              <p className="font-semibold" style={{ color: lastResult.ok ? '#34d399' : '#f87171' }}>
                {lastResult.operation} — {lastResult.ok ? 'completed' : 'failed'} · {lastResult.at}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--pb-text-2)' }}>{lastResult.message}</p>
              <p className="text-xs mt-1.5 flex items-center gap-2" style={{ color: 'var(--pb-text-3)' }}>
                Authoritative state:
                <span className={`badge ${serviceStateToneClass(lastResult.service_state)}`}>
                  {serviceStateMeta(lastResult.service_state).label}
                </span>
                · Entitled: {lastResult.is_entitled ? 'yes' : 'no'}
                {lastResult.administrative_hold ? ' · Administrative hold ACTIVE' : ''}
              </p>
            </div>
          )}

          {st.administrative_hold && (
            <div className="card p-3 text-sm" style={{ borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', color: '#f87171' }}>
              Administrative hold is active — RADIUS rejects this service until an explicit restore.
              {st.suspension_type ? ` Suspension type: ${st.suspension_type}.` : ''}
            </div>
          )}

          {/* ── Operational state chain — real service_state only, §14 ── */}
          <StateChain items={buildServiceStateChain(st.service_state)} ariaLabel="Service lifecycle state" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Commercial identity */}
            <div className="card p-4 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--pb-text-3)' }}>Service</p>
              <div className="text-sm space-y-1" style={{ color: 'var(--pb-text-1)' }}>
                <div className="flex justify-between"><span style={{ color: 'var(--pb-text-3)' }}>Type</span><span>{(account.type || '—').toUpperCase()}</span></div>
                <div className="flex justify-between"><span style={{ color: 'var(--pb-text-3)' }}>Plan</span><span>{account.plan?.name || '—'}</span></div>
                <div className="flex justify-between"><span style={{ color: 'var(--pb-text-3)' }}>Price</span><span>{account.plan?.price != null ? `KSh ${Number(account.plan.price).toLocaleString()}` : '—'}</span></div>
                <div className="flex justify-between"><span style={{ color: 'var(--pb-text-3)' }}>Entitled</span><span>{st.is_entitled ? 'Yes' : 'No'}</span></div>
                <div className="flex justify-between"><span style={{ color: 'var(--pb-text-3)' }}>Access method</span><span>{st.access_method || '—'}</span></div>
                <div className="flex justify-between"><span style={{ color: 'var(--pb-text-3)' }}>Rate policy</span><span>{st.rate_limit_policy || '—'}</span></div>
              </div>
            </div>

            {/* Network identity — only backend-proven fields */}
            <div className="card p-4 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--pb-text-3)' }}>Network</p>
              <div className="text-sm space-y-1" style={{ color: 'var(--pb-text-1)' }}>
                <div className="flex justify-between"><span style={{ color: 'var(--pb-text-3)' }}>NAS</span><span>{account.nas?.name || account.nas_id || '—'}</span></div>
                <div className="flex justify-between"><span style={{ color: 'var(--pb-text-3)' }}>Active sessions</span><span>{st.active_sessions?.length ?? 0}</span></div>
              </div>
              {(st.active_sessions || []).slice(0, 2).map((s) => (
                <div key={s.id} className="text-xs" style={{ color: 'var(--pb-text-2)' }}>
                  {s.ip_address || 'no IP'} · {fmtBytes(s.bytes_in)} ↓ / {fmtBytes(s.bytes_out)} ↑ · since {s.session_start ? formatDateTime(s.session_start) : '—'}
                </div>
              ))}
            </div>

            {/* RADIUS control history — the authoritative action trail,
                rendered through the shared OperationalTimeline primitive (§27).
                Events come ONLY from real RadiusControlLog rows. */}
            <div className="card p-4 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--pb-text-3)' }}>Recent RADIUS activity</p>
              <OperationalTimeline
                dense
                maxItems={8}
                emptyTitle="No RADIUS control operations recorded"
                emptyDescription="Suspensions, restorations, disconnects and CoA results will appear here."
                events={(st.recent_control_logs || []).map((log) => ({
                  id: log.id,
                  timestamp: log.completed_at || log.created_at,
                  title: log.action,
                  description: log.error || log.result || undefined,
                  actor: log.username || undefined,
                  tone:
                    log.status === 'success' ? 'success'
                    : log.status === 'failed' ? 'danger'
                    : 'info',
                  meta: log.status,
                }))}
              />
            </div>
          </div>

          {/* ── Evidence-chain diagnostics (§19): conclusions derived ONLY
              from the authoritative status payload ── */}
          <DiagnosticsPanel status={st} />

          <RelationshipNav
            links={[
              ...(clientId ? [{ label: 'Customer workspace', to: `/clients/${clientId}` }] : []),
              ...(account.nas_id ? [{ label: `Router: ${account.nas?.name || `NAS #${account.nas_id}`}`, to: '/routers' }] : []),
              { label: 'Live sessions', to: '/radius' },
              { label: 'Usage & FUP', to: '/fup' },
            ]}
          />
        </>
      )}

      {/* CoA modal */}
      <Modal isOpen={coaOpen} onClose={() => setCoaOpen(false)} title="Change of Authorization (CoA)" size="md">
        <form onSubmit={(e) => { e.preventDefault(); coa.mutate() }} className="space-y-4">
          <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
            Apply a new rate/policy to the active session. Leave blank to keep a value unchanged.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'download_speed', label: 'Download speed (kbps)' },
              { key: 'upload_speed', label: 'Upload speed (kbps)' },
              { key: 'session_timeout', label: 'Session timeout (sec)' },
              { key: 'idle_timeout', label: 'Idle timeout (sec)' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>{label}</label>
                <input
                  type="number"
                  min="0"
                  value={coaForm[key]}
                  onChange={(e) => setCoaForm({ ...coaForm, [key]: e.target.value })}
                  className="input text-sm"
                  placeholder="Keep current"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setCoaOpen(false)} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--pb-raised)' }}>Cancel</button>
            <button type="submit" disabled={coa.isPending} className="px-4 py-2 rounded-lg text-sm text-white" style={{ background: '#8b5cf6' }}>
              {coa.isPending ? 'Sending…' : 'Apply CoA'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
