import api from './axiosInstance'

// Network incidents / outages — CRUD + lifecycle (acknowledge/resolve/close/status).
// `this->success($paginator)` wraps a Laravel paginator, so rows live under
// response.data.data — unwrapped here via the standard pattern.

const unwrapList = (p) => p.then((r) => {
  const body = r.data?.data ?? r.data
  return { data: body?.data ?? [], meta: body?.meta ?? body ?? {} }
})
const unwrapOne = (p) => p.then((r) => r.data?.data ?? r.data)

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

export const getIncidents = (params = {}) => unwrapList(api.get('/incidents', { params: clean(params) }))
export const getIncident = (id) => unwrapOne(api.get(`/incidents/${id}`))
export const createIncident = (data) => unwrapOne(api.post('/incidents', data))
export const updateIncident = (id, data) => unwrapOne(api.put(`/incidents/${id}`, data))
export const deleteIncident = (id) => unwrapOne(api.delete(`/incidents/${id}`))
export const getIncidentStats = () => unwrapOne(api.get('/incidents/stats'))
export const acknowledgeIncident = (id) => unwrapOne(api.post(`/incidents/${id}/acknowledge`))
export const resolveIncident = (id, data) => unwrapOne(api.post(`/incidents/${id}/resolve`, data))
export const closeIncident = (id) => unwrapOne(api.post(`/incidents/${id}/close`))
export const updateIncidentStatus = (id, status) => unwrapOne(api.post(`/incidents/${id}/status`, { status }))
export const escalateIncident = (id, data) => unwrapOne(api.post(`/incidents/${id}/escalate`, data))
