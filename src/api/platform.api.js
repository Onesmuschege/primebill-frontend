import api from './axiosInstance'

// Platform-admin endpoints — PrimeBill's own cross-tenant operator view.
// These hit /api/platform/*, gated server-side by the platform_admin
// middleware (users.is_platform_admin), not by tenant/permission scoping.
// Every response here spans every ISP tenant on PrimeBill, not just one.

export const getPlatformStats = () => api.get('/platform/stats')

export const getPlatformTenants = () => api.get('/platform/tenants')

export const getPlatformTenant = (id) => api.get(`/platform/tenants/${id}`)

export const suspendTenant = (id) => api.post(`/platform/tenants/${id}/suspend`)

export const activateTenant = (id) => api.post(`/platform/tenants/${id}/activate`)