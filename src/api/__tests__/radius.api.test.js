import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '../../api/axiosInstance'
import * as radius from '../../api/radius.api'

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

describe('radius api — normalized unwrap contract', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getRadiusSettings unwraps the settings resource', async () => {
    api.get.mockResolvedValue({
      data: { success: true, data: { radius_driver: 'mock' } },
    })
    const result = await radius.getRadiusSettings()
    expect(api.get).toHaveBeenCalledWith('/settings/radius')
    expect(result).toEqual({ radius_driver: 'mock' })
  })

  it('testRadiusConnection returns { result, message }', async () => {
    api.post.mockResolvedValue({
      data: { success: true, message: 'Radius OK', data: { connected: true } },
    })
    const result = await radius.testRadiusConnection()
    expect(api.post).toHaveBeenCalledWith('/settings/radius/test')
    expect(result).toEqual({ result: { connected: true }, message: 'Radius OK' })
  })

  it('getRadiusSessions normalises the session list', async () => {
    api.get.mockResolvedValue({
      data: { data: [{ username: 'ada@isp' }], current_page: 2 },
    })
    const result = await radius.getRadiusSessions({ page: 2 })
    expect(api.get).toHaveBeenCalledWith('/radius/sessions', {
      params: { page: 2 },
    })
    expect(result).toEqual({
      data: [{ username: 'ada@isp' }],
      meta: { current_page: 2 },
    })
  })

  it('getRadiusStats unwraps the stats resource', async () => {
    api.get.mockResolvedValue({
      data: { success: true, data: { active_sessions: 5 } },
    })
    const result = await radius.getRadiusStats()
    expect(api.get).toHaveBeenCalledWith('/radius/stats')
    expect(result).toEqual({ active_sessions: 5 })
  })

  it('syncRadius hits POST /radius/sync', async () => {
    api.post.mockResolvedValue({ data: { success: true, data: { synced: 3 } } })
    await radius.syncRadius()
    expect(api.post).toHaveBeenCalledWith('/radius/sync')
  })
})
