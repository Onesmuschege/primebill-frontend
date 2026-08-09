import api from './axiosInstance'

// Platform-admin endpoints — PrimeBill's own cross-tenant operator view.
// These hit /api/platform/*, gated server-side by the platform_admin
// middleware (users.is_platform_admin), not by tenant/permission scoping.
// Every response here spans every ISP tenant on PrimeBill, not just one.

// ── Stats & Plans ────────────────────────────────────────────────────────
export const getPlatformStats = () => api.get('/platform/stats')
export const getPlatformPlans = () => api.get('/platform/plans')

// ── Tenant CRUD ──────────────────────────────────────────────────────────
export const getPlatformTenants = () => api.get('/platform/tenants')
export const getPlatformTenant = (id) => api.get(`/platform/tenants/${id}`)
export const createTenant = (payload) => api.post('/platform/tenants', payload)
export const updateTenant = (id, payload) => api.put(`/platform/tenants/${id}`, payload)
export const deleteTenant = (id) => api.delete(`/platform/tenants/${id}`, { data: { confirm: true } })

// ── Tenant Configuration ─────────────────────────────────────────────────
export const configureCompany = (id, payload) => api.post(`/platform/tenants/${id}/company`, payload)
export const configureBranding = (id, payload) => api.post(`/platform/tenants/${id}/branding`, payload)
export const configureLocalization = (id, payload) => api.post(`/platform/tenants/${id}/localization`, payload)
export const assignPlan = (id, payload) => api.post(`/platform/tenants/${id}/plan`, payload)

// ── Tenant Lifecycle ─────────────────────────────────────────────────────
export const suspendTenant = (id) => api.post(`/platform/tenants/${id}/suspend`)
export const activateTenant = (id) => api.post(`/platform/tenants/${id}/activate`)
export const archiveTenant = (id) => api.post(`/platform/tenants/${id}/archive`)

// ── Quotas & Limits ──────────────────────────────────────────────────────
export const updateQuotas = (id, payload) => api.post(`/platform/tenants/${id}/quotas`, payload)

// ── Feature Flags ────────────────────────────────────────────────────────
export const updateFeatureFlags = (id, flags) => api.post(`/platform/tenants/${id}/features`, { feature_flags: flags })
export const addFeatureFlag = (id, feature) => api.post(`/platform/tenants/${id}/features/add`, { feature })
export const removeFeatureFlag = (id, feature) => api.post(`/platform/tenants/${id}/features/remove`, { feature })

// ── Health & Billing ─────────────────────────────────────────────────────
export const getTenantHealth = (id) => api.get(`/platform/tenants/${id}/health`)
export const getTenantBilling = (id) => api.get(`/platform/tenants/${id}/billing`)
export const getTenantSubscription = (id) => api.get(`/platform/tenants/${id}/subscription`)

// ── Impersonation ────────────────────────────────────────────────────────
export const impersonateTenant = (id) => api.post(`/platform/tenants/${id}/impersonate`)
export const endImpersonation = () => api.post('/platform/impersonate/end')

// ── Admin User Management ────────────────────────────────────────────────
export const createTenantAdmin = (id, payload) => api.post(`/platform/tenants/${id}/admin`, payload)

// ── Audit Log ────────────────────────────────────────────────────────────
export const getPlatformAuditLog = (params) => api.get('/platform/audit-log', { params })

// ── Subscription Management ──────────────────────────────────────────────
export const getPlatformSubscriptions = () => api.get('/platform/subscriptions')
export const getSubscriptionStats = () => api.get('/platform/subscription-stats')
export const upgradeSubscription = (id, payload) => api.post(`/platform/subscriptions/${id}/upgrade`, payload)
export const suspendSubscription = (id) => api.post(`/platform/subscriptions/${id}/suspend`)
export const resumeSubscription = (id) => api.post(`/platform/subscriptions/${id}/resume`)
export const cancelSubscription = (id) => api.post(`/platform/subscriptions/${id}/cancel`)
export const renewSubscription = (id) => api.post(`/platform/subscriptions/${id}/renew`)
