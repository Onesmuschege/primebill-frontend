import api, { unwrapList } from './axiosInstance'

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

// ---------------------------------------------------------------------------
// Wallets
// ---------------------------------------------------------------------------
export const getWalletBalance = (clientId) =>
  api.get('/finance/wallet/balance', { params: clean({ client_id: clientId }) })

export const getWalletTransactions = (clientId, limit = 50) =>
  api.get('/finance/wallet/transactions', { params: clean({ client_id: clientId, limit }) })

export const walletDeposit = (data) => api.post('/finance/wallet/deposit', data)
export const walletWithdraw = (data) => api.post('/finance/wallet/withdraw', data)

// ---------------------------------------------------------------------------
// Credit Notes
// ---------------------------------------------------------------------------
export const getCreditNotes = async (params) => {
  const response = await api.get('/finance/credit-notes', { params: clean(params) })
  return unwrapList(response)
}
export const createCreditNote = (data) => api.post('/finance/credit-notes', data)
export const reverseCreditNote = (id, data = {}) =>
  api.post(`/finance/credit-notes/${id}/reverse`, data)

// ---------------------------------------------------------------------------
// Debit Notes
// ---------------------------------------------------------------------------
export const getDebitNotes = async (params) => {
  const response = await api.get('/finance/debit-notes', { params: clean(params) })
  return unwrapList(response)
}
export const createDebitNote = (data) => api.post('/finance/debit-notes', data)
export const reverseDebitNote = (id, data = {}) =>
  api.post(`/finance/debit-notes/${id}/reverse`, data)

// ---------------------------------------------------------------------------
// Refunds
// ---------------------------------------------------------------------------
export const getRefunds = async (params) => {
  const response = await api.get('/finance/refunds', { params: clean(params) })
  return unwrapList(response)
}
export const createRefund = (data) => api.post('/finance/refunds', data)
export const reverseRefund = (id, data = {}) =>
  api.post(`/finance/refunds/${id}/reverse`, data)

// ---------------------------------------------------------------------------
// Payment Plans
// ---------------------------------------------------------------------------
export const getPaymentPlans = async (params) => {
  const response = await api.get('/finance/payment-plans', { params: clean(params) })
  return unwrapList(response)
}
export const createPaymentPlan = (data) => api.post('/finance/payment-plans', data)
export const recordInstallmentPayment = (installmentId, data) =>
  api.post(`/finance/installments/${installmentId}/pay`, data)

// ---------------------------------------------------------------------------
// Financial Statements
// ---------------------------------------------------------------------------
export const getTrialBalance = (params) =>
  api.get('/finance/statement/trial-balance', { params: clean(params) })
export const getRevenueRecognition = (params) =>
  api.get('/finance/statement/revenue', { params: clean(params) })
export const verifyLedger = () => api.get('/finance/statement/verify-ledger')

// ---------------------------------------------------------------------------
// Usage Billing
// ---------------------------------------------------------------------------
export const computeUsage = (params) =>
  api.get('/finance/usage/compute', { params: clean(params) })
export const recordUsage = (data) => api.post('/finance/usage/record', data)

