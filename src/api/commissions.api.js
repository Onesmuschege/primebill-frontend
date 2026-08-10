import api from './axiosInstance'

// Sales commissions — list, summary, and approve/pay lifecycle.
//
// Backend: CommissionController under Route::prefix('commissions').
// Note: there is NO GET /commissions/{id} on the backend, so no `show` helper.
const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

export const getCommissions = (params = {}) =>
  api.get('/commissions', { params: clean(params) })

export const getCommissionSummary = () =>
  api.get('/commissions/summary')

export const approveCommission = (id) =>
  api.post(`/commissions/${id}/approve`)

export const payCommission = (id, data = {}) =>
  api.post(`/commissions/${id}/pay`, data)
