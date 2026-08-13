import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '../../api/axiosInstance'
import * as tickets from '../../api/tickets.api'

vi.mock('../../api/axiosInstance', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { success: true, data: {} } })),
    post: vi.fn(() => Promise.resolve({ data: { success: true, data: {} } })),
    put: vi.fn(() => Promise.resolve({ data: { success: true, data: {} } })),
    delete: vi.fn(() => Promise.resolve({ data: { success: true, data: {} } })),
  },
}))

describe('tickets api — relationships & knowledge (Release 4)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('links a ticket to a work order via POST /tickets/:id/work-order', async () => {
    await tickets.linkTicketWorkOrder(7, 42)
    expect(api.post).toHaveBeenCalledWith('/tickets/7/work-order', { work_order_id: 42 })
  })

  it('unlinks via POST /tickets/:id/unlink-work-order', async () => {
    await tickets.unlinkTicketWorkOrder(7)
    expect(api.post).toHaveBeenCalledWith('/tickets/7/unlink-work-order')
  })

  it('lists knowledge refs via GET /tickets/:id/knowledge', async () => {
    await tickets.getTicketKnowledgeRefs(7)
    expect(api.get).toHaveBeenCalledWith('/tickets/7/knowledge')
  })

  it('attaches a knowledge ref via POST /tickets/:id/knowledge', async () => {
    await tickets.addTicketKnowledgeRef(7, { knowledge_base_article_id: 9, note: 'used for fix' })
    expect(api.post).toHaveBeenCalledWith('/tickets/7/knowledge', {
      knowledge_base_article_id: 9,
      note: 'used for fix',
    })
  })

  it('removes a knowledge ref via DELETE /tickets/:id/knowledge/:refId', async () => {
    await tickets.removeTicketKnowledgeRef(7, 5)
    expect(api.delete).toHaveBeenCalledWith('/tickets/7/knowledge/5')
  })
})
