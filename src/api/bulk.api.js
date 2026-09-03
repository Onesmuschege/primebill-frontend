import api from './axiosInstance'

/**
 * Bulk Operations — batch mutations for client services (§16 master prompt).
 *
 * Maps to BulkServiceController behind `/api/network/services/bulk/*`.
 * Every operation is per-record isolated: one failure never stops the
 * remaining records. The backend returns authoritative per-record results.
 *
 * All endpoints accept: { account_ids: number[], reason?: string }
 * Response: { success, operation, requested, succeeded, failed, results[] }
 */

const unwrap = (p) => p.then((r) => r.data?.data ?? r.data)

export const bulkSuspend = (data) =>
  unwrap(api.post('/network/services/bulk/suspend', data))

export const bulkRestore = (data) =>
  unwrap(api.post('/network/services/bulk/restore', data))

export const bulkActivate = (data) =>
  unwrap(api.post('/network/services/bulk/activate', data))

export const bulkPlanChange = (data) =>
  unwrap(api.post('/network/services/bulk/plan-change', data))

export const bulkRetryProvisioning = (data) =>
  unwrap(api.post('/network/services/bulk/retry-provisioning', data))
