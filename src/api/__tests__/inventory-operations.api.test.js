import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '../../api/axiosInstance'
import { inventoryOperationsApi } from '../../api/inventory-operations.api'

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

describe('inventory-operations.api — normalized unwrap contract', () => {
  beforeEach(() => vi.clearAllMocks())

  it('listTransfers normalises the paginator', async () => {
    api.get.mockResolvedValue({
      data: { data: [{ id: 3, reference_number: 'TRF-3' }], current_page: 1, total: 1 },
    })
    const result = await inventoryOperationsApi.listTransfers({ page: 1 })
    expect(api.get).toHaveBeenCalledWith('/inventory/operations/transfers', {
      params: { page: 1 },
    })
    expect(result).toEqual({
      data: [{ id: 3, reference_number: 'TRF-3' }],
      meta: { current_page: 1, total: 1 },
    })
  })

  it('listPurchaseOrders normalises the paginator', async () => {
    api.get.mockResolvedValue({ data: { data: [{ id: 8 }], total: 1 } })
    const result = await inventoryOperationsApi.listPurchaseOrders({})
    expect(api.get).toHaveBeenCalledWith('/inventory/operations/purchase-orders', {
      params: {},
    })
    expect(result.data).toEqual([{ id: 8 }])
  })

  it('createTransfer posts and unwraps the resource', async () => {
    api.post.mockResolvedValue({
      data: { success: true, data: { id: 5, status: 'pending' } },
    })
    const result = await inventoryOperationsApi.createTransfer({
      source_warehouse_id: 1,
      destination_warehouse_id: 2,
    })
    expect(api.post).toHaveBeenCalledWith('/inventory/operations/transfers', {
      source_warehouse_id: 1,
      destination_warehouse_id: 2,
    })
    expect(result).toEqual({ id: 5, status: 'pending' })
  })

  it('approveTransfer hits the endpoint and unwraps', async () => {
    api.post.mockResolvedValue({
      data: { success: true, data: { id: 5, status: 'approved' } },
    })
    const result = await inventoryOperationsApi.approveTransfer(5)
    expect(api.post).toHaveBeenCalledWith('/inventory/operations/transfers/5/approve')
    expect(result).toEqual({ id: 5, status: 'approved' })
  })

  it('listWarehouses and listSuppliers normalise reference lists', async () => {
    api.get.mockResolvedValue({ data: { data: [{ id: 1, name: 'Main WH' }] } })
    const warehouses = await inventoryOperationsApi.listWarehouses()
    expect(api.get).toHaveBeenCalledWith('/inventory-ext/warehouses')
    expect(warehouses.data).toEqual([{ id: 1, name: 'Main WH' }])

    api.get.mockResolvedValue({ data: { data: [{ id: 2, name: 'Keystone Ltd' }] } })
    const suppliers = await inventoryOperationsApi.listSuppliers()
    expect(api.get).toHaveBeenCalledWith('/inventory-ext/suppliers')
    expect(suppliers.data).toEqual([{ id: 2, name: 'Keystone Ltd' }])
  })
})