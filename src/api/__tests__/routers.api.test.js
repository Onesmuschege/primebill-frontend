import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '../../api/axiosInstance'
import * as routers from '../../api/routers.api'

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
    if (body && Array.isArray(body.data)) return { data: body.data, meta: {} }
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

describe('routers api — normalized unwrap contract', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getRouters normalises the list via unwrapList', async () => {
    api.get.mockResolvedValue({
      data: { data: [{ id: 1, name: 'Core-01', status: 'online' }] },
    })
    const result = await routers.getRouters()
    expect(result).toEqual({
      data: [{ id: 1, name: 'Core-01', status: 'online' }],
      meta: {},
    })
    expect(api.get).toHaveBeenCalledWith('/routers', { params: undefined })
  })

  it('getRouter unwraps a single resource', async () => {
    api.get.mockResolvedValue({
      data: { success: true, data: { id: 1, name: 'Core-01' } },
    })
    const result = await routers.getRouter(1)
    expect(api.get).toHaveBeenCalledWith('/routers/1')
    expect(result).toEqual({ id: 1, name: 'Core-01' })
  })

  it('testRouterConnection returns the unwrapped result', async () => {
    api.post.mockResolvedValue({
      data: { success: true, data: { connected: true, latency_ms: 12 } },
    })
    const result = await routers.testRouterConnection(1)
    expect(api.post).toHaveBeenCalledWith('/routers/1/test-connection')
    expect(result).toEqual({ connected: true, latency_ms: 12 })
  })

  it('getRouterSessions normalises the session list', async () => {
    api.get.mockResolvedValue({
      data: { data: [{ user: 'ada@isp', ip: '10.0.0.5' }] },
    })
    const result = await routers.getRouterSessions(1)
    expect(api.get).toHaveBeenCalledWith('/routers/1/sessions')
    expect(result.data).toEqual([{ user: 'ada@isp', ip: '10.0.0.5' }])
  })

  it('createRouter posts and unwraps the created router', async () => {
    api.post.mockResolvedValue({
      data: { success: true, data: { id: 2, name: 'Edge-02' } },
    })
    const result = await routers.createRouter({ name: 'Edge-02' })
    expect(api.post).toHaveBeenCalledWith('/routers', { name: 'Edge-02' })
    expect(result).toEqual({ id: 2, name: 'Edge-02' })
  })
})
