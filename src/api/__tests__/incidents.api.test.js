import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '../../api/axiosInstance'
import * as incidents from '../../api/incidents.api'

vi.mock('../../api/axiosInstance', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { success: true, data: {} } })),
    post: vi.fn(() => Promise.resolve({ data: { success: true, data: {} } })),
    put: vi.fn(() => Promise.resolve({ data: { success: true, data: {} } })),
    delete: vi.fn(() => Promise.resolve({ data: { success: true, data: {} } })),
  },
}))

describe('incidents api — lifecycle actions (Release 4)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('acknowledges via POST /incidents/:id/acknowledge', async () => {
    await incidents.acknowledgeIncident(3)
    expect(api.post).toHaveBeenCalledWith('/incidents/3/acknowledge')
  })

  it('escalates via POST /incidents/:id/escalate with reason', async () => {
    await incidents.escalateIncident(3, { escalation_reason: 'customer impact rising', severity: 'critical' })
    expect(api.post).toHaveBeenCalledWith('/incidents/3/escalate', {
      escalation_reason: 'customer impact rising',
      severity: 'critical',
    })
  })

  it('resolves with resolution payload', async () => {
    await incidents.resolveIncident(3, { resolution: 'repaired' })
    expect(api.post).toHaveBeenCalledWith('/incidents/3/resolve', { resolution: 'repaired' })
  })

  it('closes via POST /incidents/:id/close', async () => {
    await incidents.closeIncident(3)
    expect(api.post).toHaveBeenCalledWith('/incidents/3/close')
  })
})
