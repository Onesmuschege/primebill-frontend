import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '../../api/axiosInstance'
import * as wo from '../../api/work-orders.api'

vi.mock('../../api/axiosInstance', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { success: true, data: {} } })),
    post: vi.fn(() => Promise.resolve({ data: { success: true, data: {} } })),
    put: vi.fn(() => Promise.resolve({ data: { success: true, data: {} } })),
    delete: vi.fn(() => Promise.resolve({ data: { success: true, data: {} } })),
  },
}))

describe('work-orders api — materials & evidence (Release 4)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists parts via GET /work-orders/:id/parts', async () => {
    await wo.getWorkOrderParts(5)
    expect(api.get).toHaveBeenCalledWith('/work-orders/5/parts')
  })

  it('adds a part via POST /work-orders/:id/parts', async () => {
    const payload = { part_name: 'Cable', quantity: 2, unit_cost: 3.5 }
    await wo.addWorkOrderPart(5, payload)
    expect(api.post).toHaveBeenCalledWith('/work-orders/5/parts', payload)
  })

  it('lists/drops evidence on /work-orders/:id/attachments', async () => {
    await wo.getWorkOrderAttachments(9)
    expect(api.get).toHaveBeenCalledWith('/work-orders/9/attachments')

    const payload = { file_name: 'x.jpg', file_path: 'uploads/x.jpg', category: 'photo' }
    await wo.addWorkOrderAttachment(9, payload)
    expect(api.post).toHaveBeenCalledWith('/work-orders/9/attachments', payload)
  })
})