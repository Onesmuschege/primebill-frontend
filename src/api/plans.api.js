import api, { unwrapList } from './axiosInstance'

export const getPlans  = (params) => api.get('/plans', { params }).then(unwrapList)
export const getPlan   = (id)     => api.get(`/plans/${id}`).then(r => r.data)
export const createPlan = (data)  => api.post('/plans', data).then(r => r.data)
export const updatePlan = (id, data) => api.put(`/plans/${id}`, data).then(r => r.data)
export const deletePlan = (id)    => api.delete(`/plans/${id}`).then(r => r.data)

// ─── Batch + quick-action endpoints ─────────────────────────────────────────
// NOTE: These endpoints are NOT yet implemented on the backend (Phase 2 —
// Service Management). They are kept as stubs that reject clearly so the
// UI can show a friendly message instead of a silent 404.
export const bulkUpdatePlans   = () => Promise.reject(new Error('Bulk plan update is not available yet.'))
export const duplicatePlan     = () => Promise.reject(new Error('Plan duplication is not available yet.'))
export const toggleActivePlan  = () => Promise.reject(new Error('Toggle plan active is not available yet.'))
export const pushPlanToRouter  = () => Promise.reject(new Error('Push plan to router is not available yet.'))
export const getPlanTemplates  = () => api.get('/plan-templates').then(unwrapList)
