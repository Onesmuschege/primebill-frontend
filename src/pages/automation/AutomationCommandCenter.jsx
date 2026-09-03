import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getAutomationJobs, getAutomationRules, retryAutomationJob } from '../../api/automation.api'
import EntityHeader from '../../components/ops/EntityHeader'
import StateChain from '../../components/ops/StateChain'
import WorkQueue from '../../components/ops/WorkQueue'
import OperationalTimeline from '../../components/ops/OperationalTimeline'
import RelationshipNav from '../../components/ops/RelationshipNav'
import ErrorState from '../../components/common/ErrorState'
import Skeleton from '../../components/common/Skeleton'
import { Workflow, AlertTriangle, CheckCircle, PlayCircle } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * AutomationCommandCenter — unified automation operations workspace (P2 §25).
 *
 * Single source: AutomationController.
 *   - GET /automation/jobs     → { status_counts:{processing,done,failed},
 *                                  failed_jobs (unresolved), recent (failed/processing) }
 *   - GET /automation/rules    → bare array of rules (name, event_type, is_active, priority)
 *   - POST /automation/jobs/{id}/retry → queue a failed job for retry
 *
 * The pipeline StateChain is derived ONLY from real status_counts; a zero
 * failure count renders the failed stage as done, never as a hidden problem.
 */

const pipelineChain = (counts = {}) => {
  const processing = Number(counts.processing) || 0
  const done = Number(counts.done) || 0
  const failed = Number(counts.failed) || 0
  return [
    { id: 'queued', label: 'Accepted', state: 'done', detail: 'pipeline active' },
    {
      id: 'processing',
      label: 'Processing',
      state: processing > 0 ? 'active' : done > 0 || failed > 0 ? 'done' : 'upcoming',
      detail: `${processing} in flight`,
    },
    {
      id: 'completed',
      label: 'Completed',
      state: done > 0 ? 'done' : 'upcoming',
      detail: `${done} completed`,
    },
    {
      id: 'failed',
      label: 'Failed',
      state: failed > 0 ? 'failed' : processing > 0 ? 'upcoming' : 'done',
      detail: failed > 0 ? `${failed} failed` : 'none',
    },
  ]
}

export default function AutomationCommandCenter() {
  const qc = useQueryClient()

  const jobsQuery = useQuery({
    queryKey: ['automation', 'jobs'],
    queryFn: () => getAutomationJobs(),
    retry: false,
  })

  const rulesQuery = useQuery({
    queryKey: ['automation', 'rules'],
    queryFn: () => getAutomationRules({ with_inactive: false }),
    retry: false,
  })

  const retry = useMutation({
    mutationFn: (id) => retryAutomationJob(id),
    onSuccess: () => {
      toast.success('Job queued for retry')
      qc.invalidateQueries({ queryKey: ['automation', 'jobs'] })
      qc.invalidateQueries({ queryKey: ['automation', 'failures'] })
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Retry failed'),
  })

  const d = jobsQuery.data || {}
  const counts = d.status_counts || {}
  const failedJobs = d.failed_jobs || []
  const recent = d.recent || []
  const rules = Array.isArray(rulesQuery.data) ? rulesQuery.data : []

  const queueItems = failedJobs.map((f) => ({
    id: `af-${f.id}`,
    title: `${f.event_type || 'Automation job'} #${f.id}`,
    source: 'automation',
    priority: (f.attempts || 0) > 1 ? 'high' : 'medium',
    status: 'failed',
    createdAt: f.failed_at || f.created_at,
    actionLabel: 'Retry',
    onAction: true,
    detail: f.error,
  }))

  const retryOne = (item) => retry.mutate(String(item.id).replace(/^af-/, ''))
  if (jobsQuery.isError) {
    return (
      <ErrorState
        title="Could not load automation command"
        message={jobsQuery.error?.response?.data?.message || jobsQuery.error?.message}
        onRetry={jobsQuery.refetch}
      />
    )
  }

  if (jobsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <EntityHeader
        typeLabel="AUTOMATION COMMAND"
        title="Automation command center"
        subtitle="Event-driven OSS/BSS pipeline — health, failures and retry"
        icon={Workflow}
        status={{
          label:
            counts.failed > 0 ? 'Has failures' : counts.processing > 0 ? 'Processing' : 'Healthy',
          tone: counts.failed > 0 ? 'danger' : counts.processing > 0 ? 'info' : 'success',
        }}
        badges={[
          { label: `${counts.processing ?? 0} processing`, tone: 'info' },
          { label: `${counts.done ?? 0} completed`, tone: 'success' },
          { label: `${counts.failed ?? 0} failed`, tone: counts.failed > 0 ? 'danger' : 'muted' },
        ]}
        lastUpdated={jobsQuery.isFetching ? 'Refreshing…' : 'Live status'}
      />

      <RelationshipNav
        links={[
          { label: 'Event stream', to: '/automation/events' },
          { label: 'Failures', to: '/automation/failures' },
          { label: 'Rules & workflows', to: '/automation/rules' },
          { label: 'Execution history', to: '/automation/history' },
        ]}
      />

      {/* Pipeline state — derived only from real status_counts */}
      <div className="card p-4 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--pb-text-3)' }}>Pipeline state</p>
        <StateChain items={pipelineChain(counts)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'var(--pb-text-3)' }}>
              <AlertTriangle size={12} style={{ color: '#f87171' }} /> Unresolved failures
            </p>
            <Link to="/automation/failures" className="text-xs hover:underline" style={{ color: '#818cf8' }}>View all</Link>
          </div>
          <div className="card">
            <WorkQueue
              items={queueItems}
              emptyTitle="No unresolved automation failures"
              emptyDescription="Every automation job completed or was already retried."
              onAction={retryOne}
              selectable={false}
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'var(--pb-text-3)' }}>
            <PlayCircle size={12} style={{ color: '#f59e0b' }} /> Recent pipeline events
          </p>
          <div className="card">
            <OperationalTimeline
              dense
              maxItems={10}
              emptyTitle="No recent pipeline events"
              emptyDescription="Processing and failed automation events will appear here."
              events={recent.map((e) => ({
                id: e.id,
                timestamp: e.completed_at || e.created_at,
                title: e.type || 'Automation event',
                description: e.entity_type ? `${e.entity_type} #${e.entity_id ?? '—'}` : undefined,
                meta: e.status,
                tone: e.status === 'failed' ? 'danger' : e.status === 'processing' ? 'info' : 'success',
              }))}
            />
          </div>
        </div>
      </div>

      {/* Active rules snapshot */}
      <div className="card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'var(--pb-text-3)' }}>
            <Workflow size={12} style={{ color: '#a78bfa' }} /> Active rules
          </p>
          <Link to="/automation/rules" className="text-xs hover:underline" style={{ color: '#818cf8' }}>Manage</Link>
        </div>
        {rules.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>No active automation rules configured.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {rules.slice(0, 9).map((r) => (
              <div key={r.id} className="rounded-lg p-3 text-xs" style={{ background: 'var(--pb-raised)' }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium" style={{ color: 'var(--pb-text-1)' }}>{r.name}</span>
                  <CheckCircle size={12} style={{ color: '#34d399' }} />
                </div>
                <div className="mt-1" style={{ color: 'var(--pb-text-3)' }}>{r.event_type || '—'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
