import api from './axiosInstance'

const clean = (p = {}) =>
  Object.fromEntries(Object.entries(p).filter(([, v]) => v !== '' && v != null))

// GET /api/vouchers — paginated list with optional status/plan_id/batch filters
export const getVouchers = (params) => api.get('/vouchers', { params: clean(params) })

// GET /api/vouchers/stats — real backend aggregation, returns {total,unused,redeemed,expired}
export const getVoucherStats = () => api.get('/vouchers/stats')

// GET /api/vouchers/batches — per-batch breakdown for the batch summary cards
export const getVoucherBatches = () => api.get('/vouchers/batches')

// POST /api/vouchers/generate — maps form fields to controller param names
export const bulkGenerateVouchers = (data) => api.post('/vouchers/generate', {
  plan_id:     data.plan_id,
  quantity:    data.quantity,
  valid_days:  data.expiry_days || undefined,  // form calls it expiry_days, controller expects valid_days
  batch_label: data.batch_label || undefined,
})

// DELETE /api/vouchers/{id}
export const deleteVoucher = (id) => api.delete(`/vouchers/${id}`)

// POST /portal/captive/redeem — public, no auth required
export const redeemVoucher = (data) => api.post('/portal/captive/redeem', data)