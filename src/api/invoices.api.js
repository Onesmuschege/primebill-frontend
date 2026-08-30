import api, { unwrapList, unwrapOne } from './axiosInstance'

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

export const getInvoices   = (params) => api.get('/invoices', { params: clean(params) }).then(unwrapList)
export const getInvoice    = (id)     => api.get(`/invoices/${id}`).then(unwrapOne)
export const createInvoice = (data)   => api.post('/invoices', data).then(unwrapOne)
export const updateInvoice = (id, data) => api.put(`/invoices/${id}`, data).then(unwrapOne)
export const deleteInvoice = (id)     => api.delete(`/invoices/${id}`).then(unwrapOne)
export const bulkGenerateInvoices = (data) => api.post('/invoices/bulk-generate', data).then(unwrapOne)
export const downloadInvoicePdf = (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' })