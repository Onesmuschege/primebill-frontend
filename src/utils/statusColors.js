export const clientStatusBadge = (status) => {
  const map = {
    active:    'badge-active',
    suspended: 'badge-suspended',
    inactive:  'badge-inactive',
    overdue:   'badge-overdue',
    disabled:  'badge-inactive',
  }
  return map[status] || 'badge-inactive'
}

export const invoiceStatusBadge = (status) => {
  const map = {
    paid:      'badge-paid',
    unpaid:    'badge-unpaid',
    overdue:   'badge-overdue',
    cancelled: 'badge-inactive',
    draft:     'badge-inactive',
  }
  return map[status] || 'badge-inactive'
}

export const ticketPriorityColor = (priority) => {
  const map = {
    low:      'bg-blue-100 text-blue-800',
    medium:   'bg-yellow-100 text-yellow-800',
    high:     'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  }
  return map[priority] || 'bg-gray-100 text-gray-800'
}