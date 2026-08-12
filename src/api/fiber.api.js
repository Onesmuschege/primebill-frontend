import api from './axiosInstance'

// ── OLTs ───────────────────────────────────────────────────────────────────
export const getOlts = (params) => api.get('/olts', { params })
export const getOlt = (id) => api.get(`/olts/${id}`)
export const createOlt = (data) => api.post('/olts', data)
export const updateOlt = (id, data) => api.put(`/olts/${id}`, data)
export const deleteOlt = (id) => api.delete(`/olts/${id}`)
export const testOltConnection = (id) => api.post(`/olts/${id}/test-connection`)

// ── PON Ports ─────────────────────────────────────────────────────────────
export const getPonPorts = (oltId, params) => api.get(`/olts/${oltId}/pon-ports`, { params })
export const createPonPort = (oltId, data) => api.post(`/olts/${oltId}/pon-ports`, data)

// ── ONTs ──────────────────────────────────────────────────────────────────
export const getOltsOnts = (oltId, params) => api.get(`/olts/${oltId}/onts`, { params })
export const createOnt = (oltId, data) => api.post(`/olts/${oltId}/onts`, data)
export const getOnt = (id) => api.get(`/onts/${id}`)
export const updateOnt = (id, data) => api.put(`/onts/${id}`, data)
export const deleteOnt = (oltId, id) => api.delete(`/olts/${oltId}/onts/${id}`)
export const pollOntSignal = (oltId) => api.post(`/olts/${oltId}/poll-signal`)

// ── Fiber Infrastructure ──────────────────────────────────────────────────
export const getFiberRoutes = (params) => api.get('/fiber/routes', { params })
export const createFiberRoute = (data) => api.post('/fiber/routes', data)
export const updateFiberRoute = (id, data) => api.put(`/fiber/routes/${id}`, data)
export const deleteFiberRoute = (id) => api.delete(`/fiber/routes/${id}`)

export const getFiberSplitters = (params) => api.get('/fiber/splitters', { params })
export const createFiberSplitter = (data) => api.post('/fiber/splitters', data)
export const deleteFiberSplitter = (id) => api.delete(`/fiber/splitters/${id}`)

export const getFiberCabinets = (params) => api.get('/fiber/cabinets', { params })
export const createFiberCabinet = (data) => api.post('/fiber/cabinets', data)
export const deleteFiberCabinet = (id) => api.delete(`/fiber/cabinets/${id}`)

export const getDistributionPoints = (params) => api.get('/fiber/distribution-points', { params })
export const createDistributionPoint = (data) => api.post('/fiber/distribution-points', data)
export const deleteDistributionPoint = (id) => api.delete(`/fiber/distribution-points/${id}`)

// ── Fiber Capacity Analytics (Release 4) ─────────────────────────────────────
export const getFiberCapacity = (params) => api.get('/fiber/capacity', { params })
