import api, { unwrapList } from './axiosInstance'

export const getPlans  = (params) => api.get('/plans', { params }).then(unwrapList)
export const getPlan   = (id)     => api.get(`/plans/${id}`).then(r => r.data)
export const createPlan = (data)  => api.post('/plans', data).then(r => r.data)
export const updatePlan = (id, data) => api.put(`/plans/${id}`, data).then(r => r.data)
export const deletePlan = (id)    => api.delete(`/plans/${id}`).then(r => r.data)

export const duplicatePlan    = (id)    => api.post(`/plans/${id}/duplicate`).then(r => r.data)
export const toggleActivePlan = (id)    => api.post(`/plans/${id}/toggle-active`).then(r => r.data)
export const pushPlanToRouter = (id)    => api.post(`/plans/${id}/push-to-router`).then(r => r.data)
export const bulkUpdatePlans  = (ids, data) => api.post('/plans/bulk/update', { ids, ...data }).then(r => r.data)
export const getPlanTemplates = () => api.get('/plan-templates').then(unwrapList)
