import api, { unwrapList } from './axiosInstance'

export const getPlans  = (params) => api.get('/plans', { params }).then(unwrapList)
export const getPlan   = (id)     => api.get(`/plans/${id}`).then(r => r.data)
export const createPlan = (data)  => api.post('/plans', data).then(r => r.data)
export const updatePlan = (id, data) => api.put(`/plans/${id}`, data).then(r => r.data)
export const deletePlan = (id)    => api.delete(`/plans/${id}`).then(r => r.data)