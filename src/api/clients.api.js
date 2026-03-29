import api from './axiosInstance'

export const getClients = (params) => api.get('/clients', { params })
export const getClient = (id) => api.get(`/clients/${id}`)
export const createClient = (data) => api.post('/clients', data)
export const updateClient = (id, data) => api.put(`/clients/${id}`, data)
export const deleteClient = (id) => api.delete(`/clients/${id}`)
export const suspendClient = (id) => api.post(`/clients/${id}/suspend`)
export const activateClient = (id) => api.post(`/clients/${id}/activate`)
export const getClientAccounts = (id) => api.get(`/clients/${id}/accounts`)
export const getClientInvoices = (id) => api.get(`/clients/${id}/invoices`)
export const getClientPayments = (id) => api.get(`/clients/${id}/payments`)
export const getClientTickets = (id) => api.get(`/clients/${id}/tickets`)
export const createClientAccount = (clientId, data) => api.post(`/clients/${clientId}/accounts`, data)