import api from './axiosInstance'

// RADIUS settings are managed under /settings/radius (RadiusSettingsController)
export const getRadiusSettings = () => api.get('/settings/radius')
export const testRadiusConnection = () => api.post('/settings/radius/test')

// RADIUS sessions & sync
export const getRadiusSessions = (params) => api.get('/radius/sessions', { params })
export const getRadiusStats = () => api.get('/radius/stats')
export const syncRadius = () => api.post('/radius/sync')
