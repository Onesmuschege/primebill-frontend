import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '../../api/axiosInstance'
import * as clients from '../../api/clients.api'

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

describe('clients api — list & status-op contract', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getClients normalises the Laravel paginator', async () => {
    api.get.mockResolvedValue({
      data: { data: [{ id: 1, first_name: 'Ada' }], current_page: 1, total: 1 },
    })
    const result = await clients.getClients({ page: 1 })
    expect(result).toEqual({
      data: [{ id: 1, first_name: 'Ada' }],
      meta: { current_page: 1, total: 1 },
    })
    expect(api.get).toHaveBeenCalledWith('/clients', { params: { page: 1 } })
  })

  it('getClient hits GET /clients/:id', async () => {
    api.get.mockResolvedValue({ data: { success: true, data: { id: 1 } } })
    await clients.getClient(1)
    expect(api.get).toHaveBeenCalledWith('/clients/1')
  })

  it('suspendClient hits POST /clients/:id/suspend', async () => {
    api.post.mockResolvedValue({ data: { success: true, data: { id: 1 } } })
    await clients.suspendClient(1)
    expect(api.post).toHaveBeenCalledWith('/clients/1/suspend')
  })

  it('activateClient hits POST /clients/:id/activate', async () => {
    api.post.mockResolvedValue({ data: { success: true, data: { id: 1 } } })
    await clients.activateClient(1)
    expect(api.post).toHaveBeenCalledWith('/clients/1/activate')
  })

  it('removeTagFromClient sends a data body on DELETE', async () => {
    api.delete.mockResolvedValue({ data: { success: true, data: {} } })
    await clients.removeTagFromClient(1, 5)
    expect(api.delete).toHaveBeenCalledWith('/clients/1/tags/remove', {
      data: { client_tag_id: 5 },
    })
  })
})
