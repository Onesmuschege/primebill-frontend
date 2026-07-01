import api from './axiosInstance'

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

export const getLoyaltyPoints = (clientId) => api.get(`/loyalty/points/${clientId}`)
export const redeemLoyaltyPoints = (data) => api.post('/loyalty/redeem', data)
export const getLoyaltyTransactions = (params) => api.get('/loyalty/transactions', { params: clean(params) })

export const getReferralCode = () => api.get('/referrals/code')
export const joinReferral = (data) => api.post('/referrals/join', data)
export const getReferralStats = () => api.get('/referrals/stats')
