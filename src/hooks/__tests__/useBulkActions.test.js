import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useBulkActions } from '../useBulkActions'

describe('useBulkActions', () => {
  it('starts with empty selection', () => {
    const { result } = renderHook(() => useBulkActions())
    expect(result.current.selectedIds).toEqual([])
    expect(result.current.processing).toBe(false)
    expect(result.current.result).toBeNull()
  })

  it('toggles selection', () => {
    const { result } = renderHook(() => useBulkActions())
    act(() => result.current.toggle(1))
    expect(result.current.selectedIds).toEqual([1])
    act(() => result.current.toggle(1))
    expect(result.current.selectedIds).toEqual([])
  })

  it('toggles all', () => {
    const { result } = renderHook(() => useBulkActions())
    act(() => result.current.toggleAll([1, 2, 3]))
    expect(result.current.selectedIds).toEqual([1, 2, 3])
    act(() => result.current.toggleAll([1, 2, 3]))
    expect(result.current.selectedIds).toEqual([])
  })

  it('checks if selected', () => {
    const { result } = renderHook(() => useBulkActions())
    act(() => result.current.toggle(1))
    expect(result.current.isSelected(1)).toBe(true)
    expect(result.current.isSelected(2)).toBe(false)
  })

  it('clears selection', () => {
    const { result } = renderHook(() => useBulkActions())
    act(() => result.current.toggle(1))
    act(() => result.current.clear())
    expect(result.current.selectedIds).toEqual([])
  })

  it('executes bulk operation and captures results', async () => {
    const { result } = renderHook(() => useBulkActions())
    act(() => result.current.toggle(1))
    act(() => result.current.toggle(2))

    const mockFn = vi.fn().mockResolvedValue({
      data: { succeeded: 2, failed: 0, results: [{ account_id: 1, success: true }, { account_id: 2, success: true }] },
    })

    await act(async () => {
      await result.current.execute(mockFn)
    })

    expect(mockFn).toHaveBeenCalledWith([1, 2])
    expect(result.current.result.succeeded).toBe(2)
    expect(result.current.result.failed).toBe(0)
    expect(result.current.processing).toBe(false)
  })

  it('handles execution errors', async () => {
    const { result } = renderHook(() => useBulkActions())
    act(() => result.current.toggle(1))

    const mockFn = vi.fn().mockRejectedValue(new Error('Network error'))

    await act(async () => {
      try {
        await result.current.execute(mockFn)
      } catch {
        // expected
      }
    })

    expect(result.current.result.failed).toBe(1)
    expect(result.current.result.error).toBe('Network error')
  })

  it('dismisses result', () => {
    const { result } = renderHook(() => useBulkActions())
    act(() => result.current.toggle(1))
    act(() => result.current.dismissResult())
    expect(result.current.result).toBeNull()
  })
})
