import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRmas, createRma, approveRma, rejectRma, processRma, completeRma, cancelRma, getRmaStats,
} from '../../api/rma.api'
import Badge from '../../components/common/Badge'
import Spinner from '../../components/common/Spinner'
import Modal from '../../components/common/Modal'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'

const COLUMNS = [
  { key: 'requested', label: 'Requested', color: '#f59e0b' },
  { key: 'approved', label: 'Approved', color: '#2563eb' },
  { key: 'processing', label: 'Processing', color: '#7c3aed' },
  { key: 'completed', label: 'Completed', color: '#10b981' },
  { key: 'rejected', label: 'Rejected', color: '#dc2626' },
  { key: 'cancelled', label: 'Cancelled', color: '#6b7280' },
]

const TYPE_LABEL = { return: 'Return', replacement: 'Replacement', repair: 'Repair' }
const priorityVariant = (p) => ({ low: 'active', medium: 'pending', high: 'overdue', urgent: 'suspended' })[p] || 'inactive'
const EMPTY_FORM = { type: 'replacement', priority: 'normal', reason: '', description: '' }

export default function RmaBoard() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const board = useQuery({
    queryKey: ['rmas'],
    queryFn: async () => {
      const res = await getRmas({ per_page: 200 })
      return res.data?.data ?? []
    },
  })

  const stats = useQuery({
    queryKey: ['rmas', 'stats'],
    queryFn: async () => (await getRmaStats()).data,
  })

  const invalidate = () => qc.invalidateQueries(['rmas'])

  const create = useMutation({
    mutationFn: () => createRma(form),
    onSuccess: () => { toast.success('RMA created'); setCreateOpen(false); setForm(EMPTY_FORM); invalidate() },
    onError: (err) => toast.error(err.response?.data?.message || 'Create failed'),
  })

  const act = useMutation({
    mutationFn: ({ type, id, payload }) => {
      const data = payload || {}
      if (type === 'approve') return approveRma(id, data)
      if (type === 'reject') return rejectRma(id, data)
      if (type === 'process') return processRma(id, data)
      if (type === 'complete') return completeRma(id, data)
      if (type === 'cancel') return cancelRma(id, data)
      return Promise.reject(new Error('Unsupported action'))
    },
    onSuccess: () => { toast.success('RMA updated'); invalidate() },
    onError: (err) => toast.error(err.response?.data?.message || 'Action failed'),
  })

  const items = board.data || []
  const s = stats.data || {}
  const byStatus = (status) => items.filter((r) => r.status === status)

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">RMA Operations Board</h2>
          <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>
            Returns, replacements and repairs — request &rarr; approve &rarr; process &rarr; complete
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: '#2563eb' }}
        >
          <Plus className="inline w-4 h-4 mr-1" /> Create RMA
        </button>
      </div>

      {stats.isLoading && <Spinner />}
      {!stats.isLoading && stats.data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="text-2xl font-bold" style={{ color: '#2563eb' }}>{s.total ?? '—'}</div>
            <div className="text-sm mt-1" style={{ color: 'var(--pb-text-3)' }}>Total RMAs</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{s.open ?? '—'}</div>
            <div className="text-sm mt-1" style={{ color: 'var(--pb-text-3)' }}>Open</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold" style={{ color: '#10b981' }}>{s.by_status?.completed ?? 0}</div>
            <div className="text-sm mt-1" style={{ color: 'var(--pb-text-3)' }}>Completed</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold" style={{ color: '#dc2626' }}>{(s.by_status?.rejected ?? 0) + (s.by_status?.cancelled ?? 0)}</div>
            <div className="text-sm mt-1" style={{ color: 'var(--pb-text-3)' }}>Rejected / Cancelled</div>
          </div>
        </div>
      )}

      {board.isLoading ? <Spinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
          {COLUMNS.map((col) => {
            const list = byStatus(col.key)
            return (
              <div key={col.key} className="card p-3 flex flex-col gap-2 min-h-[160px]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: col.color }}>{col.label}</span>
                  <span className="text-xs rounded-full px-2 py-0.5" style={{ background: `${col.color}1a`, color: col.color }}>{list.length}</span>
                </div>
                {list.length === 0 && (
                  <div className="text-xs text-center py-6" style={{ color: 'var(--pb-text-3)' }}>No RMAs</div>
                )}
                {list.map((r) => (
                  <div key={r.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-semibold">{r.rma_number}</span>
                      <Badge label={TYPE_LABEL[r.type] || r.type} variant="info" />
                    </div>
                    {r.reason && <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{r.reason}</p>}
                    <div className="flex items-center justify-between">
                      <Badge label={r.priority} variant={priorityVariant(r.priority)} />
                      <span className="text-[10px]" style={{ color: 'var(--pb-text-3)' }}>
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                      </span>
                    </div>
                    <RmaActions status={r.status} onAction={(type, payload) => act.mutate({ type, id: r.id, payload })} />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create RMA">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium">Type</label>
            <select className="input text-sm w-full" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="return">Return</option>
              <option value="replacement">Replacement</option>
              <option value="repair">Repair</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium">Priority</label>
            <select className="input text-sm w-full" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {['low', 'normal', 'high', 'urgent'].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium">Reason</label>
            <textarea className="input text-sm w-full" rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          <button
            disabled={create.isPending}
            onClick={() => create.mutate()}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ background: '#2563eb' }}
          >
            {create.isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

function RmaActions({ status, onAction }) {
  const button = (label, color, type, payload) => (
    <button
      onClick={(e) => { e.stopPropagation(); onAction(type, payload) }}
      className="px-2 py-1 text-[11px] rounded-md text-white"
      style={{ background: color }}
    >
      {label}
    </button>
  )

  if (status === 'requested') {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {button('Approve', '#10b981', 'approve', {})}
        {button('Reject', '#dc2626', 'reject', {})}
        {button('Cancel', '#6b7280', 'cancel', {})}
      </div>
    )
  }
  if (status === 'approved') {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {button('Start Processing', '#7c3aed', 'process', {})}
        {button('Cancel', '#6b7280', 'cancel', {})}
      </div>
    )
  }
  if (status === 'processing') {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {button('Complete', '#10b981', 'complete', {})}
        {button('Cancel', '#6b7280', 'cancel', {})}
      </div>
    )
  }
  return null
}