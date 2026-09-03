/**
 * Format bytes into a human-readable string (GB/MB/KB/B).
 * Used for traffic/usage displays across the network console.
 */
export function formatBytes(bytes) {
  const n = Number(bytes || 0)
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(2)} GB`
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(1)} MB`
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${n} B`
}
