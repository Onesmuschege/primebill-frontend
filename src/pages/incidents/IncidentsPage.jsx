import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getIncidents, createIncident, acknowledgeIncident, resolveIncident, closeIncident, escalateIncident, getIncidentStats,
} from '../../api/incidents.api'
import Table from '../../components/common/Table'
import Modal from '../../components/common/Modal'
import Spinner from '../../components/common/Spinner'
import Pagination from '../../components/common/Pagination'
import Badge from '../../components/common/Badge'
import toast from 'react-hot-toast'

const SEVERITIES = ['low', 'medium', 'high', 'critical']
const STATUSES = ['detected', 'acknowledged', 'investigating', 'mitigating', 'resolved', 'closed']
const EMPTY = { title: '', description: '', severity: 'medium', status: 'detected', affected_services: [] }

const sevVariant = (s) => ({ low: 'active', medium: 'pending', high: 'overdue', critical: 'suspended' })[s] || 'inactive'

export default function IncidentsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [severity, setSeverity] = useState('')
  const [modal, setModal] = useState(false)
  const [resolveOpen, setResolveOpen] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [resolution, setResolution] = useState({ resolution: '', root_cause: '' })
  const [escalateOpen, setEscalateOpen] = useState(null)
  const [escalation, setEscalation] = useState({ escalation_reason: '', severity: '' })

  const list = useQuery({
    queryKey: ['incidents', page, status, severity],
    queryFn: async () => {
      const res = await getIncidents({ page, per_page: 20, status: status || undefined, severity: severity || undefined })
      const body = res.data.data
      return { data: body?.data ?? [], meta: body?.meta ?? body ?? {} }
    },
  })
  const stats = useQuery({ queryKey: ['incidents', 'stats'], queryFn: async () => (await getIncidentStats()).data.data })

  const create = useMutation({
    mutationFn: () => createIncident(form),
    onSuccess: () => { toast.success('Incident created'); setModal(false); setForm(EMPTY); qc.invalidateQueries(['incidents']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Create failed'),
  })
  const act = useMutation({
    mutationFn: ({ type, id }) => {
      if (type === 'ack') return acknowledgeIncident(id)
      if (type === 'resolve') return resolveIncident(id, { ...resolution })
      if (type === 'close') return closeIncident(id)
      return Promise.reject(new Error('Unsupported'))
    },
    onSuccess: () => { toast.success('Updated'); setResolveOpen(null); qc.invalidateQueries(['incidents']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Action failed'),
  })
  const escalate = useMutation({
    mutationFn: () => escalateIncident(escalateOpen.id, escalation),
    onSuccess: () => { toast.success('Incident escalated'); setEscalateOpen(null); setEscalation({ escalation_reason: '', severity: '' }); qc.invalidateQueries(['incidents']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Escalation failed'),
  })

  const s = stats.data || {}
  const statCards = [
    { label: 'Open Incidents', value: s.open_incidents, color: '#f59e0b' },
    { label: 'Critical', value: s.critical_incidents, color: '#dc2626' },
    { label: 'Resolved Today', value: s.resolved_today, color: '#10b981' },
    { label: 'Avg Resolution (min)', value: s.avg_resolution_minutes != null ? Math.round(s.avg_resolution_minutes) : '—', color: '#2563eb' },
  ]

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Network Incidents</h2>
          <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>Outage detection, triage and resolution</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setModal(true) }} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#2563eb' }}>+ Create Incident</button>
      </div>

      {stats.isLoading && <Spinner />}
      {!stats.isLoading && stats.data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((c) => (
            <div key={c.label} className="card p-4">
              <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value ?? '—'}</div>
              <div className="text-sm mt-1" style={{ color: 'var(--pb-text-3)' }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card flex flex-wrap items-center gap-3">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="input text-sm">
          <option value="">All statuses</option>
          {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
        </select>
        <select value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1) }} className="input text-sm">
          <option value="">All severities</option>
          {SEVERITIES.map((sv) => <option key={sv} value={sv}>{sv}</option>)}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <Table
          loading={list.isLoading}
          data={list.data?.data || []}
          emptyMessage="No incidents found"
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'title', label: 'Title', render: (r) => <span className="font-medium">{r.title}</span> },
            { key: 'severity', label: 'Severity', render: (r) => <Badge label={r.severity} variant={sevVariant(r.severity)} /> },
            { key: 'status', label: 'Status', render: (r) => <Badge label={r.status} variant="info" /> },
            { key: 'detected_at', label: 'Detected', render: (r) => r.detected_at ? new Date(r.detected_at).toLocaleString() : '—' },
            { key: 'actions', label: '', render: (r) => (
              <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                {r.status === 'detected' && <button onClick={() => act.mutate({ type: 'ack', id: r.id })} className="px-2 py-1 text-xs rounded-md text-white" style={{ background: '#2563eb' }}>Ack</button>}
                {r.status !== 'resolved' && r.status !== 'closed' && <button onClick={() => { setResolveOpen(r); setResolution({ resolution: r.resolution || '', root_cause: r.root_cause || '' }) }} className="px-2 py-1 text-xs rounded-md text-white" style={{ background: '#10b981' }}>Resolve</button>}
                {r.status !== 'resolved' && r.status !== 'closed' && <button onClick={() => { setEscalateOpen(r); setEscalation({ escalation_reason: '', severity: r.severity }) }} className="px-2 py-1 text-xs rounded-md text-white" style={{ background: '#d97706' }}>Escalate</button>}
                {r.status === 'resolved' && <button onClick={() => act.mutate({ type: 'close', id: r.id })} className="px-2 py-1 text-xs rounded-md text-white" style={{ background: '#6b7280' }}>Close</button>}
              </div>
            ) },
          ]}
        />
        <Pagination meta={list.data?.meta} onPageChange={setPage} />
      </div>

      <Modal isOpen={!!modal} onClose={() => setModal(false)} title="Create Incident" size="md">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate() }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>Title *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input text-sm" required />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input text-sm" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>Severity</label>
              <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="input text-sm">
                {SEVERITIES.map((sv) => <option key={sv} value={sv}>{sv}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input text-sm">
                {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--pb-raised)' }}>Cancel</button>
            <button type="submit" disabled={create.isPending} className="px-4 py-2 rounded-lg text-sm text-white" style={{ background: '#2563eb' }}>{create.isPending ? 'Creating…' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!resolveOpen} onClose={() => setResolveOpen(null)} title="Resolve Incident" size="md">
        <form onSubmit={(e) => { e.preventDefault(); act.mutate({ type: 'resolve', id: resolveOpen.id }) }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>Root cause</label>
            <input value={resolution.root_cause} onChange={(e) => setResolution({ ...resolution, root_cause: e.target.value })} className="input text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>Resolution *</label>
            <textarea value={resolution.resolution} onChange={(e) => setResolution({ ...resolution, resolution: e.target.value })} className="input text-sm" rows={3} required />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setResolveOpen(null)} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--pb-raised)' }}>Cancel</button>
            <button type="submit" disabled={act.isPending} className="px-4 py-2 rounded-lg text-sm text-white" style={{ background: '#10b981' }}>{act.isPending ? 'Resolving…' : 'Resolve'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!escalateOpen} onClose={() => setEscalateOpen(null)} title="Escalate Incident" size="md">
        <form onSubmit={(e) => { e.preventDefault(); escalate.mutate() }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>Escalation reason *</label>
            <textarea value={escalation.escalation_reason} onChange={(e) => setEscalation({ ...escalation, escalation_reason: e.target.value })}
              className="input text-sm" rows={3} required placeholder="Why does this need a higher response level?" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>Bump severity to</label>
            <select value={escalation.severity} onChange={(e) => setEscalation({ ...escalation, severity: e.target.value })} className="input text-sm">
              {SEVERITIES.map((sv) => <option key={sv} value={sv}>{sv}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEscalateOpen(null)} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--pb-raised)' }}>Cancel</button>
            <button type="submit" disabled={escalate.isPending} className="px-4 py-2 rounded-lg text-sm text-white" style={{ background: '#d97706' }}>{escalate.isPending ? 'Escalating…' : 'Escalate'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}