import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, CornerDownLeft, Search } from 'lucide-react'
import { getPlatformTenants } from '../../api/platform.api'

// Debounce for the server-side tenant search inside the palette.
const SEARCH_DEBOUNCE_MS = 300
const TENANT_RESULT_LIMIT = 5

/**
 * Platform command palette — Ctrl/Cmd+K.
 *
 * Two result kinds, both real:
 *  - Commands: navigation + quick actions from the platform registry.
 *  - Tenants: live server-side search (getPlatformTenants) once the query is
 *    long enough — the only platform entity with a search endpoint today.
 *    Audit records, invoices and payments are NOT searched: no platform search
 *    endpoints exist for them (documented backend gap — see
 *    PHASE0_PLATFORM_ADMIN_AUDIT.md §4.4), so no fake results are shown.
 *
 * Keyboard: ↑/↓ move, Enter executes, Escape closes (Escape handled by the
 * usePlatformPalette hook's window listener).
 */
export default function PlatformCommandPalette({ isOpen, close, query, setQuery, filteredCommands, execute }) {
  const [debounced, setDebounced] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)

  // Reset cursor + focus whenever the palette opens. The setActiveIndex(0)
  // is a legitimate prop-change reset (not a cascading setState): React bails
  // out when the value is already 0, so no extra render occurs.
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0) // eslint-disable-line react-hooks/set-state-in-effect
      const t = setTimeout(() => inputRef.current?.focus(), 0)
      return () => clearTimeout(t)
    }
    return undefined
  }, [isOpen])

  // Debounce the query for the tenant search call.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [query])

  const searching = query.trim().length >= 2

  const { data: tenantResults, isFetching: tenantsFetching } = useQuery({
    queryKey: ['platform-palette-tenants', debounced],
    queryFn: () => getPlatformTenants({ search: debounced, per_page: TENANT_RESULT_LIMIT }),
    enabled: isOpen && searching && debounced.length >= 2,
    staleTime: 15000,
  })

  const tenants = useMemo(() => {
    if (!searching) return []
    const rows = Array.isArray(tenantResults) ? tenantResults : tenantResults?.data || []
    return rows.slice(0, TENANT_RESULT_LIMIT)
  }, [tenantResults, searching])

  // Grouped sections: Tenants first (most specific), then commands by section.
  const sections = useMemo(() => {
    const secs = []
    if (tenants.length > 0) {
      secs.push({
        title: 'Tenants',
        items: tenants.map((t) => ({
          key: `tenant-${t.id}`,
          kind: 'tenant',
          label: t.name,
          detail: t.slug,
          href: `/platform/tenants/${t.id}`,
        })),
      })
    }
    const bySection = new Map()
    filteredCommands.forEach((cmd) => {
      if (!bySection.has(cmd.section)) bySection.set(cmd.section, [])
      bySection.get(cmd.section).push({
        key: cmd.id,
        kind: 'command',
        label: cmd.label,
        detail: cmd.description,
        run: () => execute(cmd),
      })
    })

    for (const [title, items] of bySection) secs.push({ title, items })
    return secs
  }, [tenants, filteredCommands, execute])

  const flatItems = useMemo(() => sections.flatMap((s) => s.items), [sections])

  // Clamp cursor to the valid range as results change (derived during render —
  // avoids a setState-in-effect and the cascading render it triggers).
  const clampedIndex = Math.min(activeIndex, Math.max(0, flatItems.length - 1))

  if (!isOpen) return null

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (flatItems.length ? (i + 1) % flatItems.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (flatItems.length ? (i - 1 + flatItems.length) % flatItems.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = flatItems[clampedIndex]
      if (item) {
        if (item.kind === 'tenant') { close(); window.location.assign(item.href) }
        else item.run()
      }
    }
  }

  // Running index of each item across sections for the shared cursor.
  let cursor = -1

  return (
    <div
      data-testid="platform-palette"
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      style={{ background: 'rgba(2,6,23,0.6)', backdropFilter: 'blur(2px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Platform command palette"
        className="w-full max-w-xl rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--pb-surface)', border: '1px solid var(--pb-border)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
      >
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--pb-border)' }}>
          <Search size={16} style={{ color: 'var(--pb-text-3)' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search tenants or type a command…"
            aria-label="Search tenants or type a command"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--pb-text-1)' }}
          />
          <kbd className="text-2xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--pb-raised)', color: 'var(--pb-text-3)', border: '1px solid var(--pb-border)' }}>Esc</kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-2" role="listbox" aria-label="Palette results">
          {flatItems.length === 0 && (
            <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--pb-text-3)' }}>
              {searching && tenantsFetching ? 'Searching tenants…' : 'No matching commands or tenants.'}
            </div>
          )}

          {sections.map((section) => (
            <div key={section.title}>
              <div className="px-4 pt-2 pb-1 text-2xs font-bold uppercase tracking-widest" style={{ color: 'var(--pb-text-3)' }}>
                {section.title}
              </div>
              {section.items.map((item) => {
                cursor += 1
                const idx = cursor
                return (
                  <button
                    key={item.key}
                    role="option"
                    aria-selected={idx === clampedIndex}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      if (item.kind === 'tenant') { close(); window.location.assign(item.href) }
                      else item.run()
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm"
                    style={{
                      backgroundColor: idx === clampedIndex ? 'rgba(167,139,250,0.12)' : 'transparent',
                      color: 'var(--pb-text-1)',
                    }}
                  >
                    {item.kind === 'tenant'
                      ? <Building2 size={15} style={{ color: '#a78bfa' }} />
                      : <CornerDownLeft size={15} style={{ color: 'var(--pb-text-3)' }} />}
                    <span className="font-medium shrink-0">{item.label}</span>
                    <span className="text-xs truncate" style={{ color: 'var(--pb-text-3)' }}>{item.detail}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        <div className="px-4 py-2 flex items-center gap-4 text-2xs" style={{ borderTop: '1px solid var(--pb-border)', color: 'var(--pb-text-3)' }}>
          <span>↑↓ navigate</span>
          <span>Enter open</span>
          <span className="ml-auto">Platform Console</span>
        </div>
      </div>
    </div>
  )
}

