import api from './axiosInstance'

export const getPayments = (params) => api.get('/payments', { params })
export const getPayment = (id) => api.get(`/payments/${id}`)
export const createPayment = (data) => api.post('/payments', data)
export const deletePayment = (id) => api.delete(`/payments/${id}`)
export const getPaymentSummary = () => api.get('/payments/summary')
export const stkPush = (data) => api.post('/mpesa/stk-push', data)