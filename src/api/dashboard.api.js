import api from './axiosInstance'

export const getDashboardStats = () => api.get('/dashboard/stats')
export const getTrafficData = (period) => api.get('/dashboard/traffic', { params: { period } })
export const getTopDownloaders = () => api.get('/dashboard/top-downloaders')
export const getIncomeAnalytics = (params) => api.get('/analytics/income', { params })