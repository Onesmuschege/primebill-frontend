import { beforeEach, describe, expect, it } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSavedViews } from '../useSavedViews'

describe('useSavedViews', () => {
  beforeEach(() => localStorage.clear())

  it('returns empty savedViews initially', () => {
    const { result } = renderHook(() => useSavedViews('test-scope'))
    expect(result.current.savedViews).toEqual([])
    expect(result.current.activeViewId).toBeNull()
  })

  it('saves a view and sets it active', () => {
    const { result } = renderHook(() => useSavedViews('test-scope'))
    let id
    act(() => {
      id = result.current.saveView('Failed Payments', { tab: 'exceptions', sort: 'amount-desc' })
    })
    expect(id).toBeTruthy()
    expect(result.current.savedViews).toHaveLength(1)
    expect(result.current.savedViews[0].name).toBe('Failed Payments')
    expect(result.current.activeViewId).toBe(id)
  })

  it('overwrites an existing view with the same name', () => {
    const { result } = renderHook(() => useSavedViews('test-scope'))
    act(() => result.current.saveView('My View', { tab: 'exceptions' }))
    act(() => result.current.saveView('My View', { tab: 'aging' }))
    expect(result.current.savedViews).toHaveLength(1)
    expect(result.current.savedViews[0].config.tab).toBe('aging')
  })

  it('applyView returns the stored config and updates active id', () => {
    const { result } = renderHook(() => useSavedViews('test-scope'))
    let id
    act(() => {
      id = result.current.saveView('Aging', { tab: 'aging' })
    })
    act(() => result.current.applyView(id))
    expect(result.current.activeConfig).toEqual({ tab: 'aging' })
  })

  it('deleteView removes the view and clears active id when it was active', () => {
    const { result } = renderHook(() => useSavedViews('test-scope'))
    let id
    act(() => {
      id = result.current.saveView('Temp', { tab: 'aging' })
    })
    act(() => result.current.deleteView(id))
    expect(result.current.savedViews).toHaveLength(0)
    expect(result.current.activeViewId).toBeNull()
  })

  it('persists across hook remounts (same scope), restoring the active view', async () => {
    const first = renderHook(() => useSavedViews('persist-scope'))
    let id
    act(() => {
      id = first.result.current.saveView('Saved', { tab: 'unallocated' })
    })
    expect(id).toBeTruthy()

    const second = renderHook(() => useSavedViews('persist-scope'))
    await waitFor(() => {
      expect(second.result.current.savedViews).toHaveLength(1)
    })
    expect(second.result.current.savedViews[0].name).toBe('Saved')
    expect(second.result.current.activeViewId).toBe(id)
    expect(second.result.current.activeConfig).toEqual({ tab: 'unallocated' })
  })

  it('ignores malformed stored JSON gracefully', () => {
    localStorage.setItem('pb.savedViews.corrupt', 'not-json{{{')
    const { result } = renderHook(() => useSavedViews('corrupt'))
    expect(result.current.savedViews).toEqual([])
  })
})