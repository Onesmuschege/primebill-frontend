import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '../../api/axiosInstance'
import * as auto from '../../api/automation.api'

vi.mock('../../api/axiosInstance', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { success: true, data: {} } })),
    post: vi.fn(() => Promise.resolve({ data: { success: true, data: {} } })),
    put: vi.fn(() => Promise.resolve({ data: { success: true, data: {} } })),
    delete: vi.fn(() => Promise.resolve({ data: { success: true, data: {} } })),
  },
}))

describe('automation.api (endpoint contract)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists events with status/type filters', async () => {
    await auto.getAutomationEvents({ status: 'failed', type: 'payment_received', page: 2 })
    expect(api.get).toHaveBeenCalledWith('/automation/events', {
      params: { status: 'failed', type: 'payment_received', page: 2 },
    })
  })

  it('strips empty/undefined params', async () => {
    await auto.getAutomationEvents({ status: '', type: undefined, per_page: 10 })
    expect(api.get).toHaveBeenCalledWith('/automation/events', { params: { per_page: 10 } })
  })

  it('loads the jobs overview from GET /automation/jobs', async () => {
    await auto.getAutomationJobs()
    expect(api.get).toHaveBeenCalledWith('/automation/jobs')
  })

  it('lists failures via GET /automation/failures', async () => {
    await auto.getAutomationFailures({ event_type: 'payment_received', resolved: true, per_page: 10 })
    expect(api.get).toHaveBeenCalledWith('/automation/failures', {
      params: { event_type: 'payment_received', resolved: true, per_page: 10 },
    })
  })

  it('retries a failed job via POST /automation/jobs/:id/retry', async () => {
    await auto.retryAutomationJob(4)
    expect(api.post).toHaveBeenCalledWith('/automation/jobs/4/retry')
  })

  it('manages rules via GET/POST/PUT /automation/rules', async () => {
    await auto.getAutomationRules({ with_inactive: true })
    expect(api.get).toHaveBeenCalledWith('/automation/rules', { params: { with_inactive: true } })

    const payload = { name: 'Suspend on payment failure', event_type: 'payment_failed', priority: 10 }
    await auto.createAutomationRule(payload)
    expect(api.post).toHaveBeenCalledWith('/automation/rules', payload)

    await auto.updateAutomationRule(7, { is_active: false })
    expect(api.put).toHaveBeenCalledWith('/automation/rules/7', { is_active: false })
  })
})
