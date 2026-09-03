import { useMemo } from 'react'
import { buildDiagnostics, PASS, FAIL, UNKNOWN } from '../../utils/diagnostics'

/**
 * DiagnosticsPanel — reusable service-offline investigation UI (§19/§20
 * master prompt). All derivation logic lives in utils/diagnostics.js
 * (pure, unit-tested); this component renders the evidence chain it returns.
 */

// ---- COMPONENT ----

const RESULT_GLYPH = { [PASS]: '✓', [FAIL]: '✗', [UNKNOWN]: '?' }
const RESULT_COLOR = {
  [PASS]: '#34d399',
  [FAIL]: '#f87171',
  [UNKNOWN]: '#fbbf24',
}

export default function DiagnosticsPanel({ status, title = 'Service diagnostics' }) {
  const { stages, likelyCause, causeEvidence, confidence } = useMemo(() => buildDiagnostics(status), [status])

  const failing = stages.filter((s) => s.result === FAIL)

  return (
    <div className="card p-4 space-y-3" data-testid="diagnostics-panel">
      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--pb-text-3)' }}>
        {title}
      </p>

      {likelyCause ? (
        <div className="rounded-lg p-3" style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid var(--pb-border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--pb-text-1)' }}>
            Likely cause: {likelyCause}
            {confidence === 'medium' && (
              <span className="ml-2 text-xs font-normal" style={{ color: 'var(--pb-text-3)' }}>(medium confidence)</span>
            )}
          </p>
          <ul className="mt-1 space-y-0.5">
            {causeEvidence.map((e, i) => (
              <li key={i} className="text-xs" style={{ color: 'var(--pb-text-2)' }}>· {e}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
          Insufficient evidence to determine a cause.
        </p>
      )}

      <ol className="space-y-1.5">
        {stages.map((s) => (
          <li key={s.id} className="flex items-start gap-2 text-sm">
            <span
              aria-hidden="true"
              className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full text-xs font-bold"
              style={{ background: 'var(--pb-raised)', color: RESULT_COLOR[s.result] }}
            >
              {RESULT_GLYPH[s.result]}
            </span>
            <div className="min-w-0">
              <p style={{ color: 'var(--pb-text-1)' }}>
                {s.label}
                <span className="ml-2 text-[10px] uppercase tracking-wide" style={{ color: RESULT_COLOR[s.result] }}>
                  {s.result === UNKNOWN ? 'no data' : s.result}
                </span>
              </p>
              {s.evidence.map((e, i) => (
                <p key={i} className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{e}</p>
              ))}
            </div>
          </li>
        ))}
      </ol>

      {failing.length > 0 && (
        <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
          {failing.length} failing stage{failing.length > 1 ? 's' : ''} in the chain. All conclusions above are derived
          from live backend data — refresh to re-evaluate.
        </p>
      )}
    </div>
  )
}
