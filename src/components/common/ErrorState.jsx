import { RefreshCw, AlertCircle } from 'lucide-react'

/**
 * ErrorState — consistent error surface for pages/queries.
 * Never fabricates the error; surfaces `error.message` and offers a retry.
 */
export default function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Retry',
}) {
  return (
    <div
      className="card text-center py-12 flex flex-col items-center gap-4"
      style={{ color: 'var(--pb-text-3)' }}
    >
      <AlertCircle size={40} className="opacity-40" style={{ color: 'var(--color-danger)' }} />
      <div>
        <p className="font-medium" style={{ color: 'var(--pb-text-1)' }}>
          {title}
        </p>
        {message && <p className="text-sm mt-1 max-w-md">{message}</p>}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-primary flex items-center gap-1.5"
        >
          <RefreshCw size={14} /> {retryLabel}
        </button>
      )}
    </div>
  )
}
