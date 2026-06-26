import { useState, useEffect } from 'react'

/**
 * useDebounce
 *
 * Returns a debounced copy of `value` that only updates after `delay` ms
 * of silence. The original value updates instantly (for controlled inputs),
 * the debounced value updates lazily (for query keys and API calls).
 *
 * Usage:
 *   const [search, setSearch] = useState('')
 *   const debouncedSearch = useDebounce(search, 400)
 *
 *   // Feed `search` to the input value — updates on every keystroke
 *   // Feed `debouncedSearch` to the query key — only fires after 400ms pause
 *
 * @param {any}    value  The value to debounce (typically a string)
 * @param {number} delay  Milliseconds to wait after last change (default 400)
 */
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cancel the timer if value changes before delay expires.
    // This is what makes it a debounce — only the final value after
    // the user stops typing actually propagates.
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}