import api from './axiosInstance'

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

export const getTickets = (params) => api.get('/tickets', { params: clean(params) })
export const getTicket = (id) => api.get(`/tickets/${id}`)
export const createTicket = (data) => api.post('/tickets', data)
export const updateTicket = (id, data) => api.put(`/tickets/${id}`, data)
export const replyTicket = (id, data) => api.post(`/tickets/${id}/reply`, data)
export const assignTicket = (id, data) => api.post(`/tickets/${id}/assign`, data)
export const closeTicket = (id) => api.post(`/tickets/${id}/close`)
export const escalateTicket = (id) => api.post(`/tickets/${id}/escalate`)
export const getTicketStats = () => api.get('/tickets/stats')