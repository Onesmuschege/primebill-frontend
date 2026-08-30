import api, { unwrapList, unwrapOne } from './axiosInstance'

// NOC Overview
export const getNocOverview = () => api.get('/noc/overview').then(unwrapOne)

// Devices
export const getNocDevices       = (params) => api.get('/noc/devices', { params }).then(unwrapList)
export const getNocDevice        = (id)     => api.get(`/noc/devices/${id}`).then(unwrapOne)
export const getNocDeviceMetrics = (id, params) => api.get(`/noc/devices/${id}/metrics`, { params }).then(unwrapList)

// Alerts
export const getNocAlerts       = (params) => api.get('/noc/alerts', { params }).then(unwrapList)
export const acknowledgeNocAlert = (id)    => api.post(`/noc/alerts/${id}/acknowledge`).then(unwrapOne)
export const resolveNocAlert     = (id)    => api.post(`/noc/alerts/${id}/resolve`).then(unwrapOne)

// Links / Topology
export const getNocLinks   = (params) => api.get('/noc/links', { params }).then(unwrapList)
export const createNocLink = (data)   => api.post('/noc/links', data).then(unwrapOne)
export const updateNocLink = (id, data) => api.put(`/noc/links/${id}`, data).then(unwrapOne)
export const deleteNocLink = (id)     => api.delete(`/noc/links/${id}`).then(unwrapOne)
