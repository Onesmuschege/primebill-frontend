import api, { unwrapList, unwrapOne } from './axiosInstance'

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

export const getPaymentAllocations = async (params) => {
  const response = await api.get('/payment-allocations', { params: clean(params) })
  return unwrapList(response) // returns { data: [], meta: {} }
}

export const getPaymentAllocation = (id) => api.get(`/payment-allocations/${id}`).then(unwrapOne)
// Mutations preserve the backend's human-readable `message` alongside the
// unwrapped resource — toasts surface it directly.
export const createPaymentAllocation = (data) =>
  api.post('/payment-allocations', data).then((res) => ({
    result: unwrapOne(res),
    message: res.data?.message,
  }))
export const reversePaymentAllocation = (id, data = {}) =>
  api.post(`/payment-allocations/${id}/reverse`, data).then((res) => ({
    result: unwrapOne(res),
    message: res.data?.message,
  }))
