import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '../../api/axiosInstance'
import * as fiber from '../../api/fiber.api'

vi.mock('../../api/axiosInstance', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
  unwrapList: (response) => {
    const body = response?.data
    if (Array.isArray(body)) return { data: body, meta: {} }
    if (body && Array.isArray(body.data)) return { data: body.data, meta: {} }
    if (body && body.data && Array.isArray(body.data.data)) {
      return { data: body.data.data, meta: {} }
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

describe('fiber.api — capacity contract (Release 4)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getFiberCapacity GETs /fiber/capacity with query params', async () => {
    await fiber.getFiberCapacity({ olt_id: 3, per_page: 200 })
    expect(api.get).toHaveBeenCalledWith('/fiber/capacity', { params: { olt_id: 3, per_page: 200 } })
  })
})
