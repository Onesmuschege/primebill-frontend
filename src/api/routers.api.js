import api, { unwrapList, unwrapOne } from './axiosInstance'

export const getRouters         = (params) => api.get('/routers', { params }).then(unwrapList)
export const getRouter          = (id)     => api.get(`/routers/${id}`).then(unwrapOne)
export const createRouter       = (data)   => api.post('/routers', data).then(unwrapOne)
export const updateRouter       = (id, data) => api.put(`/routers/${id}`, data).then(unwrapOne)
export const deleteRouter       = (id)     => api.delete(`/routers/${id}`).then(unwrapOne)
export const testRouterConnection = (id)   => api.post(`/routers/${id}/test-connection`).then(unwrapOne)
export const getRouterResources = (id)     => api.get(`/routers/${id}/resources`).then(unwrapOne)
export const getRouterSessions  = (id)     => api.get(`/routers/${id}/sessions`).then(unwrapList)
// Live health probe (RouterHealthService §44) — reachability + sync state.
export const getRouterHealth     = (id)    => api.get(`/routers/${id}/health`).then(unwrapOne)
export const getRouterHealthAll  = ()      => api.get('/routers/health').then(unwrapOne)