import api from './axiosInstance'

export const getInvoices = (params) => api.get('/invoices', { params })
export const getInvoice = (id) => api.get(`/invoices/${id}`)
export const createInvoice = (data) => api.post('/invoices', data)
export const updateInvoice = (id, data) => api.put(`/invoices/${id}`, data)
export const deleteInvoice = (id) => api.delete(`/invoices/${id}`)
export const bulkGenerateInvoices = (data) => api.post('/invoices/bulk-generate', data)