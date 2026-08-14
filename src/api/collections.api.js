import api from './axiosInstance'

/**
 * Collections & Dunning — REST surface for the dunning/collections domain.
 *
 * Backed by the backend /api/collections/* routes (CollectionsController).
 * Reads need the `view collections` permission; every mutation needs
 * `manage dunning`. The backend remains the authority — these client calls
 * only mirror those Spatie permissions for UX gating.
 */

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

// ── Aging dashboard ──────────────────────────────────────────────
export const getAging = () => api.get('/collections/aging')

// ── Dunning step ladder (escalation config) ──────────────────────
export const getDunningSteps = (params = {}) =>
  api.get('/collections/dunning-steps', { params: clean(params) })
export const getDunningStep = (id) => api.get(`/collections/dunning-steps/${id}`)
export const createDunningStep = (data) => api.post('/collections/dunning-steps', data)
export const updateDunningStep = (id, data) => api.put(`/collections/dunning-steps/${id}`, data)
export const deleteDunningStep = (id) => api.delete(`/collections/dunning-steps/${id}`)
export const reorderDunningSteps = (steps) => api.post('/collections/dunning-steps/reorder', { steps })

// ── Dunning execution ────────────────────────────────────────────
export const runDunningNow = (limit = 200) => api.post('/collections/run', { limit })

// ── Dunning runs (history / audit) ───────────────────────────────
export const getDunningRuns = (params = {}) =>
  api.get('/collections/dunning-runs', { params: clean(params) })
export const getClientDunningRuns = (clientId) =>
  api.get(`/collections/clients/${clientId}/dunning-runs`)
export const getInvoiceDunningRuns = (invoiceId) =>
  api.get(`/collections/invoices/${invoiceId}/dunning-runs`)