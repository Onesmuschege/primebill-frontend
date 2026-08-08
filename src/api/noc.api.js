import api from './axiosInstance'

// NOC Overview
export const getNocOverview = () => api.get('/noc/overview')

// Devices
export const getNocDevices = (params) => api.get('/noc/devices', { params })
export const getNocDevice = (id) => api.get(`/noc/devices/${id}`)
export const getNocDeviceMetrics = (id, params) => api.get(`/noc/devices/${id}/metrics`, { params })

// Alerts
export const getNocAlerts = (params) => api.get('/noc/alerts', { params })
export const acknowledgeNocAlert = (id) => api.post(`/noc/alerts/${id}/acknowledge`)
export const resolveNocAlert = (id) => api.post(`/noc/alerts/${id}/resolve`)

// Links / Topology
export const getNocLinks = (params) => api.get('/noc/links', { params })
export const createNocLink = (data) => api.post('/noc/links', data)
export const updateNocLink = (id, data) => api.put(`/noc/links/${id}`, data)
export const deleteNocLink = (id) => api.delete(`/noc/links/${id}`)
