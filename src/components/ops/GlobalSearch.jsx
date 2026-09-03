import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGlobalSearch } from '../../hooks/useGlobalSearch'
import { Search, User, FileText, CreditCard, Ticket, Router, Loader2, ArrowRight } from 'lucide-react'

const TYPE_CONFIG = {
  client: { icon: User, label: 'Client', tone: 'info' },
  invoice: { icon: FileText, label: 'Invoice', tone: 'warning' },
  payment: { icon: CreditCard, label: 'Payment', tone: 'success' },
  ticket: { icon: Ticket, label: 'Ticket', tone: 'danger' },
  router: { icon: Router, label: 'Router', tone: 'muted' },
}

const TONE_COLORS = {
  info: { fg: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  warning: { fg: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  success: { fg: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  danger: { fg: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  muted: { fg: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
}

function SearchResultItem({ item, onNavigate }) {
  const config = TYPE_CONFIG[item._type] || TYPE_CONFIG.client
  const tone = TONE_COLORS[config.tone] || TONE_COLORS.info
  const Icon = config.icon
  return (
    <button onClick={() => onNavigate(item._href)} className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors" style={{ background: 'var(--pb-raised)' }}>
      <div className="p-1.5 rounded" style={{ background: tone.bg }}>
        <Icon size={14} style={{ color: tone.fg }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--pb-text-1)' }}>{item._label}</p>
        <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{config.label}</p>
      </div>
      <ArrowRight size={14} style={{ color: 'var(--pb-text-3)' }} />
    </button>
  )
}

function ResultGroup({ type, items, onNavigate }) {
  if (items.length === 0) return null
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.client
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide px-3 py-2" style={{ color: 'var(--pb-text-3)' }}>{config.label}s ({items.length})</p>
      <div className="space-y-1 px-3">
        {items.map((item) => (<SearchResultItem key={`${type}-${item.id}`} item={item} onNavigate={onNavigate} />))}
      </div>
    </div>
  )
}

export default function GlobalSearch({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const { results, total, loading, enabled, hasResults } = useGlobalSearch(query)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      setQuery('')
    }
  }, [isOpen])

  const handleNavigate = (href) => {
    onNavigate ? onNavigate(href) : navigate(href)
    onClose?.()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg card overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--pb-border)' }}>
          <Search size={18} style={{ color: 'var(--pb-text-3)' }} />
          <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, invoices, payments, tickets, routers…"
            className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--pb-text-1)' }} />
          {loading && <Loader2 size={16} className="animate-spin" style={{ color: '#818cf8' }} />}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {!enabled ? (
            <div className="p-8 text-center">
              <Search size={28} className="mx-auto mb-2" style={{ color: 'var(--pb-text-3)' }} />
              <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>Type at least 2 characters to search</p>
            </div>
          ) : loading ? (
            <div className="p-8 text-center">
              <Loader2 size={24} className="mx-auto mb-2 animate-spin" style={{ color: '#818cf8' }} />
              <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>Searching…</p>
            </div>
          ) : !hasResults ? (
            <div className="p-8 text-center">
              <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>No results for "{query}"</p>
            </div>
          ) : (
            <div className="py-2">
              <ResultGroup type="client" items={results.clients} onNavigate={handleNavigate} />
              <ResultGroup type="invoice" items={results.invoices} onNavigate={handleNavigate} />
              <ResultGroup type="payment" items={results.payments} onNavigate={handleNavigate} />
              <ResultGroup type="ticket" items={results.tickets} onNavigate={handleNavigate} />
              <ResultGroup type="router" items={results.routers} onNavigate={handleNavigate} />
            </div>
          )}
        </div>
        <div className="px-4 py-2 border-t flex items-center justify-between" style={{ borderColor: 'var(--pb-border)' }}>
          <span className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{total} result{total !== 1 ? 's' : ''} across 5 sources</span>
          <span className="text-xs" style={{ color: 'var(--pb-text-3)' }}>Esc to close</span>
        </div>
      </div>
    </div>
  )
}
