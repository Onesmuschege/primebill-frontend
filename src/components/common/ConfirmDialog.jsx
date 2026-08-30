import Modal from './Modal'

/**
 * ConfirmDialog — standardised confirmation surface (replaces ad-hoc
 * `window.confirm()` calls). Destructive actions default to danger colouring.
 *
 * Props: isOpen, onClose, title, message, confirmLabel, destructive,
 *        isPending, onConfirm
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  destructive = true,
  isPending = false,
  onConfirm,
}) {
  return (
    <Modal isOpen={isOpen} onClose={isPending ? undefined : onClose} title={title} size="sm">
      <div className="space-y-4">
        {message && <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>{message}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={destructive ? 'btn-danger' : 'btn-primary'}
          >
            {isPending ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
