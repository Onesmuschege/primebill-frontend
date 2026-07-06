import api from './axiosInstance'

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== '' && v !== null && v !== undefined
    )
  )

// Client loyalty
export const getClientLoyalty = (clientId) =>
  api.get(`/loyalty/points/${clientId}`)

// Alias (optional, keeps older code working)
export const getLoyaltyPoints = getClientLoyalty

// Leaderboard
export const getLoyaltyLeaders = () =>
  api.get('/loyalty/leaderboard')

// Transactions
export const getLoyaltyTransactions = (params) =>
  api.get('/loyalty/transactions', {
    params: clean(params),
  })

// Redeem
export const redeemLoyaltyPoints = (data) =>
  api.post('/loyalty/redeem', data)

// Referral
export const getReferralCode = () =>
  api.get('/referral/code')

export const joinReferral = (data) =>
  api.post('/referral/join', data)

export const getReferralStats = () =>
  api.get('/referral/stats')

// Temporary until backend endpoint exists
export const adjustPoints = () =>
  Promise.reject(
    new Error('Adjust Points endpoint has not been implemented on the backend.')
  )