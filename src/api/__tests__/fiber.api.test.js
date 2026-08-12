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
}))

describe('fiber.api — capacity contract (Release 4)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getFiberCapacity GETs /fiber/capacity with query params', async () => {
    await fiber.getFiberCapacity({ olt_id: 3, per_page: 200 })
    expect(api.get).toHaveBeenCalledWith('/fiber/capacity', { params: { olt_id: 3, per_page: 200 } })
  })
})