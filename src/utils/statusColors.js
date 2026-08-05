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