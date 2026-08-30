import api, { unwrapList, unwrapOne } from './axiosInstance'

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

export const getPayments = async (params) => {
  const response = await api.get('/payments', { params: clean(params) })
  return unwrapList(response)          // returns { data: [], meta: {} }
}

export const getPayment = (id) => api.get(`/payments/${id}`).then(unwrapOne)
export const createPayment = (data) => api.post('/payments', data).then(unwrapOne)
export const deletePayment = (id) => api.delete(`/payments/${id}`).then(unwrapOne)
export const getPaymentSummary = () => api.get('/payments/summary').then(unwrapOne)
export const stkPush = (data) => api.post('/mpesa/stk-push', data).then(unwrapOne)