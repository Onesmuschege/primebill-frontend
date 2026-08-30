import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '../../api/axiosInstance'
import * as loyalty from '../../api/loyalty.api'

vi.mock('../../api/axiosInstance', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  unwrapList: (response) => {
    const body = response?.data
    if (Array.isArray(body)) return { data: body, meta: {} }
    if (body && Array.isArray(body.data)) {
      const meta = body.meta || {}
      for (const k of ['current_page', 'last_page', 'per_page', 'total', 'from', 'to']) {
        if (body[k] !== undefined) meta[k] = body[k]
      }
      return { data: body.data, meta }
    }
    return { data: [], meta: {} }
  },
  unwrapOne: (response) => {
    const body = response?.data
    if (body && typeof body === 'object' && 'data' in body && 'success' in body) {
      return body.data
    }
    return body
  },
}))

describe('loyalty.api — normalized unwrap contract', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getClientLoyalty unwraps the client loyalty resource', async () => {
    api.get.mockResolvedValue({
      data: { success: true, data: { balance: 120, referral_code: 'ADA-123' } },
    })
    const result = await loyalty.getClientLoyalty(42)
    expect(api.get).toHaveBeenCalledWith('/loyalty/points/42')
    expect(result).toEqual({ balance: 120, referral_code: 'ADA-123' })
  })

  it('getLoyaltyLeaders passes the leaderboard array through', async () => {
    api.get.mockResolvedValue({
      data: { success: true, data: [{ id: 1, first_name: 'Ada', loyalty_points_balance: 90 }] },
    })
    const result = await loyalty.getLoyaltyLeaders()
    expect(api.get).toHaveBeenCalledWith('/loyalty/leaderboard')
    expect(result).toEqual([
      { id: 1, first_name: 'Ada', loyalty_points_balance: 90 },
    ])
  })

  it('getLoyaltyTransactions normalises the paginator', async () => {
    api.get.mockResolvedValue({
      data: { data: [{ id: 9, points: 5 }], current_page: 1, total: 1 },
    })
    const result = await loyalty.getLoyaltyTransactions({ client_id: 42 })
    expect(api.get).toHaveBeenCalledWith('/loyalty/transactions', {
      params: { client_id: 42 },
    })
    expect(result).toEqual({
      data: [{ id: 9, points: 5 }],
      meta: { current_page: 1, total: 1 },
    })
  })

  it('adjustPoints posts and unwraps the result', async () => {
    api.post.mockResolvedValue({
      data: { success: true, data: { balance: 140 } },
    })
    const result = await loyalty.adjustPoints(42, { points: 20, reason: 'bonus' })
    expect(api.post).toHaveBeenCalledWith('/loyalty/42/adjust', { points: 20, reason: 'bonus' })
    expect(result).toEqual({ balance: 140 })
  })
})