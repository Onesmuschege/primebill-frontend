import api, { unwrapList, unwrapOne } from './axiosInstance'

/**
 * System Logs — audit trail access for the notification center.
 * Maps to LogController behind `/api/logs/*`.
 */

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

export const getSystemLogs = (params = {}) =>
  api.get('/logs', { params: clean(params) }).then(unwrapList)

export const getSystemLog = (id) =>
  api.get(`/logs/${id}`).then(unwrapOne)

export const getSystemLogStats = () =>
  api.get('/logs/stats').then(unwrapOne)

export const exportSystemLogs = (params = {}) =>
  api.get('/logs/export', { params: clean(params), responseType: 'blob' })
