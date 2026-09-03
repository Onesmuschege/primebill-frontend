import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PLATFORM_NAV } from '../utils/platformNav'

// Command registry derived from the platform nav registry (single source of
// truth) plus quick actions that deep-link into real, filtered views.
const NAV_COMMANDS = PLATFORM_NAV.flatMap((g) =>
  g.items.map((item) => ({
    id: `nav-${item.to}`,
    label: `Go to ${item.label}`,
    description: g.group,
    href: item.to,
    section: g.group,
  }))
)

const QUICK_COMMANDS = [
  { id: 'qa-overdue', label: 'View overdue invoices', description: 'PrimeBill receivables past due', href: '/platform/billing?status=overdue', section: 'Quick Actions' },
  { id: 'qa-suspended', label: 'View suspended tenants', description: 'Tenants locked platform-wide', href: '/platform/tenants?status=suspended', section: 'Quick Actions' },
  { id: 'qa-trials', label: 'View trial tenants', description: 'Tenants still evaluating PrimeBill', href: '/platform/tenants?status=trial', section: 'Quick Actions' },
  { id: 'qa-system', label: 'Open system health', description: 'Infrastructure and tenant health', href: '/platform/system', section: 'Quick Actions' },
  { id: 'qa-audit', label: 'Search audit log', description: 'Every platform and privileged action', href: '/platform/audit-log', section: 'Quick Actions' },
]

export const PLATFORM_COMMANDS = [...NAV_COMMANDS, ...QUICK_COMMANDS]

/**
 * Keyboard-driven command palette state for the Platform console.
 * Ctrl/Cmd+K toggles; Escape closes. Filtering matches label, description
 * and section. Tenant search is handled by the palette component (server
 * call), not here — this hook stays pure navigation.
 */
export function usePlatformPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const open = useCallback(() => { setIsOpen(true); setQuery('') }, [])
  const close = useCallback(() => { setIsOpen(false); setQuery('') }, [])
  const toggle = useCallback(() => {
    setIsOpen((prev) => { if (!prev) setQuery(''); return !prev })
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        toggle()
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        close()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggle, close, isOpen])

  const filteredCommands = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return PLATFORM_COMMANDS
    return PLATFORM_COMMANDS.filter((cmd) =>
      cmd.label.toLowerCase().includes(q)
      || cmd.description.toLowerCase().includes(q)
      || cmd.section.toLowerCase().includes(q)
    )
  }, [query])

  const execute = useCallback((cmd) => {
    if (!cmd) return
    close()
    if (cmd.href) navigate(cmd.href)
    if (typeof cmd.onExecute === 'function') cmd.onExecute()
  }, [close, navigate])

  return { isOpen, open, close, toggle, query, setQuery, filteredCommands, execute, totalCommands: PLATFORM_COMMANDS.length }
}
