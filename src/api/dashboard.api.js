import api from './axiosInstance'

export const getDashboardStats = () => api.get('/dashboard/stats')
export const getTrafficData = (period) => api.get('/dashboard/traffic', { params: { period } })
export const getTopDownloaders = () => api.get('/dashboard/top-downloaders')
export const getIncomeAnalytics = (params) => api.get('/analytics/income', { params })
export const getDashboardAnalytics = () => api.get('/dashboard/analytics')
export const getExpenditureSummary = () => api.get('/dashboard/expenditure-summary')
export const getInvoiceAging = () => api.get('/dashboard/invoice-aging')
export const getChurnAnalysis = () => api.get('/dashboard/churn-analysis')
