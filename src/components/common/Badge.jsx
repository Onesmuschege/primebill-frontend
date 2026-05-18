/**
 * Badge component
 * Usage: <Badge label="active" variant="active" />
 * Or pass className directly for custom styles.
 */

const VARIANTS = {
  active:    'badge-active',
  suspended: 'badge-suspended',
  overdue:   'badge-overdue',
  inactive:  'badge-inactive',
  paid:      'badge-paid',
  unpaid:    'badge-unpaid',
  pending:   'badge-pending',
  info:      'badge-info',
}

export default function Badge({ label, variant, className = '' }) {
  const variantClass = variant ? (VARIANTS[variant] ?? VARIANTS.inactive) : ''
  return (
    <span className={`badge ${variantClass} ${className}`}>
      {label}
    </span>
  )
}