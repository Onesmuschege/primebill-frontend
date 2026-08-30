import api, { unwrapList, unwrapOne } from './axiosInstance'

export const getPlans  = (params) => api.get('/plans', { params }).then(unwrapList)
export const getPlan   = (id)     => api.get(`/plans/${id}`).then(unwrapOne)
export const createPlan = (data)  => api.post('/plans', data).then(unwrapOne)
export const updatePlan = (id, data) => api.put(`/plans/${id}`, data).then(unwrapOne)
export const deletePlan = (id)    => api.delete(`/plans/${id}`).then(unwrapOne)

export const duplicatePlan    = (id)    => api.post(`/plans/${id}/duplicate`).then(unwrapOne)
export const toggleActivePlan = (id)    => api.post(`/plans/${id}/toggle-active`).then(unwrapOne)
export const pushPlanToRouter = (id)    => api.post(`/plans/${id}/push-to-router`).then(unwrapOne)
export const bulkUpdatePlans  = (ids, data) => api.post('/plans/bulk/update', { ids, ...data }).then(unwrapOne)
export const getPlanTemplates = () => api.get('/plan-templates').then(unwrapList)
