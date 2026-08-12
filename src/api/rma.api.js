import api from './axiosInstance'

// RMA (Returns / Replacements / Repairs)
export const getRmas = (params) => api.get('/rma', { params })
export const getRma = (id) => api.get(`/rma/${id}`)
export const createRma = (data) => api.post('/rma', data)
export const updateRma = (id, data) => api.put(`/rma/${id}`, data)
export const deleteRma = (id) => api.delete(`/rma/${id}`)
export const getRmaStats = () => api.get('/rma/stats')

// Lifecycle actions
export const approveRma = (id, data) => api.post(`/rma/${id}/approve`, data)
export const rejectRma = (id, data) => api.post(`/rma/${id}/reject`, data)
export const processRma = (id, data) => api.post(`/rma/${id}/process`, data)
export const completeRma = (id, data) => api.post(`/rma/${id}/complete`, data)
export const cancelRma = (id, data) => api.post(`/rma/${id}/cancel`, data)