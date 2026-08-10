import api from './axiosInstance'

// Referral programme — current user's referral code, applying a referred-by
// code, and referral performance stats.
//
// Backend: ReferralController under Route::prefix('referral') (singular path,
// matching routes/api.php), NOT /referrals.
const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

export const getReferralCode = (params = {}) =>
  api.get('/referral/code', { params: clean(params) })

export const joinReferral = (data) =>
  api.post('/referral/join', data)

export const getReferralStats = (params = {}) =>
  api.get('/referral/stats', { params: clean(params) })
