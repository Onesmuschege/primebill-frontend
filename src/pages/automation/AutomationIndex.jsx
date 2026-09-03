import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getAutomationJobs, retryAutomationJob } from '../../api/automation.api'
import Spinner from '../../components/common/Spinner'
import toast from 'react-hot-toast'
import { Activity, AlertTriangle, Workflow, ScrollText, PlayCircle, ArrowRight } from 'lucide-react'

const TILES = [
  { to: '/automation/events', icon: Activity, label: 'Event Stream', desc: 'Live pipeline events', color: '#2563eb' },
  { to: '/automation/failures', icon: AlertTriangle, label: 'Failures', desc: 'Inspect & retry failed jobs', color: '#dc2626' },
  { to: '/automation/rules', icon: Workflow, label: 'Rules & Workflows', desc: 'Configure automation', color: '#7c3aed' },
  { to: '/automation/history', icon: ScrollText, label: 'Execution History', desc: 'Completed runs', color: '#10b981' },
]

export default function AutomationIndex() {
  const qc = useQueryClient()

  const jobs = useQuery({
    queryKey: ['automation', 'jobs'],
    queryFn: async () => {
      const res = await getAutomationJobs()
      return res.data?.data ?? {}
    },
  })

  const retry = useMutation({
    mutationFn: (id) => retryAutomationJob(id),
    onSuccess: () => { toast.success('Job queued for retry'); qc.invalidateQueries(['automation']) },
    onError: (e) => toast.error(e.response?.data?.message || 'Retry failed'),
  })

  const d = jobs.data || {}
  const counts = d.status_counts || {}
  const failed = d.failed_jobs || []

  return (
    <div className="space-y-5">
      <div className="card">
        <h2 className="text-lg font-semibold">Automation Console</h2>
        <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>
          Event-driven OSS/BSS pipeline — monitor, retry and configure automation.
        </p>
      </div>

      {jobs.isLoading ? <Spinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Processing" value={counts.processing} color="#f59e0b" />
          <StatCard label="Completed" value={counts.done} color="#10b981" />
          <StatCard label="Failed" value={counts.failed} color="#dc2626" />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TILES.map(({ to, icon: Icon, label, desc, color }) => ( // eslint-disable-line no-unused-vars
          <Link key={to} to={to} className="card group hover:border-blue-500/40 transition-colors">
            <div className="flex items-start justify-between">
              <Icon size={22} style={{ color }} />
              <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--pb-text-3)' }} />
            </div>
            <div className="mt-3 font-semibold text-sm">{label}</div>
            <div className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{desc}</div>
          </Link>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Unresolved Failures</h3>
          <Link to="/automation/failures" className="text-xs" style={{ color: '#2563eb' }}>View all</Link>
        </div>
        {failed.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>No unresolved failures.</p>
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
                <button
                  onClick={() => retry.mutate(f.id)}
                  disabled={retry.isPending}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50 shrink-0"
                  style={{ background: '#2563eb' }}
                >
                  <PlayCircle className="inline w-3.5 h-3.5 mr-1" /> Retry
                </button>
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
