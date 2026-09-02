import { useCallback, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import ConfirmDialog from '../common/ConfirmDialog'

/**
 * ActionRail — contextual, permission-aware action system (§5/§9 master prompt).
 *
 * Every action explicitly declares the backend capability it invokes. Actions
 * are ONLY rendered when:
 *   - the operator holds the declared permission (via useAuth().hasPermission,
 *     which already grants super_admin bypass), and
 *   - the action is not disabled for object-state reasons (caller decides —
 *     e.g. a TERMINATED service must not offer Activate).
 *
 * Destructive / consequential actions declare `confirm: { title, message }`
 * and are funnelled through the shared ConfirmDialog — never window.confirm.
 *
 * Props:
 *   actions     [{
 *     key, label, onClick,
 *     icon?          React node
 *     permission?    string, e.g. 'services.suspend'
 *     danger?        boolean — destructive styling
 *     disabled?      boolean — object-state gate (NOT permission)
 *     disabledReason? string — surfaced as title/aria-describedby
 *     confirm?       { title, message, confirmLabel? }
 *     pending?       boolean — per-action in-flight state
 *   }]
 *   orientation 'vertical' | 'horizontal'
 *   title       sr-only heading for the group
 *   hideWhenEmpty  render nothing when no actions are visible (default true)
 */
export default function ActionRail({
  actions = [],
  orientation = 'vertical',
  title = 'Available actions',
  hideWhenEmpty = true,
}) {
  const { hasPermission } = useAuth()
  const [confirming, setConfirming] = useState(null)

  const visible = actions.filter((a) => !a.permission || hasPermission(a.permission))

  const handleConfirm = useCallback(() => {
    const action = confirming
    setConfirming(null)
    action?.onClick?.()
  }, [confirming])

  if (hideWhenEmpty && visible.length === 0) return null

  const base =
    'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed'
  const normal =
    'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700'
  const dangerCls =
    'border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900/50'

  return (
    <>
      <div
        role="toolbar"
        aria-label={title}
        className={`flex ${orientation === 'vertical' ? 'flex-col items-stretch gap-1.5' : 'flex-row flex-wrap items-center gap-1.5'}`}
      >
        {visible.map((action) => {
          const isDisabled = Boolean(action.disabled)
          return (
            <button
              key={action.key}
              type="button"
              disabled={isDisabled || action.pending}
              aria-disabled={isDisabled}
              aria-busy={action.pending || undefined}
              title={action.disabled ? action.disabledReason : undefined}
              onClick={() => (action.confirm ? setConfirming(action) : action.onClick?.())}
              className={`${base} ${action.danger ? dangerCls : normal}`}
            >
              {action.icon && <span aria-hidden="true">{action.icon}</span>}
              <span>{action.label}</span>
              {action.pending && (
                <span
                  className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
                  aria-hidden="true"
                />
              )}
              {action.disabled && action.disabledReason && <span className="sr-only">— {action.disabledReason}</span>}
            </button>
          )
        })}
      </div>

      {confirming && (
        <ConfirmDialog
          isOpen
          onClose={() => setConfirming(null)}
          title={confirming.confirm?.title ?? confirming.label}
          message={confirming.confirm?.message}
          confirmLabel={confirming.confirm?.confirmLabel ?? confirming.label}
          destructive={confirming.danger}
          onConfirm={handleConfirm}
        />
      )}
    </>
  )
}
