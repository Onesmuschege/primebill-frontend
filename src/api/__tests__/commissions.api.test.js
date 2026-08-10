import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '../axiosInstance'
import * as commissions from '../commissions.api'

vi.mock('../axiosInstance', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))

describe('commissions.api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists commissions with cleaned params', async () => {
    await commissions.getCommissions({ status: 'pending', search: '' })
    expect(api.get).toHaveBeenCalledWith('/commissions', { params: { status: 'pending' } })
  })

  it('fetches the summary', async () => {
    await commissions.getCommissionSummary()
    expect(api.get).toHaveBeenCalledWith('/commissions/summary')
  })

  it('approves a commission', async () => {
    await commissions.approveCommission(7)
    expect(api.post).toHaveBeenCalledWith('/commissions/7/approve')
  })

  it('pays a commission with a payload', async () => {
    await commissions.payCommission(7, { payment_method: 'bank' })
    expect(api.post).toHaveBeenCalledWith('/commissions/7/pay', { payment_method: 'bank' })
  })

  it('defaults the pay payload to an empty object', async () => {
    await commissions.payCommission(7)
    expect(api.post).toHaveBeenCalledWith('/commissions/7/pay', {})
  })
})
