import api, { unwrapList, unwrapOne } from './axiosInstance'

/**
 * Network Command Center — operational workspace data (§18 master prompt).
 *
 * Maps to NetworkDashboardController behind `/api/network/*` and the
 * IncidentController behind `/api/incidents/*`.
 *
 *   GET  /network/dashboard            → overview KPIs
 *   GET  /network/routers              → router list with status
 *   GET  /network/routers/{id}         → router detail
 *   GET  /network/sessions             → live RADIUS sessions
 *   GET  /network/events               → network events log
 *   GET  /network/control-logs         → RADIUS control logs (CoA/Disconnect)
 *   GET  /network/radius-stats         → RADIUS authentication stats
 */

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

// ── Dashboard overview ─────────────────────────────────────────
export const getNetworkOverview = () =>
  api.get('/network/dashboard').then(unwrapOne)

// ── Routers ────────────────────────────────────────────────────
export const getNetworkRouters = (params = {}) =>
  api.get('/network/routers', { params: clean(params) }).then(unwrapList)
export const getNetworkRouter = (id) =>
  api.get(`/network/routers/${id}`).then(unwrapOne)

// ── Live sessions ──────────────────────────────────────────────
export const getNetworkSessions = (params = {}) =>
  api.get('/network/sessions', { params: clean(params) }).then(unwrapList)

// ── Network events ─────────────────────────────────────────────
export const getNetworkEvents = (params = {}) =>
  api.get('/network/events', { params: clean(params) }).then(unwrapList)

// ── RADIUS control logs ────────────────────────────────────────
export const getNetworkControlLogs = (params = {}) =>
  api.get('/network/control-logs', { params: clean(params) }).then(unwrapList)

// ── RADIUS stats ───────────────────────────────────────────────
export const getNetworkRadiusStats = () =>
  api.get('/network/radius-stats').then(unwrapOne)
