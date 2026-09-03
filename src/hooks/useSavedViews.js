import { useState } from 'react'

/**
 * useSavedViews — device-local saved-view persistence (P2 §21).
 *
 * Frontend-only persistence via localStorage so operators can save, re-apply
 * and delete named view configurations (filters, sort, columns, active tab).
 * Cross-device / team-shared saved views require a backend model, which does
 * not exist today — that dependency is documented (BACKEND_GAPS.md), not faked.
 *
 * Each saved view stores an arbitrary `config` object the consumer supplies.
 * The last-applied view id is persisted so a workspace restores its context
 * after reload.
 */
const STORE_PREFIX = 'pb.savedViews.'

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const uid = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `v-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export function useSavedViews(viewType) {
  const storeKey = `${STORE_PREFIX}${viewType}`
  const activeKey = `${STORE_PREFIX}${viewType}.active`
  const [savedViews, setSavedViews] = useState(() => readJson(storeKey, []))
  const [activeViewId, setActiveViewId] = useState(() => readJson(activeKey, null))

  const persist = (views, activeId) => {
    setSavedViews(views)
    setActiveViewId(activeId)
    try {
      localStorage.setItem(storeKey, JSON.stringify(views))
      localStorage.setItem(activeKey, activeId ? JSON.stringify(activeId) : 'null')
    } catch {
      // Storage unavailable (private mode / quota) — session-only state is fine.
    }
  }

  /** Create a view, or overwrite the view with the same name. Returns the id. */
  const saveView = (name, config) => {
    const clean = String(name || '').trim()
    if (!clean) return null
    const hit = savedViews.find((v) => v.name.toLowerCase() === clean.toLowerCase())
    if (hit) {
      const next = savedViews.map((v) =>
        v.id === hit.id ? { ...v, config, updatedAt: new Date().toISOString() } : v
      )
      persist(next, hit.id)
      return hit.id
    }
    const view = {
      id: uid(),
      name: clean,
      config,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    persist([...savedViews, view], view.id)
    return view.id
  }

  /** Apply a saved view; returns its config (or null). */
  const applyView = (id) => {
    const view = savedViews.find((v) => v.id === id)
    if (!view) return null
    persist(savedViews, id)
    return view.config
  }

  const deleteView = (id) => {
    const nextId = activeViewId === id ? null : activeViewId
    persist(savedViews.filter((v) => v.id !== id), nextId)
  }

  const getView = (id) => savedViews.find((v) => v.id === id)

  return {
    savedViews,
    activeViewId,
    activeConfig: getView(activeViewId)?.config ?? null,
    saveView,
    applyView,
    deleteView,
    getView,
  }
}

export default useSavedViews