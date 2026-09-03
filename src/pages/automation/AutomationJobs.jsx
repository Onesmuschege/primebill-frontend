import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAutomationJobs, retryAutomationJob } from '../../api/automation.api'
import Badge from '../../components/common/Badge'
import Spinner from '../../components/common/Spinner'

const variant = { processing: 'pending', done: 'active', failed: 'overdue', cancelled: 'inactive' }

export default function AutomationJobs() {
    const jobs = useQuery({
    queryKey: ['automation', 'jobs'],
    queryFn: () => getAutomationJobs(),
  })
  const qc = useQueryClient()
  const retry = useMutation({
    mutationFn: (id) => retryAutomationJob(id),
    onSuccess: () => { alert('Retry queued'); qc.invalidateQueries(['automation', 'jobs']) },
    onError: (e) => alert(e.response?.data?.message || 'Retry failed'),
  })



  if (jobs.isLoading) return <Spinner />

  const d = jobs.data || {}
  const counts = d.status_counts || {}
  const recent = d.recent || []
  const failed = d.failed_jobs || []

  return (
    <div className="space-y-5">
      <div className="card">
        <h2 className="text-lg font-semibold">Jobs</h2>
        <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>Current load — counts and recently active/failed jobs.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Processing" value={counts.processing} color="#f59e0b" />
        <StatCard label="Completed" value={counts.done} color="#10b981" />
        <StatCard label="Failed" value={counts.failed} color="#dc2626" />
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Recent Processing / Failed</h3>
        {recent.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>No recent jobs.</p>
        ) : (
          <div className="space-y-2">
            {recent.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 p-3 rounded-lg" style={{ background: 'var(--pb-raised)' }}>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {e.type} <span className="text-xs" style={{ color: 'var(--pb-text-3)' }}>#{e.id}</span>
                  </div>
                  <div className="text-xs truncate" style={{ color: 'var(--pb-text-3)' }}>
                    {e.entity_class?.split('\\').pop() || '—'} · {e.created_at ? new Date(e.created_at).toLocaleString() : '—'}
                  </div>
                </div>
                <Badge label={e.status} variant={variant[e.status] || 'inactive'} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Unresolved Failures</h3>
        {failed.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>None.</p>
        ) : (
          <div className="space-y-2">
            {failed.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-3 p-3 rounded-lg" style={{ background: 'var(--pb-raised)' }}>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {f.event_type} <span className="text-xs" style={{ color: 'var(--pb-text-3)' }}>#{f.entity_id ?? '—'}</span>
                  </div>
                  <div className="text-xs truncate" style={{ color: 'var(--pb-text-3)' }}>{f.error}</div>
                </div>
                                <div className="flex items-center gap-2">
                  <Badge label={f.attempts > 1 ? `${f.attempts} attempts` : '1 attempt'} variant={f.attempts > 1 ? 'overdue' : 'pending'} />
                  <button
                    onClick={() => retry.mutate(f.id)}
                    disabled={retry.isPending}
                    className="px-2 py-1 rounded text-xs font-medium" style={{ background: 'rgba(59,130,223,0.15)', color: '#3b82f6' }}
                    title="Retry this failed job"
                  >↻ Retry</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className="card">
      <div className="text-3xl font-bold" style={{ color }}>{value ?? 0}</div>
      <div className="text-sm mt-1" style={{ color: 'var(--pb-text-3)' }}>{label}</div>
    </div>
  )
}
