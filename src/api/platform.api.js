import api, { unwrapList, unwrapOne } from './axiosInstance'

// Platform-admin endpoints — PrimeBill's own cross-tenant operator view.
// These hit /api/platform/*, gated server-side by the platform_admin
// middleware (users.is_platform_admin), not by tenant/permission scoping.
// Every response here spans every ISP tenant on PrimeBill, not just one.
//
// List endpoints resolve to { data, meta } via unwrapList; stats/reports and
// single-resource/mutation endpoints resolve to the raw resource via
// unwrapOne. Blob endpoints (PDF/CSV) are intentionally left untouched.

// ── Stats & Plans ────────────────────────────────────────────────────────
export const getPlatformStats = () => api.get('/platform/stats').then(unwrapOne)
export const getPlatformPlans = () => api.get('/platform/plans').then(unwrapList)

// ── Tenant CRUD ──────────────────────────────────────────────────────────
// getPlatformTenants({ status, search }) — legacy full-array mode (returns the
// complete enriched list). Used by consumers that need every tenant.
//
// getPlatformTenantsPaginated({ page, per_page, sort, direction, status, search })
// — server-side paginated mode for the full-page /platform/tenants view. The
// backend filters/sorts at the DB level and enriches only the current page's
// tenants, so this scales to thousands of tenants without pulling every
// tenant's metrics into memory. Returns { data, meta } where meta contains
// { current_page, per_page, total, last_page, from, to }.
export const getPlatformTenants = (params) => api.get('/platform/tenants', { params }).then(unwrapList)
export const getPlatformTenantsPaginated = (params) =>
  api.get('/platform/tenants', { params: { ...params, per_page: params?.per_page ?? 20 } }).then(unwrapList)
export const getPlatformTenant = (id) => api.get(`/platform/tenants/${id}`).then(unwrapOne)
export const createTenant = (payload) => api.post('/platform/tenants', payload).then(unwrapOne)
export const updateTenant = (id, payload) => api.put(`/platform/tenants/${id}`, payload).then(unwrapOne)
export const deleteTenant = (id) => api.delete(`/platform/tenants/${id}`, { data: { confirm: true } }).then(unwrapOne)

// ── Tenant Configuration ─────────────────────────────────────────────────
export const configureCompany = (id, payload) => api.post(`/platform/tenants/${id}/company`, payload).then(unwrapOne)
export const configureBranding = (id, payload) => api.post(`/platform/tenants/${id}/branding`, payload).then(unwrapOne)
export const configureLocalization = (id, payload) => api.post(`/platform/tenants/${id}/localization`, payload).then(unwrapOne)
export const assignPlan = (id, payload) => api.post(`/platform/tenants/${id}/plan`, payload).then(unwrapOne)

// ── Tenant Lifecycle ─────────────────────────────────────────────────────
export const suspendTenant = (id) => api.post(`/platform/tenants/${id}/suspend`).then(unwrapOne)
export const activateTenant = (id) => api.post(`/platform/tenants/${id}/activate`).then(unwrapOne)
export const archiveTenant = (id) => api.post(`/platform/tenants/${id}/archive`).then(unwrapOne)

// ── Quotas & Limits ──────────────────────────────────────────────────────
export const updateQuotas = (id, payload) => api.post(`/platform/tenants/${id}/quotas`, payload).then(unwrapOne)

// ── Feature Flags ────────────────────────────────────────────────────────
export const updateFeatureFlags = (id, flags) => api.post(`/platform/tenants/${id}/features`, { feature_flags: flags }).then(unwrapOne)
export const addFeatureFlag = (id, feature) => api.post(`/platform/tenants/${id}/features/add`, { feature }).then(unwrapOne)
export const removeFeatureFlag = (id, feature) => api.post(`/platform/tenants/${id}/features/remove`, { feature }).then(unwrapOne)

