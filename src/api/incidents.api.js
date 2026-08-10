import api from './axiosInstance'

// Network incidents / outages — CRUD + lifecycle (acknowledge/resolve/close/status).
// `this->success($incidents)` wraps a Laravel paginator, so rows live under
// `response.data.data.data` and pagination under `response.data.data.meta`.

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

export const getIncidents = (params = {}) => api.get('/incidents', { params: clean(params) })
export const getIncident = (id) => api.get(`/incidents/${id}`)
export const createIncident = (data) => api.post('/incidents', data)
export const updateIncident = (id, data) => api.put(`/incidents/${id}`, data)
export const deleteIncident = (id) => api.delete(`/incidents/${id}`)
export const getIncidentStats = () => api.get('/incidents/stats')
export const acknowledgeIncident = (id) => api.post(`/incidents/${id}/acknowledge`)
export const resolveIncident = (id, data) => api.post(`/incidents/${id}/resolve`, data)
export const closeIncident = (id) => api.post(`/incidents/${id}/close`)
export const updateIncidentStatus = (id, status) => api.post(`/incidents/${id}/status`, { status })