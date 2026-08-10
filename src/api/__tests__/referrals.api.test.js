import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '../axiosInstance'
import * as referrals from '../referrals.api'

vi.mock('../axiosInstance', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))

describe('referrals.api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches the referral code with cleaned params', async () => {
    await referrals.getReferralCode({ search: '', foo: 'bar' })
    expect(api.get).toHaveBeenCalledWith('/referral/code', { params: { foo: 'bar' } })
  })

  it('joins a referral code via POST', async () => {
    await referrals.joinReferral({ referral_code: 'ABC123' })
    expect(api.post).toHaveBeenCalledWith('/referral/join', { referral_code: 'ABC123' })
  })

  it('fetches referral stats with cleaned params', async () => {
    await referrals.getReferralStats({ period: 'month', empty: '' })
    expect(api.get).toHaveBeenCalledWith('/referral/stats', { params: { period: 'month' } })
  })
})
