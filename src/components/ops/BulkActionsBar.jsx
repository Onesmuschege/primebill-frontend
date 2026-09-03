import { useState } from 'react'
import ConfirmDialog from '../common/ConfirmDialog'
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react'

/**
 * BulkActionsBar — reusable bulk-action system (§16 master prompt).
 *
 * Appears when rows are selected. Provides:
 * - Selected count + clear selection
 * - Contextual bulk actions (passed as props)
 * - Confirmation dialog before execution
 * - Progress/processing state
 * - Result summary (success/failed/skipped) with drill-down
 *
 * Props:
 *   selectedIds      array of selected record IDs
 *   actions          [{ key, label, icon, destructive, onExecute }]
 *   onClear          callback to clear selection
 *   result           { succeeded, failed, skipped, results } | null
 *   onDismissResult  callback to dismiss result summary
 */

export default function BulkActionsBar({
  selectedIds = [],
  actions = [],
  onClear,
  result,
  onDismissResult,
}) {
  const [confirmAction, setConfirmAction] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  const selectedCount = selectedIds.length

  const handleActionClick = (action) => {
    if (action.destructive) {
      setConfirmAction(action)
    } else {
      executeAction(action)
    }
  }

  const executeAction = async (action) => {
    setConfirmAction(null)
    setProcessing(true)
    setError(null)
    try {
      await action.onExecute(selectedIds)
    } catch (e) {
      setError(e?.message || 'Operation failed')
    } finally {
      setProcessing(false)
    }
  }

  if (selectedCount === 0 && !result) return null

  return (
    <div className="space-y-3">
      {/* Action bar */}
      {selectedCount > 0 && (
        <div className="card p-3 flex items-center justify-between gap-3" style={{ background: 'rgba(99,102,241,0.06)' }}>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium" style={{ color: 'var(--pb-text-1)' }}>
              {selectedCount} selected
            </span>
            {actions.map((action) => (
              <button
                key={action.key}
                onClick={() => handleActionClick(action)}
                disabled={processing}
                className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors"
                style={{
                  background: action.destructive ? 'rgba(248,113,113,0.15)' : 'rgba(99,102,241,0.15)',
                  color: action.destructive ? '#f87171' : '#818cf8',
                }}
              >
                {action.icon && <action.icon size={13} />}
                {action.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {processing && <Loader2 size={14} className="animate-spin" style={{ color: '#818cf8' }} />}
            <button onClick={onClear} className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Result summary */}
      {result && (
        <div className="card p-3" style={{ background: 'var(--pb-raised)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle size={16} style={{ color: '#34d399' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--pb-text-1)' }}>
                  {result.succeeded} succeeded, {result.failed} failed
                  {result.skipped > 0 && `, ${result.skipped} skipped`}
                </p>
                {result.failed > 0 && (
                  <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
                    {result.results?.filter((r) => !r.success).length} records could not be processed
                  </p>
                )}
              </div>
            </div>
            <button onClick={onDismissResult} className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card p-3 flex items-center gap-2" style={{ background: 'rgba(248,113,113,0.08)' }}>
          <AlertTriangle size={14} style={{ color: '#f87171' }} />
          <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>
        </div>
      )}

      {/* Confirmation dialog */}
      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => executeAction(confirmAction)}
        message={confirmAction?.confirmMessage?.(selectedCount) || `Apply to ${selectedCount} records?`}
        confirmLabel={confirmAction?.confirmLabel || 'Confirm'}
        destructive={confirmAction?.destructive}
        isPending={processing}
      />
    </div>
  )
}
