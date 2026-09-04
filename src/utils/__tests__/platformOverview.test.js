import { describe, it, expect } from 'vitest'
import { OPS_QUEUE_ROUTES, queueHref, summarizeAttention } from '../platformOverview'

const QUEUES = ({ trials = 0, overdue = 0, near = 0, jobs = 0, security = 0 } = {}) => ({
  expiring_trials: { available: true, label: 'Expiring trials', count: trials, items: [] },
  overdue_accounts: { available: true, label: 'Tenants owing PrimeBill', count: overdue, items: [] },
  near_limit: { available: true, label: 'Tenants near limits', count: near, items: [] },
  failed_jobs: { available: true, label: 'Failed jobs', count: jobs, items: [] },
  security_events: { available: true, label: 'Security events (7d)', count: security, items: [] },
  failed_integrations: { available: false, label: 'Failed integrations', count: 0, items: [] },
  incidents: { available: false, label: 'Unresolved incidents', count: 0, items: [] },
})

describe('platformOverview — queue routing', () => {
  it('maps real queues to their operational views', () => {
    expect(queueHref('expiring_trials')).toBe('/platform/tenants?status=trial')
    expect(queueHref('overdue_accounts')).toBe('/platform/billing')
    expect(queueHref('near_limit')).toBe('/platform/tenants')
    expect(queueHref('failed_jobs')).toBe('/platform/system')
    expect(queueHref('security_events')).toBe('/platform/security')
  })

  it('returns null for backend-gap queues (no platform view)', () => {
    expect(queueHref('failed_integrations')).toBeNull()
    expect(queueHref('incidents')).toBeNull()
    expect(queueHref('nope')).toBeNull()
  })

  it('exposes every queue key in the route map for the sections renderer', () => {
    expect(Object.keys(OPS_QUEUE_ROUTES)).toHaveLength(7)
  })
})

describe('platformOverview — attention summary', () => {
  it('is ok when every queue is quiet', () => {
    expect(summarizeAttention(QUEUES())).toEqual({ total: 0, level: 'ok' })
  })

  it('is attention when any real queue has items', () => {
    expect(summarizeAttention(QUEUES({ trials: 3 }))).toEqual({ total: 3, level: 'attention' })
  })

  it('is critical when overdue revenue is at risk or jobs fail', () => {
    expect(summarizeAttention(QUEUES({ overdue: 2 }))).toEqual({ total: 2, level: 'critical' })
    expect(summarizeAttention(QUEUES({ jobs: 4 }))).toEqual({ total: 4, level: 'critical' })
  })

  it('sums available queues only — backend-gap queues never inflate the count', () => {
    const queues = QUEUES({ trials: 2, security: 5 })
    queues.failed_integrations.count = 999 // gap queues must be ignored
    queues.incidents.count = 999
    expect(summarizeAttention(queues)).toEqual({ total: 7, level: 'attention' })
  })

  it('tolerates missing/empty input', () => {
    expect(summarizeAttention(undefined)).toEqual({ total: 0, level: 'ok' })
    expect(summarizeAttention({})).toEqual({ total: 0, level: 'ok' })
  })
})