// ── Health & Billing ─────────────────────────────────────────────────────
export const getTenantHealth = (id) => api.get(`/platform/tenants/${id}/health`).then(unwrapOne)
export const getTenantBilling = (id) => api.get(`/platform/tenants/${id}/billing`).then(unwrapOne)
export const getTenantSubscription = (id) => api.get(`/platform/tenants/${id}/subscription`).then(unwrapOne)

// ── Impersonation ────────────────────────────────────────────────────────
// reason: required audit-trail justification (min 10 chars, backend-enforced).
// mode:   'view' (read-only UI inspection) or 'act' (full tenant-admin authority).
export const impersonateTenant = (id, reason, mode = 'act') =>
  api.post(`/platform/tenants/${id}/impersonate`, { reason, mode }).then(unwrapOne)
export const endImpersonation = () => api.post('/platform/impersonate/end').then(unwrapOne)

// ── Admin User Management ────────────────────────────────────────────────
export const createTenantAdmin = (id, payload) => api.post(`/platform/tenants/${id}/admin`, payload).then(unwrapOne)

// ── Audit Log ────────────────────────────────────────────────────────────
export const getPlatformAuditLog = (params) => api.get('/platform/audit-log', { params }).then(unwrapList)

// ── Platform Users (READ-ONLY — is_platform_admin is CLI-only) ────────────
export const getPlatformUsers = () => api.get('/platform/users').then(unwrapOne)

// ── Subscription Management ──────────────────────────────────────────────
export const getPlatformSubscriptions = () => api.get('/platform/subscriptions').then(unwrapList)
export const getSubscriptionStats = () => api.get('/platform/subscription-stats').then(unwrapOne)
export const upgradeSubscription = (id, payload) => api.post(`/platform/subscriptions/${id}/upgrade`, payload).then(unwrapOne)
export const suspendSubscription = (id) => api.post(`/platform/subscriptions/${id}/suspend`).then(unwrapOne)
export const resumeSubscription = (id) => api.post(`/platform/subscriptions/${id}/resume`).then(unwrapOne)
export const cancelSubscription = (id) => api.post(`/platform/subscriptions/${id}/cancel`).then(unwrapOne)
export const renewSubscription = (id) => api.post(`/platform/subscriptions/${id}/renew`).then(unwrapOne)

// ── Advanced Billing (PrimeBill invoices to its tenant ISPs) ─────────────
// Separate from the tenant-side billing this app normally serves: these are
// PrimeBill's own invoices to the ISPs, scoped to /platform/billing/*.
export const getPlatformInvoices = (params) => api.get('/platform/billing/invoices', { params }).then(unwrapList)
export const getPlatformInvoice = (id) => api.get(`/platform/billing/invoices/${id}`).then(unwrapOne)
export const downloadPlatformInvoicePdf = (id) => api.get(`/platform/billing/invoices/${id}/pdf`, { responseType: 'blob' })
export const sendPlatformInvoice = (id) => api.post(`/platform/billing/invoices/${id}/send`).then(unwrapOne)
export const resendPlatformInvoice = (id) => api.post(`/platform/billing/invoices/${id}/resend`).then(unwrapOne)
export const markPlatformInvoicePaid = (id, payload = {}) => api.post(`/platform/billing/invoices/${id}/mark-paid`, payload).then(unwrapOne)
export const voidPlatformInvoice = (id, payload = {}) => api.post(`/platform/billing/invoices/${id}/void`, payload).then(unwrapOne)
export const generatePlatformInvoices = (payload = {}) => api.post('/platform/billing/invoices/generate', payload).then(unwrapOne)
export const getPlatformBillingStats = () => api.get('/platform/billing/stats').then(unwrapOne)

// ── Platform Reporting ────────────────────────────────────────────────────
export const getPlatformRevenueReport = (params) => api.get('/platform/reports/revenue', { params }).then(unwrapOne)
export const getPlatformTenantsReport = (params) => api.get('/platform/reports/tenants', { params }).then(unwrapOne)
export const getPlatformUsageReport = () => api.get('/platform/reports/usage').then(unwrapOne)
export const exportPlatformReport = (type, params) => api.get(`/platform/reports/${type}/export`, { params, responseType: 'blob' })
