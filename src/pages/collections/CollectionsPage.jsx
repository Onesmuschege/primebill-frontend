import { useState } from 'react'
import { formatKES } from '../../utils/formatCurrency'
import useCollections from '../../hooks/useCollections'
import AgingDashboard from '../../components/collections/AgingDashboard'
import DunningStepTable from '../../components/collections/DunningStepTable'
import DunningRunTable from '../../components/collections/DunningRunTable'
import StepFormModal from '../../components/collections/StepFormModal'
import Spinner from '../../components/common/Spinner'

/**
 * Collections & Dunning — operational cockpit.
 *
 * Reads require `view collections` (route gate via ProtectedRoute); mutations
 * require `manage dunning` (enforced both in useCollections and on the backend
 * via FormRequest gates). This page gates the mutation UI by `canManage` for
 * clean UX — the backend stays authoritative.
 *
 * Composes the primitives in /components/collections and the common
 * Table/Modal/Pagination/Spinner building blocks.
 */
export default function CollectionsPage() {
  const {
    canManage,
    aging,
    agingLoading,
    refetchAging,
    steps,
    stepsLoading,
    runs,
    runsMeta,
    runsLoading,
    refetchRuns,
    runStatusFilter,
    setRunStatusFilter,
    setRunPage,
    deleteStep,
    reorderSteps,
    toggleStep,
    runNow,
  } = useCollections()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  // ── step ladder mutations ───────────────────────────────────────
  const handleMove = (i, dir) => {
    const arr = [...steps]
    const j = dir === 'up' ? i - 1 : i + 1
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    reorderSteps.mutate(arr.map((s, k) => ({ id: s.id, sequence: k + 1 })))
  }
  const handleDelete = (s) => {
    if (confirm(`Remove "${s.name}"? Recorded runs are kept.`)) deleteStep.mutate(s.id)
  }

  // ── run history ──────────────────────────────────────────────────
  const handleStatusChange = (v) => { setRunStatusFilter(v); setRunPage(1) }

  // ── manual run ──────────────────────────────────────────────────
  const handleRunNow = () => {
    if (confirm('Run the dunning engine now for this tenant?')) runNow.mutate()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--pb-text-1)' }}>Collections &amp; Dunning</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--pb-text-3)' }}>
            Track overdue receivables, configure the dunning ladder, run collections
            and audit every execution.
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--pb-text-2)' }}>
            {formatKES(aging?.total_outstanding ?? 0)} outstanding across{' '}
            {aging?.total_invoices ?? 0} overdue invoices
            {canManage && ' · you can manage the ladder and run collections'}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-ghost"
            onClick={() => { refetchAging(); refetchRuns() }}
            title="Refresh"
            aria-label="Refresh"
          >
            ↻
          </button>
          <button className="btn-primary" onClick={handleRunNow} disabled={runNow.isPending}>
            {runNow.isPending ? <Spinner size="sm" /> : 'Run dunning now'}
          </button>
        </div>
      </div>

      {/* Aging cockpit */}
      <AgingDashboard aging={aging} isLoading={agingLoading} />

      {/* Dunning ladder */}
      <div className="card p-4 stat-accent-purple">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--pb-text-2)' }}>Dunning ladder (escalation steps)</h2>
        <DunningStepTable
          steps={steps}
          canManage={canManage}
          loading={stepsLoading}
          onEdit={(s) => { setEditing(s); setModalOpen(true) }}
          onMove={handleMove}
          onToggle={(s) => toggleStep.mutate(s)}
          onDelete={handleDelete}
          onAdd={() => { setEditing(null); setModalOpen(true) }}
        />
      </div>

      {/* Run history */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--pb-text-2)' }}>Dunning run history</h2>
        <DunningRunTable
          runs={runs}
          meta={runsMeta}
          statusFilter={runStatusFilter}
          onStatusChange={handleStatusChange}
          onPageChange={setRunPage}
          isLoading={runsLoading}
        />
      </div>

      {/* New / edit step */}
      <StepFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        step={editing}
        onSaved={() => {}}
      />
    </div>
  )
}
