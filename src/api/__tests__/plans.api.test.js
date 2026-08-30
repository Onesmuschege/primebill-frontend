import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '../../api/axiosInstance'
import * as plans from '../../api/plans.api'

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

describe('plans api — normalized unwrapping contract', () => {
  beforeEach(() => vi.clearAllMocks())

  it('normalizes the Laravel paginator list via unwrapList', async () => {
    api.get.mockResolvedValue({
      data: { data: [{ id: 1, name: 'Home 10M' }], current_page: 1, total: 1 },
    })
    const result = await plans.getPlans({ page: 1 })
    expect(result).toEqual({
      data: [{ id: 1, name: 'Home 10M' }],
      meta: { current_page: 1, total: 1 },
    })
    expect(api.get).toHaveBeenCalledWith('/plans', { params: { page: 1 } })
  })

  it('unwraps a single resource via unwrapOne', async () => {
    api.get.mockResolvedValue({
      data: { success: true, data: { id: 1, name: 'Home 10M' } },
    })
    const result = await plans.getPlan(1)
    expect(api.get).toHaveBeenCalledWith('/plans/1')
    expect(result).toEqual({ id: 1, name: 'Home 10M' })
  })

  it('createPlan posts the payload and returns the unwrapped resource', async () => {
    api.post.mockResolvedValue({
      data: { success: true, data: { id: 2, name: 'Biz 50M' } },
    })
    const result = await plans.createPlan({ name: 'Biz 50M' })
    expect(api.post).toHaveBeenCalledWith('/plans', { name: 'Biz 50M' })
    expect(result).toEqual({ id: 2, name: 'Biz 50M' })
  })

  it('toggleActivePlan hits POST /plans/:id/toggle-active', async () => {
    api.post.mockResolvedValue({
      data: { success: true, data: { id: 1, is_active: false } },
    })
    const result = await plans.toggleActivePlan(1)
    expect(api.post).toHaveBeenCalledWith('/plans/1/toggle-active')
    expect(result).toEqual({ id: 1, is_active: false })
  })

  it('bulkUpdatePlans sends ids spread with the bandwidth payload', async () => {
    api.post.mockResolvedValue({ data: { success: true, data: { updated: 2 } } })
    await plans.bulkUpdatePlans([1, 2], { speed_up: 50 })
    expect(api.post).toHaveBeenCalledWith('/plans/bulk/update', {
      ids: [1, 2],
      speed_up: 50,
    })
  })

  it('getPlanTemplates normalises a template list', async () => {
    api.get.mockResolvedValue({ data: [{ id: 9, name: 'Home Template' }] })
    const result = await plans.getPlanTemplates()
    expect(result).toEqual({ data: [{ id: 9, name: 'Home Template' }], meta: {} })
    expect(api.get).toHaveBeenCalledWith('/plan-templates')
  })
})
