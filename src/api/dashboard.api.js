import api, { unwrapOne } from './axiosInstance'

export const getDashboardStats = () => api.get('/dashboard/stats').then(unwrapOne)
export const getTrafficData = (period) => api.get('/dashboard/traffic', { params: { period } }).then(unwrapOne)
// limit is the widget's render budget (see DASHBOARD_LIMITS) — the backend
// validates 1–50 and applies it server-side. This is a leaderboard of live
// radius sessions, so the response is a plain array with no grand total.
export const getTopDownloaders = (limit) => api.get('/dashboard/top-downloaders', { params: { limit } }).then(unwrapOne)
export const getIncomeAnalytics = (params) => api.get('/analytics/income', { params }).then(unwrapOne)
export const getDashboardAnalytics = () => api.get('/dashboard/analytics').then(unwrapOne)
export const getExpenditureSummary = () => api.get('/dashboard/expenditure-summary').then(unwrapOne)
export const getInvoiceAging = () => api.get('/dashboard/invoice-aging').then(unwrapOne)
export const getChurnAnalysis = () => api.get('/dashboard/churn-analysis').then(unwrapOne)
