import api, { unwrapOne } from './axiosInstance'

// Service Network Operations — the core ISP provisioning/enforcement workflow.
// Maps to ServiceNetworkController behind the `/api/network/*` route group
// (registered under `permission:view network`, mutations under the same prefix).
//
//   GET  /network/services/{account}/status      → network entitlement + sessions
//   POST /network/services/{account}/suspend     → { reason }
//   POST /network/services/{account}/restore     → { reason }
//   POST /network/services/{account}/disconnect  → { session_id? }
//   POST /network/services/{account}/coa         → { download_speed?, upload_speed?, session_timeout?, idle_timeout? }
//
// All fns unwrap the `{data: …}` envelope → callers receive the payload
// (status payload, or the authoritative post-mutation state object).

export const getServiceNetworkStatus = (accountId) =>
  api.get(`/network/services/${accountId}/status`).then(unwrapOne)

export const suspendService = (accountId, data = {}) =>
  api.post(`/network/services/${accountId}/suspend`, data).then(unwrapOne)

export const restoreService = (accountId, data = {}) =>
  api.post(`/network/services/${accountId}/restore`, data).then(unwrapOne)

export const disconnectService = (accountId, data = {}) =>
  api.post(`/network/services/${accountId}/disconnect`, data).then(unwrapOne)

export const sendServiceCoA = (accountId, data = {}) =>
  api.post(`/network/services/${accountId}/coa`, data).then(unwrapOne)

