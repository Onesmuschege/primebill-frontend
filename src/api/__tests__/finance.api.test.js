import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '../axiosInstance'
import * as finance from '../finance.api'
import * as allocations from '../payment-allocations.api'

// Mock the shared axios instance so these tests verify the API client's
// request construction (method + URL + params/body) without a real network.
vi.mock('../axiosInstance', () => {
  const mockApi = {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  }
  const unwrapList = (response) => {
    const body = response.data
    if (Array.isArray(body.data)) return { data: body.data, meta: body.meta || {} }
    if (body.data && Array.isArray(body.data.data)) {
      return { data: body.data.data, meta: body.data.meta || {} }
    }
    return { data: [], meta: {} }
  }
  return { default: mockApi, unwrapList }
})

describe('finance.api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches wallet balance with client_id param', async () => {
    await finance.getWalletBalance(42)
    expect(api.get).toHaveBeenCalledWith('/finance/wallet/balance', {
      params: { client_id: 42 },
    })
  })

  it('deposits to wallet via POST', async () => {
    await finance.walletDeposit({ client_id: 7, amount: 500 })
    expect(api.post).toHaveBeenCalledWith('/finance/wallet/deposit', {
      client_id: 7,
      amount: 500,
    })
  })

  it('lists credit notes and unwraps paginated data', async () => {
    api.get.mockResolvedValueOnce({
      data: { data: [{ id: 1 }], meta: { current_page: 1 } },
    })
    const result = await finance.getCreditNotes({ page: 1, per_page: 15 })
    expect(api.get).toHaveBeenCalledWith('/finance/credit-notes', {
      params: { page: 1, per_page: 15 },
    })
    expect(result.data).toEqual([{ id: 1 }])
  })

  it('creates a debit note via POST', async () => {
    const payload = { client_id: 3, amount: 250, reason: 'Adjustment' }
    await finance.createDebitNote(payload)
    expect(api.post).toHaveBeenCalledWith('/finance/debit-notes', payload)
  })

  it('issues a refund via POST', async () => {
    const payload = { client_id: 9, payment_id: 5, amount: 100 }
    await finance.createRefund(payload)
    expect(api.post).toHaveBeenCalledWith('/finance/refunds', payload)
  })

  it('creates a payment plan via POST', async () => {
    const payload = { client_id: 2, installment_count: 3, frequency: 'monthly' }
    await finance.createPaymentPlan(payload)
    expect(api.post).toHaveBeenCalledWith('/finance/payment-plans', payload)
  })

  it('fetches trial balance', async () => {
    await finance.getTrialBalance({ from: '2026-01-01' })
    expect(api.get).toHaveBeenCalledWith('/finance/statement/trial-balance', {
      params: { from: '2026-01-01' },
    })
  })

  it('verifies ledger integrity', async () => {
    await finance.verifyLedger()
    expect(api.get).toHaveBeenCalledWith('/finance/statement/verify-ledger')
  })
})

describe('payment-allocations.api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists allocations with filters', async () => {
    api.get.mockResolvedValueOnce({
      data: { data: [{ id: 1 }], meta: { current_page: 1 } },
    })
    const result = await allocations.getPaymentAllocations({ payment_id: 4 })
    expect(api.get).toHaveBeenCalledWith('/payment-allocations', {
      params: { payment_id: 4 },
    })
    expect(result.data).toEqual([{ id: 1 }])
  })

  it('creates an allocation via POST', async () => {
    const payload = {
      payment_id: 4,
      client_id: 1,
      allocations: [{ invoice_id: 10, amount: 500 }],
    }
    await allocations.createPaymentAllocation(payload)
    expect(api.post).toHaveBeenCalledWith('/payment-allocations', payload)
  })

  it('reverses an allocation via POST', async () => {
    await allocations.reversePaymentAllocation(99, { reason: 'test' })
    expect(api.post).toHaveBeenCalledWith('/payment-allocations/99/reverse', {
      reason: 'test',
    })
  })

  it('does not leak empty filters into query params', async () => {
    api.get.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await allocations.getPaymentAllocations({ payment_id: '', client_id: null })
    expect(api.get).toHaveBeenCalledWith('/payment-allocations', {
      params: {},
    })
  })
})
