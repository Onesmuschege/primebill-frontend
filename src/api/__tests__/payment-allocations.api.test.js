import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '../axiosInstance'
import * as pa from '../payment-allocations.api'

vi.mock('../axiosInstance', () => {
  const mockApi = {
    get: vi.fn(() => Promise.resolve({ data: { success: true, data: [] } })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  }
  const unwrapList = (response) => {
    const body = response.data
    if (Array.isArray(body)) return { data: body, meta: {} }
    if (Array.isArray(body?.data)) return { data: body.data, meta: body.meta || {} }
    if (body?.data && Array.isArray(body.data.data)) {
      return { data: body.data.data, meta: body.data.meta || {} }
    }
    return { data: [], meta: {} }
  }
  const unwrapOne = (response) => {
    const body = response?.data
    if (body && typeof body === 'object' && 'data' in body && 'success' in body) {
      return body.data
    }
    return body
  }
  return { default: mockApi, unwrapList, unwrapOne }
})

describe('payment-allocations.api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists allocations with filters (params cleaned)', async () => {
    await pa.getPaymentAllocations({ page: 2, per_page: 20, status: 'allocated', empty: '', nullish: null, undef: undefined })
    expect(api.get).toHaveBeenCalledWith('/payment-allocations', {
      params: { page: 2, per_page: 20, status: 'allocated' },
    })
  })

  it('fetches a single allocation', async () => {
    await pa.getPaymentAllocation(9)
    expect(api.get).toHaveBeenCalledWith('/payment-allocations/9')
  })

  it('creates an allocation across multiple invoices', async () => {
    await pa.createPaymentAllocation({
      payment_id: 1,
      client_id: 2,
      allocations: [{ invoice_id: 10, amount: 500 }, { invoice_id: 11, amount: 300 }],
      reference: 'manual split',
    })
    expect(api.post).toHaveBeenCalledWith('/payment-allocations', {
      payment_id: 1,
      client_id: 2,
      allocations: [{ invoice_id: 10, amount: 500 }, { invoice_id: 11, amount: 300 }],
      reference: 'manual split',
    })
  })

  it('reverses an allocation with a reason', async () => {
    await pa.reversePaymentAllocation(5, { reason: 'wrong invoice' })
    expect(api.post).toHaveBeenCalledWith('/payment-allocations/5/reverse', { reason: 'wrong invoice' })
  })
})
