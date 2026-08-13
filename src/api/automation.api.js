import api from './axiosInstance'

// Release 5 — Automation console API.
// All routes hit the tenanted AutomationController (auth:sanctum). Responses use
// the shared ApiResponse trait, so lists live under response.data.data (paginator
// for events/failures, plain array for rules, object for the jobs overview).

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

// Events stream (paginated; filters: type, status, entity_type, entity_id).
export const getAutomationEvents = (params = {}) => api.get('/automation/events', { params: clean(params) })

// Jobs / execution overview -> { status_counts, failed_jobs, recent }.
export const getAutomationJobs = () => api.get('/automation/jobs')

// Failures (paginated; pass { resolved: true } to include resolved).
export const getAutomationFailures = (params = {}) => api.get('/automation/failures', { params: clean(params) })

// Retry a failed job.
export const retryAutomationJob = (id) => api.post(`/automation/jobs/${id}/retry`)

// Rules / workflows (with_inactive to include disabled rules).
export const getAutomationRules = (params = {}) => api.get('/automation/rules', { params: clean(params) })
export const createAutomationRule = (data) => api.post('/automation/rules', data)
export const updateAutomationRule = (id, data) => api.put(`/automation/rules/${id}`, data)
