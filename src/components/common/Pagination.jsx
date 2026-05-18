import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null

  const pages = Array.from({ length: meta.last_page }, (_, i) => i + 1)
    .filter(p => Math.abs(p - meta.current_page) <= 2)

  return (
    <div
      className="flex items-center justify-between px-5 py-3 text-sm"
      style={{ borderTop: '1px solid var(--pb-border)' }}
    >
      <p style={{ color: 'var(--pb-text-3)' }}>
        <span style={{ color: 'var(--pb-text-2)' }}>{meta.from}–{meta.to}</span>
        {' '}of{' '}
        <span style={{ color: 'var(--pb-text-2)' }}>{meta.total}</span>
        {' '}results
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(meta.current_page - 1)}
          disabled={meta.current_page === 1}
          className="p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ color: 'var(--pb-text-2)', border: '1px solid var(--pb-border)' }}
          onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.borderColor = '#2563eb')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--pb-border)')}
        >
          <ChevronLeft size={15} />
        </button>

        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className="w-8 h-8 rounded-lg text-xs font-medium transition-all"
            style={
              page === meta.current_page
                ? { backgroundColor: '#2563eb', color: '#fff', border: '1px solid #2563eb' }
                : { color: 'var(--pb-text-2)', border: '1px solid var(--pb-border)' }
            }
            onMouseEnter={e => page !== meta.current_page && (e.currentTarget.style.borderColor = '#2563eb')}
            onMouseLeave={e => page !== meta.current_page && (e.currentTarget.style.borderColor = 'var(--pb-border)')}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(meta.current_page + 1)}
          disabled={meta.current_page === meta.last_page}
          className="p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ color: 'var(--pb-text-2)', border: '1px solid var(--pb-border)' }}
          onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.borderColor = '#2563eb')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--pb-border)')}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}