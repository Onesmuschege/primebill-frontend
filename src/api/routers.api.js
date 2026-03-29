import api from './axiosInstance'

export const getRouters = () => api.get('/routers')
export const getRouter = (id) => api.get(`/routers/${id}`)
export const createRouter = (data) => api.post('/routers', data)
export const updateRouter = (id, data) => api.put(`/routers/${id}`, data)
export const deleteRouter = (id) => api.delete(`/routers/${id}`)
export const testRouterConnection = (id) => api.post(`/routers/${id}/test-connection`)
export const getRouterResources = (id) => api.get(`/routers/${id}/resources`)
export const getRouterSessions = (id) => api.get(`/routers/${id}/sessions`)