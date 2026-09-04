/**
 * Platform Overview derived-context helpers (pure / unit-testable).
 *
 * The operational queues come from GET /platform/stats → data.ops_queues.
 * Each queue is { available, label, count, items }. Queues the backend can't
 * measure yet are marked available:false — the UI surfaces those as honest
 * "backend gap" states instead of inventing counts (§40).
 */

// Queue key → operational view deep-link. null = no platform view yet.
export const OPS_QUEUE_ROUTES = {
  expiring_trials: '/platform/tenants?status=trial',
  overdue_accounts: '/platform/billing',
  near_limit: '/platform/tenants',
  failed_jobs: '/platform/system',
  security_events: '/platform/security',
  // Backend gaps — tenant-scoped-only today; no platform-wide view exists.
  failed_integrations: null,
  incidents: null,
}

/** Route for an ops queue, or null when the platform has no view for it. */
export function queueHref(queueKey) {
  return OPS_QUEUE_ROUTES[queueKey] ?? null
}

/**
 * Aggregate attention across the ops queues for the Layer-1 status strip.
 *
 * @param {object} opsQueues — data.ops_queues from /platform/stats
 * @returns {{ total: number, level: 'ok'|'attention'|'critical' }}
 *   total      — sum of available queue counts (backend-gap queues excluded)
 *   level      — 'critical' when revenue is at risk or infra failed jobs > 0;
 *                'attention' when anything else needs operator action;
 *                'ok' when the platform is quiet.
 */
export function summarizeAttention(opsQueues = {}) {
  const total = Object.values(opsQueues)
    .filter(q => q && q.available !== false)
    .reduce((sum, q) => sum + (Number(q.count) || 0), 0)

  const hasCritical = (opsQueues.failed_jobs?.count ?? 0) > 0
    || (opsQueues.overdue_accounts?.count ?? 0) > 0

  if (hasCritical) return { total, level: 'critical' }
  if (total > 0) return { total, level: 'attention' }
  return { total, level: 'ok' }
}