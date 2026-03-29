import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <p className="text-sm text-gray-600">
        Showing {meta.from}–{meta.to} of {meta.total} results
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(meta.current_page - 1)}
          disabled={meta.current_page === 1}
          className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: meta.last_page }, (_, i) => i + 1)
          .filter(p => Math.abs(p - meta.current_page) <= 2)
          .map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 rounded-lg border text-sm ${
                page === meta.current_page
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
        <button
          onClick={() => onPageChange(meta.current_page + 1)}
          disabled={meta.current_page === meta.last_page}
          className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}