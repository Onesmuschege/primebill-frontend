import { useEffect, useRef, useState } from 'react'
import { useSavedViews } from '../../hooks/useSavedViews'
import { Bookmark } from 'lucide-react'

/**
 * SavedViewsBar — reusable toolbar that lets an operator save/apply/delete
 * named view configurations for a workspace (P2 §21).
 *
 * Props:
 *   viewType  — stable namespace key (persistence scope), e.g. 'billing-operations'
 *   config    — the current view configuration object to persist
 *   onApply(config) — called when a saved view is selected or restored on mount
 *
 * Persistence is device-local (localStorage); cross-device sync is a
 * documented backend gap.
 */
export default function SavedViewsBar({ viewType, config, onApply }) {
  const { savedViews, activeViewId, saveView, applyView, deleteView, getView } = useSavedViews(viewType)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const restoredOnce = useRef(false)

  // Restore the last-applied view once, so a workspace reopens in the
  // operator's previous context (same device).
  useEffect(() => {
    if (restoredOnce.current) return
    restoredOnce.current = true
    if (activeViewId) {
      const cfg = getView(activeViewId)?.config
      if (cfg) onApply?.(cfg)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeViewId])

  const commitSave = () => {
    const id = saveView(name, config)
    if (id) setName('')
    setSaving(false)
  }

  return (
    <div
      className="flex items-center gap-2 flex-wrap text-xs"
      data-testid={`saved-views-${viewType}`}
    >
      <select
        aria-label="Saved views"
        className="input text-xs !py-1 !px-2"
        style={{ fontSize: 12 }}
        value={activeViewId || ''}
        onChange={(e) => {
          if (!e.target.value) return
          const cfg = applyView(e.target.value)
          if (cfg) onApply?.(cfg)
        }}
      >
        <option value="">{activeViewId ? '— Saved view —' : 'No saved view'}</option>
        {savedViews.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>

      {saving ? (
        <form
          className="flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault()
            commitSave()
          }}
        >
          <input
            autoFocus
            aria-label="View name"
            className="input text-xs !py-1 !px-2"
            style={{ width: 150, fontSize: 12 }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="View name"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="text-xs px-2 py-1 rounded font-medium"
            style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setSaving(false)}
            className="text-xs px-2 py-1 rounded"
            style={{ color: 'var(--pb-text-3)' }}
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => setSaving(true)}
          className="text-xs px-2 py-1 rounded font-medium flex items-center gap-1"
          style={{ background: 'var(--pb-raised)', color: 'var(--pb-text-2)' }}
        >
          <Bookmark size={12} /> Save view
        </button>
      )}

      {activeViewId && (
        <button
          onClick={() => deleteView(activeViewId)}
          className="text-xs px-2 py-1 rounded"
          style={{ color: '#f87171' }}
        >
          Delete
        </button>
      )}

      <span className="text-[10px]" style={{ color: 'var(--pb-text-3)' }}>
        saved on this device
      </span>
    </div>
  )
}