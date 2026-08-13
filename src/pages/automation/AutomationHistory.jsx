import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAutomationEvents } from '../../api/automation.api'
import Pagination from '../../components/common/Pagination'
import Badge from '../../components/common/Badge'
import Spinner from '../../components/common/Spinner'
import { ChevronDown, ChevronRight } from 'lucide-react'

const variant = { done: 'active', cancelled: 'inactive' }

export default function AutomationHistory() {
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState(null)

  const list = useQuery({
    queryKey: ['automation', 'history', page],
    queryFn: async () => {
      const res = await getAutomationEvents({ page, per_page: 25, status: 'done' })
      const body = res.data?.data
      return { data: body?.data ?? [], meta: body?.meta ?? body ?? {} }
    },
  })

  const d = list.data || { data: [], meta: {} }

  return (
    <div className="space-y-5">
      <div className="card">
        <h2 className="text-lg font-semibold">Execution History</h2>
        <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>Completed automation runs with results.</p>
      </div>

      <div className="card space-y-2">
        {list.isLoading ? <Spinner /> : d.data.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--pb-text-3)' }}>No completed executions yet.</p>
        ) : (
          d.data.map((e) => (
            <div key={e.id} className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--pb-border)' }}>
              <button
                onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                style={{ background: 'var(--pb-raised)' }}
              >
                <div className="min-w-0 flex items-center gap-3">
                  {expanded === e.id ? <ChevronDown size={15} style={{ color: 'var(--pb-text-3)' }} /> : <ChevronRight size={15} style={{ color: 'var(--pb-text-3)' }} />}
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {e.type} <span className="text-xs" style={{ color: 'var(--pb-text-3)' }}>#{e.id}</span>
                    </div>
                    <div className="text-xs truncate" style={{ color: 'var(--pb-text-3)' }}>
                      {e.entity_class?.split('\\').pop() || '—'} #{e.entity_id ?? ''} ·{' '}
                      {e.completed_at ? new Date(e.completed_at).toLocaleString() : (e.created_at ? new Date(e.created_at).toLocaleString() : '—')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge label={e.status} variant={variant[e.status] || 'inactive'} />
                  <span className="text-[10px] font-mono" style={{ color: 'var(--pb-text-3)' }}>{e.idempotency_key?.slice(0, 12)}</span>
                </div>
              </button>
              {expanded === e.id && e.result && (
                <div className="px-4 py-3">
                  <div className="text-xs font-semibold mb-1" style={{ color: 'var(--pb-text-2)' }}>Result</div>
                  <pre className="text-xs p-3 rounded-lg overflow-auto" style={{ background: 'var(--pb-raised)', color: 'var(--pb-text-2)' }}>{JSON.stringify(e.result, null, 2)}</pre>
                </div>
              )}
            </div>
          ))
        )}
        <Pagination meta={d.meta} onPageChange={setPage} />
      </div>
    </div>
  )
}
