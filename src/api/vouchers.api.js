import api from './axiosInstance'

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

export const getVouchers = (params) => api.get('/vouchers', { params: clean(params) })
export const getVoucher = (id) => api.get(`/vouchers/${id}`)
export const bulkGenerateVouchers = (data) => api.post('/vouchers/bulk-generate', data)
export const deleteVoucher = (id) => api.delete(`/vouchers/${id}`)
export const getVoucherStats = () => api.get('/vouchers/stats')

// Portal: check and redeem
export const checkVoucher = (code) => api.get(`/portal/vouchers/check/${code}`)
export const redeemVoucher = (data) => api.post('/portal/vouchers/redeem', data)
