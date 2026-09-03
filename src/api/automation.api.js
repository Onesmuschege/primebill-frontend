import api from './axiosInstance'

// Release 5 — Automation console API.
// All routes hit the tenanted AutomationController (auth:sanctum).
// The API module owns response unwrapping so pages never touch r.data.
//
// The backend wraps responses with the shared ApiResponse trait:
//   - paginated lists: { data: [...], meta: {...} }           → unwrapList
//   - single object:    { ... }                               → unwrapOne
//   - rules array:      plain array of records                  → pass-through
// We inline the unwrap here (axiosInstance doesn't re-export unwrappers).

const unwrapList = (p) => p.then((r) => {
  const body = r.data?.data ?? r.data
  return { data: body?.data ?? [], meta: body?.meta ?? {} }
})
const unwrapOne = (p) => p.then((r) => r.data?.data ?? r.data)

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

// Jobs / execution overview -> { status_counts, failed_jobs, recent }  (single object)
export const getAutomationJobs = () => unwrapOne(api.get('/automation/jobs'))

// Events stream (paginated; filters: type, status, entity_type, entity_id).
export const getAutomationEvents = (params = {}) => unwrapList(api.get('/automation/events', { params: clean(params) }))

// Failures (paginated; pass { resolved: true } to include resolved).
export const getAutomationFailures = (params = {}) => unwrapList(api.get('/automation/failures', { params: clean(params) }))

// Retry a failed job.
export const retryAutomationJob = (id) => unwrapOne(api.post(`/automation/jobs/${id}/retry`))

// Rules / workflows (with_inactive to include disabled rules). Backend returns
// a bare array (no envelope).
export const getAutomationRules = (params = {}) =>
  api.get('/automation/rules', { params: clean(params) }).then((r) => r.data?.data ?? r.data ?? [])
export const createAutomationRule = (data) => unwrapOne(api.post('/automation/rules', data))
export const updateAutomationRule = (id, data) => unwrapOne(api.put(`/automation/rules/${id}`, data))


