/**
 * Status color helpers — returns CSS class strings for badges.
 * All classes are defined in index.css @layer components.
 */

export function clientStatusBadge(status) {
  const map = {
    active:    'badge badge-active',
    suspended: 'badge badge-suspended',
    overdue:   'badge badge-overdue',
    inactive:  'badge badge-inactive',
  }
  return map[status] ?? 'badge badge-inactive'
}

export function invoiceStatusBadge(status) {
  const map = {
    paid:      'badge badge-paid',
    unpaid:    'badge badge-unpaid',
    overdue:   'badge badge-overdue',
    cancelled: 'badge badge-inactive',
    draft:     'badge badge-inactive',
  }
  return map[status] ?? 'badge badge-inactive'
}

export function ticketPriorityColor(priority) {
  const map = {
    urgent: 'badge badge-suspended',
    high:   'badge badge-overdue',
    normal: 'badge badge-info',
    low:    'badge badge-inactive',
  }
  return map[priority] ?? 'badge badge-inactive'
}

export function ticketStatusBadge(status) {
  const map = {
    open:    'badge badge-suspended',
    pending: 'badge badge-unpaid',
    solved:  'badge badge-paid',
    closed:  'badge badge-inactive',
  }
  return map[status] ?? 'badge badge-inactive'
}

export function paymentMethodBadge(method) {
  const map = {
    mpesa: 'badge badge-paid',   // green
    cash:  'badge badge-info',   // blue
    bank:  'badge badge-unpaid', // amber
  }
  return map[method] ?? 'badge badge-inactive'
}

// Tenant status — active/trial/suspended, matches the Tenant model's
// status enum on the backend (see the multi-tenant SaaS foundation
// migration). Distinct from clientStatusBadge: a tenant is an ISP running
// on PrimeBill, not a client of one.
export function tenantStatusBadge(status) {
  const map = {
    active:    'badge badge-active',
    trial:     'badge badge-info',
    suspended: 'badge badge-suspended',
  }
  return map[status] ?? 'badge badge-inactive'
}

// Lead status — new/contacted/qualified/survey_required/converted/lost
export function leadStatusBadge(status) {
  const map = {
    new:             'badge badge-info',
    contacted:       'badge badge-unpaid',
    qualified:       'badge badge-active',
    survey_required: 'badge badge-overdue',
    converted:       'badge badge-paid',
    lost:            'badge badge-inactive',
  }
  return map[status] ?? 'badge badge-inactive'
}

// Prospect pipeline stage — new/negotiation/survey_scheduled/survey_completed/installation_scheduled/won/lost
export function prospectStageBadge(stage) {
  const map = {
    new:                    'badge badge-info',
    negotiation:            'badge badge-unpaid',
    survey_scheduled:       'badge badge-overdue',
    survey_completed:       'badge badge-active',
    installation_scheduled: 'badge badge-active',
    won:                    'badge badge-paid',
    lost:                   'badge badge-inactive',
  }
  return map[stage] ?? 'badge badge-inactive'
}

// Prospect status — active/converted/lost
export function prospectStatusBadge(status) {
  const map = {
    active:    'badge badge-active',
    converted: 'badge badge-paid',
    lost:      'badge badge-inactive',
  }
  return map[status] ?? 'badge badge-inactive'
}
