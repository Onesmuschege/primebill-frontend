import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAutomationFailures, retryAutomationJob } from '../../api/automation.api'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Badge from '../../components/common/Badge'
import toast from 'react-hot-toast'
import { PlayCircle } from 'lucide-react'

export default function AutomationFailures() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [resolved, setResolved] = useState(false)

    const list = useQuery({
    queryKey: ['automation', 'failures', page, resolved],
    queryFn: () => getAutomationFailures({ page, per_page: 20, resolved }),
  })

  const retry = useMutation({
    mutationFn: (id) => retryAutomationJob(id),
    onSuccess: () => { toast.success('Job queued for retry'); qc.invalidateQueries(['automation']) },
    onError: (e) => toast.error(e.response?.data?.message || 'Retry failed'),
  })

  const d = list.data || { data: [], meta: {} }

  return (
    <div className="space-y-5">
      <div className="card">
        <h2 className="text-lg font-semibold">Automation Failures</h2>
        <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>Failed pipeline jobs — inspect the error and retry.</p>
      </div>

      <div className="card space-y-3">
        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--pb-text-2)' }}>
          <input type="checkbox" checked={resolved} onChange={(e) => { setResolved(e.target.checked); setPage(1) }} />
          Include resolved
        </label>

        <Table
          loading={list.isLoading}
          emptyMessage="No failures found."
          columns={[
            { key: 'id', label: 'ID', render: (r) => <span className="font-mono text-xs">#{r.id}</span> },
            { key: 'event_type', label: 'Event' },
            { key: 'job_class', label: 'Job', render: (r) => <span className="text-xs">{r.job_class?.split('\\').pop() || '—'}</span> },
            { key: 'error', label: 'Error', render: (r) => <span className="text-xs text-red-600 line-clamp-2">{r.error}</span> },
            { key: 'attempts', label: 'Attempts', render: (r) => <Badge label={r.attempts} variant={r.attempts > 1 ? 'overdue' : 'pending'} /> },
            { key: 'status', label: 'Status', render: (r) => r.resolved_at ? <Badge label="resolved" variant="active" /> : <Badge label="unresolved" variant="overdue" /> },
            {
              key: 'actions', label: '',
              render: (r) => !r.resolved_at && (
                <button
                  onClick={() => retry.mutate(r.id)}
                  disabled={retry.isPending}
                  className="px-2 py-1 text-[11px] rounded-md text-white disabled:opacity-50"
                  style={{ background: '#2563eb' }}
                >
                  <PlayCircle className="inline w-3 h-3 mr-1" /> Retry
                </button>
              ),
            },
          ]}
          data={d.data}
        />
        <Pagination meta={d.meta} onPageChange={setPage} />
      </div>
    </div>
  )
}
