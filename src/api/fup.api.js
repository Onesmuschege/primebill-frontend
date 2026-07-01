import api from './axiosInstance'

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

export const getFupLogs = (params) => api.get('/fup/logs', { params: clean(params) })
export const getFupStatus = (accountId) => api.get(`/fup/status/${accountId}`)
export const resetFupLog = (accountId) => api.post(`/fup/reset/${accountId}`)
export const getFupStats = () => api.get('/fup/stats')
