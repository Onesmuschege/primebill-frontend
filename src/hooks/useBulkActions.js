import { useState, useCallback } from 'react'

/**
 * useBulkActions — manages selection state and executes bulk operations (§16).
 *
 * Provides:
 * - Selection tracking (toggle, select all, clear)
 * - Execution with result tracking
 * - Error handling
 *
 * The actual API call is passed in via the `onExecute` callback so this hook
 * stays agnostic of the domain (services, invoices, tickets, etc.).
 *
 * Returns:
 *   selectedIds    array of selected IDs
 *   toggle(id)     toggle single selection
 *   toggleAll(ids) select/clear all
 *   clear()        clear selection
 *   isSelected(id) check if selected
 *   execute(fn)    run bulk operation, capture results
 *   result         { succeeded, failed, skipped, results } | null
 *   processing     boolean
 *   dismissResult  hide result summary
 */

export function useBulkActions() {
  const [selectedIds, setSelectedIds] = useState([])
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)

  const toggle = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [])

  const toggleAll = useCallback((ids) => {
    setSelectedIds((prev) =>
      prev.length === ids.length && ids.every((id) => prev.includes(id))
        ? []
        : [...ids]
    )
  }, [])

  const clear = useCallback(() => {
    setSelectedIds([])
    setResult(null)
  }, [])

  const isSelected = useCallback(
    (id) => selectedIds.includes(id),
    [selectedIds]
  )

  const execute = useCallback(async (fn) => {
    setProcessing(true)
    setResult(null)
    try {
      const res = await fn(selectedIds)
      const resData = res?.data?.data || res?.data || res
      setResult({
        succeeded: resData.succeeded ?? resData.results?.filter((r) => r.success).length ?? 0,
        failed: resData.failed ?? resData.results?.filter((r) => !r.success).length ?? 0,
        skipped: resData.skipped ?? 0,
        results: resData.results || [],
      })
      return res
    } catch (e) {
      setResult({
        succeeded: 0,
        failed: selectedIds.length,
        skipped: 0,
        results: [],
        error: e?.message || 'Operation failed',
      })
      throw e
    } finally {
      setProcessing(false)
    }
  }, [selectedIds])

  const dismissResult = useCallback(() => setResult(null), [])

  return {
    selectedIds,
    toggle,
    toggleAll,
    clear,
    isSelected,
    execute,
    result,
    processing,
    dismissResult,
  }
}
