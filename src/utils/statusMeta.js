// ---------------------------------------------------------------------------
// statusMeta — PrimeBill operational status vocabulary.
//
// The canonical service state machine is ClientAccount::service_state on the
// backend (PENDING → PROVISIONING → ACTIVE → PAST_DUE → GRACE_PERIOD →
// SUSPENDED → TERMINATED), with ClientAccount::allowedTransitions() defining
// legal successors. This module is a PRESENTATION mapping over that backend
// reality — it never invents states the backend does not emit.
// ---------------------------------------------------------------------------

// Tone → Tailwind surface classes (light + dark). Used by StateChain,
// EntityHeader badges, ActionRail and OperationalTimeline throughout the
// operating-console layer.
export const STATUS_TONES = {
  success: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    dot: '#10b981',
  },
  warning: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    dot: '#f59e0b',
  },
  danger: {
    badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    dot: '#ef4444',
  },
  info: {
    badge: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
    dot: '#0ea5e9',
  },
  muted: {
    badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700',
    dot: '#94a3b8',
  },
}

// Canonical service lifecycle, in flow order (mirrors the backend constants).
export const SERVICE_STATE_FLOW = [
  'PENDING',
  'PROVISIONING',
  'ACTIVE',
  'PAST_DUE',
  'GRACE_PERIOD',
  'SUSPENDED',
  'TERMINATED',
]

// Presentation metadata per backend service_state value.
// Unknown/raw backend values fall back to a neutral "Unknown" mapping rather
// than being silently dropped.
export const SERVICE_STATE_META = {
  PENDING:      { label: 'Pending',      tone: 'warning' },
  PROVISIONING: { label: 'Provisioning', tone: 'info' },
  ACTIVE:       { label: 'Active',       tone: 'success' },
  PAST_DUE:     { label: 'Past Due',     tone: 'warning' },
  GRACE_PERIOD: { label: 'Grace Period', tone: 'warning' },
  SUSPENDED:    { label: 'Suspended',    tone: 'danger' },
  TERMINATED:   { label: 'Terminated',   tone: 'muted' },
}

// Legal transitions, mirrored from ClientAccount::allowedTransitions().
// Used to render "what can happen next" on a service without fabricating
// unsupported transitions. The backend remains authoritative.
export const SERVICE_ALLOWED_TRANSITIONS = {
  PENDING:      ['PROVISIONING', 'TERMINATED'],
  PROVISIONING: ['ACTIVE', 'SUSPENDED', 'TERMINATED'],
  ACTIVE:       ['PAST_DUE', 'SUSPENDED', 'TERMINATED'],
  PAST_DUE:     ['GRACE_PERIOD', 'ACTIVE', 'SUSPENDED'],
  GRACE_PERIOD: ['SUSPENDED', 'ACTIVE', 'PAST_DUE'],
  SUSPENDED:    ['ACTIVE', 'TERMINATED'],
  TERMINATED:   [],
}

export function serviceStateMeta(state) {
  const norm = String(state || '').toUpperCase()
  return SERVICE_STATE_META[norm] ?? { label: String(state || 'Unknown'), tone: 'muted' }
}

export function serviceStateToneClass(state) {
  return STATUS_TONES[serviceStateMeta(state).tone]?.badge ?? STATUS_TONES.muted.badge
}

// Generic status → tone mapping for non-service entities (invoice, payment,
// ticket, work order, router). Conservative: unknown values map to 'muted'.
const GENERIC_TONES = {
  active: 'success',
  online: 'success',
  paid: 'success',
  completed: 'success',
  complete: 'success',
  resolved: 'success',
  closed: 'success',
  won: 'success',
  open: 'info',
  pending: 'warning',
  processing: 'info',
  provisioning: 'info',
  past_due: 'warning',
  overdue: 'danger',
  grace: 'warning',
  grace_period: 'warning',
  suspended: 'danger',
  failed: 'danger',
  failed_job: 'danger',
  offline: 'danger',
  down: 'danger',
  cancelled: 'muted',
  canceled: 'muted',
  terminated: 'muted',
  inactive: 'muted',
  disabled: 'muted',
  revoked: 'muted',
}

export function genericStatusTone(status) {
  const norm = String(status || '').toLowerCase().replace(' ', '_')
  return GENERIC_TONES[norm] ?? 'muted'
}

export function genericStatusToneClass(status) {
  return STATUS_TONES[genericStatusTone(status)]?.badge ?? STATUS_TONES.muted.badge
}

/**
 * buildServiceStateChain — maps the authoritative ClientAccount::service_state
 * machine onto an ops-layer StateChain presentation. Stages BEFORE the current
 * state in the canonical flow are 'done'; the current stage 'active'; later
 * stages 'upcoming'; TERMINATED renders as the terminal 'ended' stage.
 * Flow presentation only — legal next states always come from
 * SERVICE_ALLOWED_TRANSITIONS (backend ClientAccount::allowedTransitions()).
 */
export function buildServiceStateChain(currentState) {
  const norm = String(currentState || '').toUpperCase()
  const idx = SERVICE_STATE_FLOW.indexOf(norm)
  if (idx === -1) {
    const meta = serviceStateMeta(norm)
    return [{ id: norm || 'unknown', label: meta.label, state: 'active' }]
  }
  return SERVICE_STATE_FLOW.map((state, i) => {
    const meta = serviceStateMeta(state)
    let stage = 'upcoming'
    if (i < idx) stage = 'done'
    else if (i === idx) stage = norm === 'TERMINATED' ? 'ended' : 'active'
    return {
      id: state,
      label: meta.label,
      state: stage,
      detail:
        i === idx && SERVICE_ALLOWED_TRANSITIONS[norm]?.length
          ? `Next: ${SERVICE_ALLOWED_TRANSITIONS[norm].map((s) => serviceStateMeta(s).label).join(', ')}`
          : undefined,
    }
  })
}
