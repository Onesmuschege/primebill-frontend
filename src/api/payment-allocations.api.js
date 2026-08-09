import api, { unwrapList } from './axiosInstance'

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

export const getPaymentAllocations = async (params) => {
  const response = await api.get('/payment-allocations', { params: clean(params) })
  return unwrapList(response) // returns { data: [], meta: {} }
}

export const getPaymentAllocation = (id) => api.get(`/payment-allocations/${id}`)
export const createPaymentAllocation = (data) => api.post('/payment-allocations', data)
export const reversePaymentAllocation = (id, data = {}) =>
  api.post(`/payment-allocations/${id}/reverse`, data)
