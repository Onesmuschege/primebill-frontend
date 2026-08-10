import api from './axiosInstance'

// ── API keys (self-service) ────────────────────────────────────────────────
// index/destroy return plain arrays; store returns a flat object with the
// full key_secret shown exactly once.
export const getApiKeys = () => api.get('/api-keys')
export const createApiKey = (data) => api.post('/api-keys', data)
export const revokeApiKey = (id) => api.delete(`/api-keys/${id}`)

// ── Sessions (active tokens) ───────────────────────────────────────────────
export const getSessions = () => api.get('/sessions')
export const revokeSession = (id) => api.delete(`/sessions/${id}`)
export const revokeAllSessions = () => api.delete('/sessions/revoke-all')

// ── Login history & security events ────────────────────────────────────────
export const getLoginHistory = (params = {}) => api.get('/login-history', { params })
export const getSecurityEvents = (params = {}) => api.get('/login-history/security-events', { params })