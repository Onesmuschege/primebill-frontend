import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAutomationEvents } from '../../api/automation.api'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Badge from '../../components/common/Badge'

const STATUSES = ['processing', 'done', 'failed', 'cancelled']
const variant = { processing: 'pending', done: 'active', failed: 'overdue', cancelled: 'inactive' }

export default function AutomationEvents() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')

  const list = useQuery({
    queryKey: ['automation', 'events', page, status, type],
    queryFn: async () => {
      const res = await getAutomationEvents({ page, per_page: 20, status: status || undefined, type: type || undefined })
      const body = res.data?.data
      return { data: body?.data ?? [], meta: body?.meta ?? body ?? {} }
    },
  })

  const d = list.data || { data: [], meta: {} }

  return (
    <div className="space-y-5">
      <div className="card">
        <h2 className="text-lg font-semibold">Event Stream</h2>
        <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>Live automation pipeline events.</p>
      </div>

      <div className="card space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <select className="input text-sm" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input
            className="input text-sm"
            placeholder="Filter by type (e.g. payment_received)"
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1) }}
          />
        </div>

        <Table
          loading={list.isLoading}
          emptyMessage="No events match the filters."
          columns={[
            { key: 'id', label: 'ID', render: (r) => <span className="font-mono text-xs">#{r.id}</span> },
            { key: 'type', label: 'Type', render: (r) => <code className="text-xs">{r.type}</code> },
            { key: 'entity', label: 'Entity', render: (r) => <span className="text-xs">{r.entity_class?.split('\\').pop() || '—'} #{r.entity_id ?? ''}</span> },
            { key: 'status', label: 'Status', render: (r) => <Badge label={r.status} variant={variant[r.status] || 'inactive'} /> },
            { key: 'created_at', label: 'Created', render: (r) => <span className="text-xs">{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</span> },
          ]}
          data={d.data}
        />
        <Pagination meta={d.meta} onPageChange={setPage} />
      </div>
    </div>
  )
}
