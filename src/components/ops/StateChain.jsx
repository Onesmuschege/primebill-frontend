import { STATUS_TONES } from '../../utils/statusMeta'


/**
 * StateChain — visualisation of an operational state chain (§14 master prompt).
 *
 * Renders a connected sequence of stages where each stage carries an explicit,
 * caller-supplied state. PrimeBill NEVER fabricates downstream success: the
 * caller passes only stages it can prove from backend data, each marked
 * 'done' | 'active' | 'upcoming' | 'failed' | 'ended'.
 *
 * Props:
 *   items       [{ id, label, state, detail?, onClick? }]
 *   orientation 'horizontal' | 'vertical'   (default horizontal)
 *   ariaLabel   accessible name, e.g. "Service provisioning state"
 *
 * State vocabulary (not colour-only — glyphs + aria provide non-visual parity):
 *   done      ✓ completed stage
 *   active    ● current stage (aria-current="step")
 *   failed    ✗ failed stage
 *   upcoming  ○ not yet reached
 *   ended     ■ terminal/neutral stage
 */
const ITEM_GLYPH = { done: '✓', active: '●', failed: '✗', upcoming: '○', ended: '■' }
const ITEM_TONE = { done: 'success', active: 'info', failed: 'danger', upcoming: 'muted', ended: 'muted' }

export default function StateChain({ items = [], orientation = 'horizontal', ariaLabel = 'Operational state' }) {
  if (!items.length) return null

  return (
    <ol
      aria-label={ariaLabel}
      className={`flex ${orientation === 'vertical' ? 'flex-col gap-1' : 'flex-row flex-wrap items-center gap-1'}`}
    >
      {items.map((item, idx) => {
        const tone = STATUS_TONES[ITEM_TONE[item.state] ?? 'muted']
        const isCurrent = item.state === 'active'
        const glyph = ITEM_GLYPH[item.state] ?? '○'
        const connector = (
          <li key={`${item.id}-conn`} aria-hidden="true" className={orientation === 'vertical' ? 'pl-[7px] py-0.5' : ''}>
            <span
              className={`block ${orientation === 'vertical' ? 'h-3 w-px' : 'h-px w-4'}`}
              style={{ backgroundColor: 'var(--pb-border, #cbd5e1)' }}
            />
          </li>
        )
        const node = (
          <li key={item.id} className="min-w-0">
            {item.onClick ? (
              <button
                type="button"
                onClick={item.onClick}
                aria-current={isCurrent ? 'step' : undefined}
                title={item.detail}
                className={`group inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs font-medium border transition-colors ${tone.badge} ${isCurrent ? 'ring-1 ring-offset-1' : ''} hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500`}
              >
                <span aria-hidden="true">{glyph}</span>
                <span>{item.label}</span>
                {isCurrent && <span className="sr-only">(current)</span>}
              </button>
            ) : (
              <span
                aria-current={isCurrent ? 'step' : undefined}
                title={item.detail}
                className={`inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs font-medium border ${tone.badge} ${isCurrent ? 'ring-1 ring-offset-1' : ''}`}
              >
                <span aria-hidden="true">{glyph}</span>
                <span>{item.label}</span>
                {isCurrent && <span className="sr-only">(current)</span>}
              </span>
            )}
            {item.detail && (
              <span className="ml-1.5 text-[11px]" style={{ color: 'var(--pb-text-3, #64748b)' }}>
                {item.detail}
              </span>
            )}
          </li>
        )
        return idx === 0 ? node : [connector, node]
      })}
    </ol>
  )
}
