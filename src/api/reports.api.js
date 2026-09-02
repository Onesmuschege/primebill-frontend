import api, { unwrapOne } from './axiosInstance'

// Reports — generated report endpoint. Each report returns an object
// (daily/monthly series, totals, by-method breakdowns), so unwrapOne returns
// the report payload directly. The CSV export stays a raw blob response.

export const getReportData = (type, params) =>
  api.get(`/reports/${type}`, { params }).then(unwrapOne)

export const exportReport = (type, params) =>
  api.get(`/reports/${type}/export`, { params, responseType: 'blob' })

export default api