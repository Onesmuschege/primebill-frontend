import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '../../api/axiosInstance'
import * as rma from '../../api/rma.api'

vi.mock('../../api/axiosInstance', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))

describe('rma.api (endpoint contract)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists RMAs with filters', async () => {
    await rma.getRmas({ status: 'requested', per_page: 50 })
    expect(api.get).toHaveBeenCalledWith('/rma', { params: { status: 'requested', per_page: 50 } })
  })

  it('creates an RMA via POST /rma', async () => {
    const payload = { type: 'replacement', priority: 'high', reason: 'defective unit' }
    await rma.createRma(payload)
    expect(api.post).toHaveBeenCalledWith('/rma', payload)
  })

  it('exposes the full lifecycle sub-routes', async () => {
    await rma.approveRma(1, { notes: 'supplier confirmed' })
    expect(api.post).toHaveBeenCalledWith('/rma/1/approve', { notes: 'supplier confirmed' })

    await rma.rejectRma(1, { reason: 'under warranty' })
    expect(api.post).toHaveBeenCalledWith('/rma/1/reject', { reason: 'under warranty' })

    await rma.processRma(1, { tracking_number: 'TN-123' })
    expect(api.post).toHaveBeenCalledWith('/rma/1/process', { tracking_number: 'TN-123' })

    await rma.completeRma(1, { tracking_number: 'TN-123' })
    expect(api.post).toHaveBeenCalledWith('/rma/1/complete', { tracking_number: 'TN-123' })

    await rma.cancelRma(1, { reason: 'withdrawn' })
    expect(api.post).toHaveBeenCalledWith('/rma/1/cancel', { reason: 'withdrawn' })
  })

  it('stats / detail / update / delete hit correct endpoints', async () => {
    await rma.getRmaStats()
    expect(api.get).toHaveBeenCalledWith('/rma/stats')

    await rma.getRma(7)
    expect(api.get).toHaveBeenCalledWith('/rma/7')

    await rma.updateRma(7, { priority: 'critical' })
    expect(api.put).toHaveBeenCalledWith('/rma/7', { priority: 'critical' })

    await rma.deleteRma(7)
    expect(api.delete).toHaveBeenCalledWith('/rma/7')
  })
})