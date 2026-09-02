import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  getServiceNetworkStatus,
  suspendService,
  restoreService,
  disconnectService,
  sendServiceCoA,
} from '../../api/service-network.api'
import Modal from '../common/Modal'
import Badge from '../common/Badge'
import Spinner from '../common/Spinner'
import ConfirmDialog from '../common/ConfirmDialog'
import toast from 'react-hot-toast'
import { Activity, Pause, Play, WifiOff, Gauge } from 'lucide-react'

const normalizeState = (s) => (s || '').toLowerCase()

const stateVariant = (s) => {
  const state = normalizeState(s)
  if (state === 'active' || state === 'provisioned') return 'active'
  if (state === 'suspended') return 'suspended'
  if (state === 'past_due' || state === 'grace') return 'overdue'
  return 'inactive'
}

export default function ServiceNetworkActions({ accountId, onChanged }) {
  const [open, setOpen] = useState(false)
  const [coaOpen, setCoaOpen] = useState(false)
  const [reason, setReason] = useState('')
    const [coaForm, setCoaForm] = useState({
    download_speed: '',
    upload_speed: '',
    session_timeout: '',
    idle_timeout: '',
  })

  // ── Confirmation surface (replaces ad-hoc window.confirm) ──────────────────
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const askConfirm = (message, action) => {
    setConfirmMessage(message)
    setPendingAction(() => action)
    setConfirmOpen(true)
  }

  const statusQuery = useQuery({
    queryKey: ['service-network', accountId],
    queryFn: () => getServiceNetworkStatus(accountId),
    enabled: open,
  })

  const suspend = useMutation({
    mutationFn: () => suspendService(accountId, { reason: reason || undefined }),
    onSuccess: () => {
      toast.success('Service suspended')
      setReason('')
      statusQuery.refetch()
      onChanged?.()
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Suspend failed'),
  })

  const restore = useMutation({
    mutationFn: () => restoreService(accountId, { reason: reason || undefined }),
    onSuccess: () => {
      toast.success('Service restored')
      setReason('')
      statusQuery.refetch()
      onChanged?.()
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Restore failed'),
  })

  const disconnect = useMutation({
    mutationFn: () => disconnectService(accountId, {}),
    onSuccess: () => {
      toast.success('Disconnect sent')
      statusQuery.refetch()
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Disconnect failed'),
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
    onSuccess: () => {
      toast.success('CoA sent')
      setCoaOpen(false)
      setCoaForm({ download_speed: '', upload_speed: '', session_timeout: '', idle_timeout: '' })
    },
    onError: (e) => toast.error(e.response?.data?.message || 'CoA failed'),
  })

  const st = statusQuery.data
  const serviceState = normalizeState(st?.service_state ?? 'unknown')
  const isAdminHold = Boolean(st?.administrative_hold) || st?.suspension_type === 'admin'

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
          style={{ background: 'var(--pb-raised)', color: 'var(--pb-text-1)' }}
        >
          <Activity size={13} /> Network
        </button>
        {open && (
          <button
            onClick={() => setCoaOpen(true)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
            style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}
          >
            <Gauge size={13} /> CoA
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 rounded-lg p-3 space-y-3" style={{ background: 'var(--pb-raised)', border: '1px solid var(--pb-border)' }}>
          {statusQuery.isLoading ? (
            <div className="py-6"><Spinner size="md" /></div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="font-medium" style={{ color: 'var(--pb-text-2)' }}>
                  Service state: <Badge label={st?.service_state ?? serviceState} variant={stateVariant(serviceState)} />
                </span>
                {isAdminHold && serviceState === 'suspended' && (
                  <span className="font-medium" style={{ color: '#f87171' }}>
                    <Badge label="Administrative hold" variant="suspended" />
                  </span>
                )}
                {serviceState === 'suspended' && st?.suspension_type === 'billing' && (
                  <span className="font-medium" style={{ color: 'var(--pb-text-3)' }}>
                    <Badge label="Billing suspension" variant="overdue" />
                  </span>
                )}
                <span style={{ color: 'var(--pb-text-3)' }}>
                  Access: <strong>{st?.access_method ?? '—'}</strong>
                </span>
                <span style={{ color: 'var(--pb-text-3)' }}>
                  Entitled: <strong>{st?.is_entitled ? 'Yes' : 'No'}</strong>
                </span>
                <span style={{ color: 'var(--pb-text-3)' }}>
                  Active sessions: <strong>{st?.active_sessions?.length ?? 0}</strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="input text-xs flex-1 min-w-[160px]"
                />
                {serviceState !== 'suspended' ? (
                  <button
                    onClick={() => suspend.mutate()}
                    disabled={suspend.isPending}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white flex items-center gap-1.5"
                    style={{ background: '#f59e0b' }}
                  >
                    <Pause size={13} /> {suspend.isPending ? 'Suspending…' : 'Suspend'}
                  </button>
                ) : (
                  <button
                    onClick={() => restore.mutate()}
                    disabled={restore.isPending}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white flex items-center gap-1.5"
                    style={{ background: '#10b981' }}
                  >
                    <Play size={13} /> {restore.isPending ? 'Restoring…' : 'Restore'}
                  </button>
                )}
                                <button
                  onClick={() => askConfirm('Disconnect active session(s)?', () => disconnect.mutate())}
                  disabled={disconnect.isPending}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
                >
                  <WifiOff size={13} /> {disconnect.isPending ? 'Sending…' : 'Disconnect'}
                </button>
              </div>

              {st?.recent_control_logs?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--pb-text-3)' }}>
                    Recent control logs
                  </p>
                  {st.recent_control_logs.slice(0, 5).map((log, i) => (
                    <div key={i} className="flex justify-between text-xs" style={{ color: 'var(--pb-text-3)' }}>
                      <span>{log.action}</span>
                      <span className={log.status === 'success' ? 'text-emerald-500' : log.status === 'failed' ? 'text-red-400' : ''}>
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
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

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        message={confirmMessage}
        confirmLabel="Disconnect"
        destructive
        isPending={disconnect.isPending}
        onConfirm={() => {
          const fn = pendingAction
          setConfirmOpen(false)
          setPendingAction(null)
          fn && fn()
        }}
      />
    </>
  )
}