/**
 * Service diagnostics derivation — pure, unit-testable logic behind the
 * DiagnosticsPanel (§19/§20 master prompt). Consumes the authoritative
 * GET /network/services/{id}/status payload and presents an evidence chain.
 * Conclusions are DETERMINISTIC derivations of real fields only — never
 * fabricated. If evidence does not support a conclusion, the result says so
 * explicitly instead of guessing.
 */

export const PASS = 'pass'
export const FAIL = 'fail'
export const UNKNOWN = 'unknown'

function stage(id, label, result, evidence) {
  return { id, label, result, evidence }
}

// Deterministic likely-cause derivation — ordered by diagnostic priority.
// Priority: administrative hold FIRST (operator action, remedy = Restore),
// then billing suspension (remedy = settle invoice), then auth, then session.
function deriveLikelyCause({ state, entitled, adminHold, sessions, failedAuth, lastAuthLog }) {
  if (adminHold) {
    return {
      likelyCause: 'Administrative hold',
      causeEvidence: [
        'hasAdministrativeHold() = true',
        `Service state: ${state || 'unknown'}`,
        'Remedy: administrative restore (Restore action), not payment',
      ],
      confidence: 'high',
    }
  }
  if (!entitled && (state === 'PAST_DUE' || state === 'GRACE_PERIOD' || state === 'SUSPENDED')) {
    return {
      likelyCause: 'Billing suspension',
      causeEvidence: [
        `Service state: ${state}`,
        'Account not entitled',
        'No administrative hold — state is billing-driven',
      ],
      confidence: 'high',
    }
  }
  if (entitled && failedAuth) {
    return {
      likelyCause: 'RADIUS authentication failure',
      causeEvidence: [
        'Entitled and no admin hold',
        lastAuthLog
          ? `Last auth attempt failed: ${lastAuthLog.action}${lastAuthLog.error ? ` — ${lastAuthLog.error}` : ''}`
          : null,
      ].filter(Boolean),
      confidence: 'high',
    }
  }
  if (entitled && !adminHold && sessions.length === 0 && state === 'ACTIVE') {
    return {
      likelyCause: 'No active session — endpoint not authenticating',
      causeEvidence: [
        'Service ACTIVE and entitled',
        'No online RADIUS sessions',
        failedAuth
          ? 'Recent auth failures recorded'
          : 'No failed auth attempts in recent control logs — endpoint may be powered off or misconfigured',
      ],
      confidence: 'medium',
    }
  }
  if (sessions.length > 0 && entitled) {
    return {
      likelyCause: 'Service is online',
      causeEvidence: [`${sessions.length} online session(s)`, 'Account entitled'],
      confidence: 'high',
    }
  }
  return { likelyCause: null, causeEvidence: [], confidence: 'low' }
}

/**
 * buildDiagnostics — returns { stages, likelyCause, causeEvidence, confidence }
 * from real payload data. A stage is UNKNOWN when the backend field is absent;
 * absence of data is never reported as a confirmed-pass (§3: never fabricate
 * a successful downstream state merely because an upstream record exists).
 */
export function buildDiagnostics(st = {}) {
  const state = String(st.service_state || '').toUpperCase()
  const entitled = Boolean(st.is_entitled)
  const adminHold = Boolean(st.administrative_hold)
  const holdKnown = st.administrative_hold !== undefined
  const suspensionType = st.suspension_type || null
  const sessions = Array.isArray(st.active_sessions) ? st.active_sessions : []
  const logs = Array.isArray(st.recent_control_logs) ? st.recent_control_logs : []

  const authLogs = logs.filter((l) => /auth|connect|restore|activate/i.test(String(l.action || '')))
  const failedAuth = authLogs.some((l) => l.status === 'failed')
  const lastAuthLog = authLogs[0] || null

  const stages = [
    stage('state', 'Service state', state ? PASS : UNKNOWN, [
      state ? `Backend reports: ${state}` : 'service_state missing from payload',
    ]),
    stage('entitlement', 'Entitlement', entitled ? PASS : FAIL, [
      entitled
        ? 'Account is entitled (backend isEntitled())'
        : 'Account is NOT entitled — service will be rejected by RADIUS',
    ]),
    stage(
      'suspension',
      'Suspension / hold',
      !holdKnown ? UNKNOWN : adminHold ? FAIL : PASS,
      [
        !holdKnown
          ? 'administrative_hold missing from payload'
          : adminHold
            ? `Administrative hold ACTIVE${suspensionType ? ` (type: ${suspensionType})` : ''}`
            : 'No administrative hold',
        suspensionType && holdKnown && !adminHold ? `Suspension type recorded: ${suspensionType}` : null,
      ].filter(Boolean)
    ),
    stage(
      'radius',
      'RADIUS authentication',
      failedAuth ? FAIL : lastAuthLog ? PASS : UNKNOWN,
      [
        lastAuthLog
          ? `Last control log: ${lastAuthLog.action} — ${lastAuthLog.status}${lastAuthLog.error ? ` (${lastAuthLog.error})` : ''}`
          : 'No recent RADIUS control operations recorded',
      ]
    ),
    stage('session', 'Active session', sessions.length > 0 ? PASS : FAIL, [
      sessions.length > 0
        ? `${sessions.length} online session(s)${sessions[0]?.ip_address ? ` — IP ${sessions[0].ip_address}` : ''}`
        : 'No online RADIUS sessions',
    ]),
  ]

  return { stages, ...deriveLikelyCause({ state, entitled, adminHold, sessions, failedAuth, lastAuthLog }) }
}
