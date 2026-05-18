import { useEffect } from 'react'
import { X } from 'lucide-react'

const SIZE_CLASSES = {
  sm:   'max-w-md',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  xl:   'max-w-4xl',
  full: 'max-w-6xl',
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`relative z-10 w-full ${SIZE_CLASSES[size] ?? SIZE_CLASSES.md} flex flex-col max-h-[90vh] rounded-xl overflow-hidden`}
        style={{
          backgroundColor: 'var(--pb-surface)',
          border: '1px solid var(--pb-border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        {/* Top accent */}
        <div className="h-px w-full shrink-0"
          style={{ background: 'linear-gradient(90deg, transparent, #2563eb, #06b6d4, transparent)' }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--pb-border)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--pb-text-1)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--pb-text-3)' }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'var(--pb-raised)'
              e.currentTarget.style.color = 'var(--pb-text-1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--pb-text-3)'
            }}
            aria-label="Close modal"
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  )
}