import api, { unwrapList, unwrapOne } from './axiosInstance'

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== '' && v !== null && v !== undefined
    )
  )

// Client loyalty
export const getClientLoyalty = (clientId) =>
  api.get(`/loyalty/points/${clientId}`).then(unwrapOne)

// Alias (optional, keeps older code working)
export const getLoyaltyPoints = getClientLoyalty

// Leaderboard
export const getLoyaltyLeaders = () =>
  api.get('/loyalty/leaderboard').then(unwrapOne)

// Transactions
export const getLoyaltyTransactions = (params) =>
  api.get('/loyalty/transactions', {
    params: clean(params),
  }).then(unwrapList)

// Redeem
export const redeemLoyaltyPoints = (data) =>
  api.post('/loyalty/redeem', data).then(unwrapOne)

// Referral
export const getReferralCode = () =>
  api.get('/referral/code').then(unwrapOne)

export const joinReferral = (data) =>
  api.post('/referral/join', data).then(unwrapOne)

export const getReferralStats = () =>
  api.get('/referral/stats').then(unwrapOne)

// Admin adjustment of a client's loyalty balance (negative = deduct)
export const adjustPoints = (clientId, data) =>
  api.post(`/loyalty/${clientId}/adjust`, data).then(unwrapOne)