import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

const COMMAND_REGISTRY = [
  { id: 'dashboard', label: 'Go to Dashboard', description: 'Operational command center', href: '/dashboard', section: 'Overview' },
  { id: 'clients', label: 'Go to Clients', description: 'Manage customers', href: '/clients', section: 'Subscribers' },
  { id: 'leads', label: 'Go to Leads', description: 'Manage leads', href: '/leads', section: 'Subscribers' },
  { id: 'prospects', label: 'Go to Prospects', description: 'Manage prospects', href: '/prospects', section: 'Subscribers' },
  { id: 'loyalty', label: 'Go to Loyalty Points', description: 'Loyalty and referrals', href: '/loyalty', section: 'Subscribers' },
  { id: 'plans', label: 'Go to Plans', description: 'Manage service plans', href: '/plans', section: 'Plans & Usage' },
  { id: 'fup', label: 'Go to FUP Management', description: 'Fair usage policies', href: '/fup', section: 'Plans & Usage' },
  { id: 'vouchers', label: 'Go to Vouchers', description: 'Manage vouchers', href: '/vouchers', section: 'Plans & Usage' },
  { id: 'invoices', label: 'Go to Invoices', description: 'Manage invoices', href: '/invoices', section: 'Billing & Finance' },
  { id: 'payments', label: 'Go to Payments', description: 'Manage payments', href: '/payments', section: 'Billing & Finance' },
  { id: 'payment-allocations', label: 'Go to Allocations', description: 'Payment allocations', href: '/payment-allocations', section: 'Billing & Finance' },
  { id: 'finance', label: 'Go to Finance Overview', description: 'Wallets, credits, refunds', href: '/finance', section: 'Billing & Finance' },
  { id: 'billing-ops', label: 'Go to Billing Operations', description: 'Exceptions-first billing workspace', href: '/billing-operations', section: 'Billing & Finance' },
  { id: 'routers', label: 'Go to Routers', description: 'Manage routers', href: '/routers', section: 'Network' },
  { id: 'radius', label: 'Go to RADIUS', description: 'RADIUS settings and sessions', href: '/radius', section: 'Network' },
  { id: 'ipam', label: 'Go to IPAM', description: 'IP address management', href: '/ipam', section: 'Network' },
  { id: 'noc', label: 'Go to NOC Dashboard', description: 'Network operations', href: '/noc', section: 'Network' },
  { id: 'network-command', label: 'Go to Network Command', description: 'Infrastructure health and incidents', href: '/network-command', section: 'Network' },
  { id: 'fiber-olts', label: 'Go to OLTs', description: 'Fiber infrastructure', href: '/fiber/olts', section: 'Network' },
  { id: 'fiber-map', label: 'Go to Fiber Map', description: 'Fiber topology', href: '/fiber/map', section: 'Network' },
  { id: 'tickets', label: 'Go to Tickets', description: 'Support tickets', href: '/tickets', section: 'Support' },
  { id: 'sms', label: 'Go to SMS', description: 'SMS communications', href: '/sms', section: 'Support' },
  { id: 'work-orders', label: 'Go to Work Orders', description: 'Field work orders', href: '/work-orders', section: 'Field Operations' },
  { id: 'technicians', label: 'Go to Technicians', description: 'Field technicians', href: '/work-orders/technicians', section: 'Field Operations' },
  { id: 'inventory', label: 'Go to Inventory', description: 'Equipment and stock', href: '/inventory', section: 'Inventory' },
  { id: 'inventory-ops', label: 'Go to Inventory Operations', description: 'Stock movements', href: '/inventory/operations', section: 'Inventory' },
  { id: 'reports', label: 'Go to Reports', description: 'Business reports', href: '/reports', section: 'Reports & Analytics' },
  { id: 'analytics', label: 'Go to Analytics', description: 'Business analytics', href: '/analytics', section: 'Reports & Analytics' },
  { id: 'admin-users', label: 'Go to Users', description: 'User management', href: '/admin/users', section: 'System' },
  { id: 'admin-roles', label: 'Go to Roles', description: 'Role management', href: '/admin/roles', section: 'System' },
  { id: 'settings', label: 'Go to Settings', description: 'System settings', href: '/settings', section: 'System' },
  { id: 'logs', label: 'Go to System Logs', description: 'Audit trail', href: '/logs', section: 'System' },
  { id: 'automation', label: 'Go to Automation', description: 'Automation jobs and rules', href: '/automation', section: 'System' },
  { id: 'my-work', label: 'Open My Work', description: 'Work requiring attention', href: '/my-work', section: 'Quick Actions' },
  { id: 'search', label: 'Open Global Search', description: 'Search across all entities', action: 'search', section: 'Quick Actions' },
]

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const open = useCallback(() => { setIsOpen(true); setQuery('') }, [])
  const close = useCallback(() => { setIsOpen(false); setQuery('') }, [])
  const toggle = useCallback(() => { setIsOpen((prev) => { if (!prev) setQuery(''); return !prev }) }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); toggle() }
      if (e.key === 'Escape' && isOpen) { e.preventDefault(); close() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggle, close, isOpen])

  const filteredCommands = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return COMMAND_REGISTRY
    return COMMAND_REGISTRY.filter((cmd) => cmd.label.toLowerCase().includes(q) || cmd.description.toLowerCase().includes(q) || cmd.section.toLowerCase().includes(q))
  }, [query])

  const execute = useCallback((cmd) => {
    close()
    if (cmd.action === 'search') {
      window.dispatchEvent(new CustomEvent('primebill:open-search'))
    } else if (cmd.href) {
      navigate(cmd.href)
    }
  }, [close, navigate])

  return { isOpen, open, close, toggle, query, setQuery, filteredCommands, execute, totalCommands: COMMAND_REGISTRY.length }
}
