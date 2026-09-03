import { useEffect, useRef } from 'react'
import { useCommandPalette } from '../../hooks/useCommandPalette'
import { Command, Search, Hash, ArrowRight } from 'lucide-react'

const SECTION_ORDER = ['Quick Actions', 'Overview', 'Subscribers', 'Plans & Usage', 'Billing & Finance', 'Network', 'Support', 'Field Operations', 'Inventory', 'Reports & Analytics', 'System']

function CommandItem({ cmd, onExecute }) {
  return (
    <button
      onClick={() => onExecute(cmd)}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/50"
    >
      <div className="p-1.5 rounded" style={{ background: 'rgba(99,102,241,0.1)' }}>
        {cmd.action === 'search' ? <Search size={13} style={{ color: '#818cf8' }} /> : <Hash size={13} style={{ color: '#818cf8' }} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--pb-text-1)' }}>{cmd.label}</p>
        <p className="text-xs truncate" style={{ color: 'var(--pb-text-3)' }}>{cmd.description}</p>
      </div>
      <ArrowRight size={13} style={{ color: 'var(--pb-text-3)' }} />
    </button>
  )
}

function CommandGroup({ section, commands, onExecute }) {
  if (commands.length === 0) return null
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide px-4 py-2" style={{ color: 'var(--pb-text-3)' }}>{section}</p>
      <div>
        {commands.map((cmd) => (<CommandItem key={cmd.id} cmd={cmd} onExecute={onExecute} />))}
      </div>
    </div>
  )
}

/**
 * CommandPalette — Ctrl+K navigation and actions (§19 master prompt).
 *
 * Overlays a searchable command list. Type to filter by label, description,
 * or section. Enter or click to execute. Esc to close.
 */

export default function CommandPalette() {
  const { isOpen, close, query, setQuery, filteredCommands, execute } = useCommandPalette()
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus()
  }, [isOpen])

  if (!isOpen) return null

  // Group commands by section
  const grouped = SECTION_ORDER.reduce((acc, section) => {
    const cmds = filteredCommands.filter((c) => c.section === section)
    if (cmds.length > 0) acc[section] = cmds
    return acc
  }, {})

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]">
      <div className="absolute inset-0 bg-black/50" onClick={close} />
      <div className="relative w-full max-w-lg card overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--pb-border)' }}>
          <Command size={18} style={{ color: '#818cf8' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--pb-text-1)' }}
          />
          <kbd className="text-xs px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--pb-border)', color: 'var(--pb-text-3)' }}>Esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>No commands found</p>
            </div>
          ) : (
            <div className="py-2">
              {SECTION_ORDER.map((section) => (
                <CommandGroup key={section} section={section} commands={grouped[section] || []} onExecute={execute} />
              ))}
            </div>
          )}
        </div>
        <div className="px-4 py-2 border-t flex items-center justify-between" style={{ borderColor: 'var(--pb-border)' }}>
          <span className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{filteredCommands.length} commands</span>
          <span className="text-xs" style={{ color: 'var(--pb-text-3)' }}>Ctrl+K to toggle</span>
        </div>
      </div>
    </div>
  )
}
