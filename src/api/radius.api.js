import api from './axiosInstance'

export const getRadiusSettings = () => api.get('/radius-settings')
export const testRadiusConnection = () => api.post('/radius-settings/test')
