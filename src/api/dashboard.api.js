import api from './axiosInstance'

export const getDashboardStats = () => api.get('/dashboard/stats')
export const getTrafficData = (period) => api.get('/dashboard/traffic', { params: { period } })
// limit is the widget's render budget (see DASHBOARD_LIMITS) — the backend
// validates 1–50 and applies it server-side. This is a leaderboard of live
// radius sessions, so the response is a plain array with no grand total.
export const getTopDownloaders = (limit) => api.get('/dashboard/top-downloaders', { params: { limit } })
export const getIncomeAnalytics = (params) => api.get('/analytics/income', { params })
export const getDashboardAnalytics = () => api.get('/dashboard/analytics')
export const getExpenditureSummary = () => api.get('/dashboard/expenditure-summary')
export const getInvoiceAging = () => api.get('/dashboard/invoice-aging')
export const getChurnAnalysis = () => api.get('/dashboard/churn-analysis')
