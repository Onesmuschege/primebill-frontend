import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '../axiosInstance'
import * as catalog from '../catalog.api'

vi.mock('../axiosInstance', () => {
  const mockApi = {
    get: vi.fn(() => Promise.resolve({ data: { data: [], meta: {} } })),
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

describe('catalog.api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists a tenant-scoped catalog resource with params', async () => {
    api.get.mockResolvedValueOnce({ data: { data: [{ id: 3, name: 'Fiber' }], meta: { total: 1 } } })
    const result = await catalog.listCatalog('service-catalog', 'service-templates', { search: 'fiber', page: 2 })
    expect(api.get).toHaveBeenCalledWith('/service-catalog/service-templates', {
      params: { search: 'fiber', page: 2 },
    })
    expect(result.data).toEqual([{ id: 3, name: 'Fiber' }])
  })

  it('does not leak empty filters into query params', async () => {
    api.get.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await catalog.listCatalog('inventory-ext', 'warehouses', { search: '', per_page: null })
    expect(api.get).toHaveBeenCalledWith('/inventory-ext/warehouses', { params: {} })
  })

  it('fetches a single catalog item by id', async () => {
    await catalog.getCatalogItem('router-config', 'router-templates', 7)
    expect(api.get).toHaveBeenCalledWith('/router-config/router-templates/7')
  })

  it('creates a catalog item via POST', async () => {
    const payload = { name: 'New Template', service_type: 'fiber' }
    await catalog.createCatalogItem('service-catalog', 'service-templates', payload)
    expect(api.post).toHaveBeenCalledWith('/service-catalog/service-templates', payload)
  })

  it('updates a catalog item via PUT', async () => {
    const payload = { name: 'Renamed' }
    await catalog.updateCatalogItem('support-catalog', 'departments', 9, payload)
    expect(api.put).toHaveBeenCalledWith('/support-catalog/departments/9', payload)
  })

  it('deletes a catalog item via DELETE', async () => {
    await catalog.deleteCatalogItem('reporting', 'dashboards', 4)
    expect(api.delete).toHaveBeenCalledWith('/reporting/dashboards/4')
  })

  it('transitions a campaign', async () => {
    await catalog.transitionCampaign(11, { status: 'sent' })
    expect(api.post).toHaveBeenCalledWith('/communications/campaigns/11/transition', {
      status: 'sent',
    })
  })

  it('exposes typed convenience accessors mapping to the same endpoints', async () => {
    await catalog.listWarehouses({ page: 1 })
    expect(api.get).toHaveBeenCalledWith('/inventory-ext/warehouses', { params: { page: 1 } })
  })
})