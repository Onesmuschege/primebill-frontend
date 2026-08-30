import { Wifi } from 'lucide-react'

/**
 * EmptyState — themed empty/illustrated state for tables, lists and cards.
 * Replaces ad-hoc "No X yet" blocks scattered across pages.
 */
export default function EmptyState({
  // eslint-disable-next-line no-unused-vars
  icon: Icon = Wifi,
  title = 'No data',
  description,
  action,
  className = '',
}) {
  return (
    <div
      className={`card text-center py-12 ${className}`}
      style={{ color: 'var(--pb-text-3)' }}
    >
      <div className="flex justify-center mb-3" style={{ color: 'var(--pb-text-3)' }}>
        <Icon size={36} className="opacity-30" />
      </div>
      <p className="font-medium" style={{ color: 'var(--pb-text-1)' }}>
        {title}
      </p>
      {description && (
        <p className="text-sm mt-1 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}
