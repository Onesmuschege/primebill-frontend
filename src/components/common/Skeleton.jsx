/**
 * Skeleton — shimmer placeholder for content that is loading.
 * Usage: <Skeleton className="h-4 w-full" /> or <Skeleton lines={3} />
 *
 * Uses CSS variables so it honours light/dark mode (var(--pb-border-sub)).
 */
export default function Skeleton({ className, lines }) {
  if (lines && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
          />
        ))}
      </div>
    )
  }
    const base = 'rounded animate-pulse'
  return (
    <div
      className={[base, className].filter(Boolean).join(' ')}
      style={{ backgroundColor: 'var(--pb-border-sub)', opacity: 0.6 }}
    />
  )
}
