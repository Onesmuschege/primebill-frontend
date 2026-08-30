import api, { unwrapList, unwrapOne } from './axiosInstance'

// ── OLTs ───────────────────────────────────────────────────────────────────
export const getOlts = (params) => api.get('/olts', { params }).then(unwrapList)
export const getOlt = (id) => api.get(`/olts/${id}`).then(unwrapOne)
export const createOlt = (data) => api.post('/olts', data).then(unwrapOne)
export const updateOlt = (id, data) => api.put(`/olts/${id}`, data).then(unwrapOne)
export const deleteOlt = (id) => api.delete(`/olts/${id}`).then(unwrapOne)
export const testOltConnection = (id) => api.post(`/olts/${id}/test-connection`).then(unwrapOne)

// ── PON Ports ─────────────────────────────────────────────────────────────
export const getPonPorts = (oltId, params) => api.get(`/olts/${oltId}/pon-ports`, { params }).then(unwrapList)
export const createPonPort = (oltId, data) => api.post(`/olts/${oltId}/pon-ports`, data).then(unwrapOne)

// ── ONTs ──────────────────────────────────────────────────────────────────
export const getOltsOnts = (oltId, params) => api.get(`/olts/${oltId}/onts`, { params }).then(unwrapList)
export const createOnt = (oltId, data) => api.post(`/olts/${oltId}/onts`, data).then(unwrapOne)
export const getOnt = (id) => api.get(`/onts/${id}`).then(unwrapOne)
export const updateOnt = (id, data) => api.put(`/onts/${id}`, data).then(unwrapOne)
export const deleteOnt = (oltId, id) => api.delete(`/olts/${oltId}/onts/${id}`).then(unwrapOne)
export const pollOntSignal = (oltId) => api.post(`/olts/${oltId}/poll-signal`).then(unwrapOne)

// ── Fiber Infrastructure ──────────────────────────────────────────────────
export const getFiberRoutes = (params) => api.get('/fiber/routes', { params }).then(unwrapList)
export const createFiberRoute = (data) => api.post('/fiber/routes', data).then(unwrapOne)
export const updateFiberRoute = (id, data) => api.put(`/fiber/routes/${id}`, data).then(unwrapOne)
export const deleteFiberRoute = (id) => api.delete(`/fiber/routes/${id}`).then(unwrapOne)

export const getFiberSplitters = (params) => api.get('/fiber/splitters', { params }).then(unwrapList)
export const createFiberSplitter = (data) => api.post('/fiber/splitters', data).then(unwrapOne)
export const deleteFiberSplitter = (id) => api.delete(`/fiber/splitters/${id}`).then(unwrapOne)

export const getFiberCabinets = (params) => api.get('/fiber/cabinets', { params }).then(unwrapList)
export const createFiberCabinet = (data) => api.post('/fiber/cabinets', data).then(unwrapOne)
export const deleteFiberCabinet = (id) => api.delete(`/fiber/cabinets/${id}`).then(unwrapOne)

export const getDistributionPoints = (params) => api.get('/fiber/distribution-points', { params }).then(unwrapList)
export const createDistributionPoint = (data) => api.post('/fiber/distribution-points', data).then(unwrapOne)
export const deleteDistributionPoint = (id) => api.delete(`/fiber/distribution-points/${id}`).then(unwrapOne)

// ── Fiber Capacity Analytics (Release 4) ─────────────────────────────────────
export const getFiberCapacity = (params) => api.get('/fiber/capacity', { params }).then(unwrapOne)
