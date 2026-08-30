import api, { unwrapList, unwrapOne } from './axiosInstance'

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

export const getFupLogs = (params) => api.get('/fup/logs', { params: clean(params) }).then(unwrapList)
export const getFupStatus = (accountId) => api.get(`/fup/status/${accountId}`).then(unwrapOne)
export const resetFupLog = (accountId) =>
  api.post(`/fup/reset/${accountId}`).then((res) => ({
    result: unwrapOne(res),
    message: res.data?.message,
  }))
export const getFupStats = () => api.get('/fup/stats').then(unwrapOne)
