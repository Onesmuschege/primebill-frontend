import api, { unwrapList, unwrapOne } from './axiosInstance'

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

export const getTickets = (params) => api.get('/tickets', { params: clean(params) }).then(unwrapList)
export const getTicket = (id) => api.get(`/tickets/${id}`).then(unwrapOne)
export const createTicket = (data) => api.post('/tickets', data).then(unwrapOne)
export const updateTicket = (id, data) => api.put(`/tickets/${id}`, data).then(unwrapOne)
export const replyTicket = (id, data) => api.post(`/tickets/${id}/reply`, data).then(unwrapOne)
export const assignTicket = (id, data) => api.post(`/tickets/${id}/assign`, data).then(unwrapOne)
export const closeTicket = (id) => api.post(`/tickets/${id}/close`).then(unwrapOne)
export const escalateTicket = (id) => api.post(`/tickets/${id}/escalate`).then(unwrapOne)
export const getTicketStats = () => api.get('/tickets/stats').then(unwrapOne)

// ── Relationships & knowledge references (Release 4) ───────────────────────
export const linkTicketWorkOrder = (id, workOrderId) =>
  api.post(`/tickets/${id}/work-order`, { work_order_id: workOrderId }).then(unwrapOne)
export const unlinkTicketWorkOrder = (id) => api.post(`/tickets/${id}/unlink-work-order`).then(unwrapOne)
export const getTicketWorkOrder = (id) => api.get(`/tickets/${id}`).then(unwrapOne)
export const getTicketKnowledgeRefs = (id) => api.get(`/tickets/${id}/knowledge`).then(unwrapList)
export const addTicketKnowledgeRef = (id, data) => api.post(`/tickets/${id}/knowledge`, data).then(unwrapOne)
export const removeTicketKnowledgeRef = (id, refId) => api.delete(`/tickets/${id}/knowledge/${refId}`).then(unwrapOne)