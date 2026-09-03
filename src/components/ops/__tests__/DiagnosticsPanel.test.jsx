import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DiagnosticsPanel from '../DiagnosticsPanel'
import { buildDiagnostics } from '../../../utils/diagnostics'

// Payload shape mirrors ServiceNetworkController::status exactly.
const base = {
  service_state: 'ACTIVE',
  is_entitled: true,
  administrative_hold: false,
  suspension_type: null,
  active_sessions: [{ ip_address: '10.0.0.5' }],
  recent_control_logs: [],
}

describe('buildDiagnostics — evidence-based cause derivation', () => {
  it('online service: entitled + session → cause "Service is online"', () => {
    const d = buildDiagnostics(base)
    expect(d.likelyCause).toBe('Service is online')
    expect(d.stages.find((s) => s.id === 'session').result).toBe('pass')
    expect(d.stages.find((s) => s.id === 'entitlement').result).toBe('pass')
  })

  it('billing suspension: not entitled + PAST_DUE → cause "Billing suspension"', () => {
    const d = buildDiagnostics({
      ...base,
      service_state: 'PAST_DUE',
      is_entitled: false,
      active_sessions: [],
    })
    expect(d.likelyCause).toBe('Billing suspension')
    expect(d.causeEvidence.some((e) => e.includes('PAST_DUE'))).toBe(true)
  })

  it('administrative hold → cause "Administrative hold"', () => {
    const d = buildDiagnostics({
      ...base,
      service_state: 'SUSPENDED',
      is_entitled: false,
      administrative_hold: true,
      suspension_type: 'admin',
      active_sessions: [],
    })
    expect(d.likelyCause).toBe('Administrative hold')
  })

  it('entitled but failed auth log → cause "RADIUS authentication failure"', () => {
    const d = buildDiagnostics({
      ...base,
      active_sessions: [],
      recent_control_logs: [
        { id: 1, action: 'disconnect', status: 'success' },
        { id: 2, action: 'authorize', status: 'failed', error: 'Rejected' },
      ],
    })
    expect(d.likelyCause).toBe('RADIUS authentication failure')
    expect(d.stages.find((s) => s.id === 'radius').result).toBe('fail')
  })

  it('entitled + active + no session + no auth data → endpoint-not-authenticating (medium confidence)', () => {
    const d = buildDiagnostics({ ...base, active_sessions: [] })
    expect(d.likelyCause).toBe('No active session — endpoint not authenticating')
    expect(d.confidence).toBe('medium')
    expect(d.stages.find((s) => s.id === 'radius').result).toBe('unknown')
  })

  it('empty payload → no fabricated cause', () => {
    const d = buildDiagnostics({})
    expect(d.likelyCause).toBeNull()
    expect(d.stages.every((s) => s.result !== 'pass')).toBe(true)
  })
})

describe('DiagnosticsPanel rendering', () => {
  it('renders likely cause and evidence without crashing', () => {
    render(<DiagnosticsPanel status={base} />)
    expect(screen.getByTestId('diagnostics-panel')).toBeTruthy()
    expect(screen.getByText(/Likely cause: Service is online/)).toBeTruthy()
    expect(screen.getByText(/IP 10.0.0.5/)).toBeTruthy()
  })

  it('renders insufficient-evidence state for empty payload', () => {
    render(<DiagnosticsPanel status={{}} />)
    expect(screen.getByText(/Insufficient evidence/)).toBeTruthy()
  })
})
