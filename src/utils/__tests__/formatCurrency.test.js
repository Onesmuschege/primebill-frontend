import { describe, it, expect } from 'vitest'
import { formatKES, formatNumber } from '../formatCurrency'

// Node's Intl.NumberFormat inserts a non-breaking space (\u00A0) between the
// currency symbol and the number on some ICU builds, a regular space on
// others — visually identical, different character. Normalize before
// comparing so the test isn't tied to whichever one the local environment
// happens to produce.
const normalizeSpaces = (str) => str.replace(/\s/g, ' ')

describe('formatKES', () => {
  it('formats a positive amount as KES currency', () => {
    expect(normalizeSpaces(formatKES(1500))).toBe('Ksh 1,500')
  })

  it('treats null/undefined as zero', () => {
    expect(normalizeSpaces(formatKES(null))).toBe('Ksh 0')
    expect(normalizeSpaces(formatKES(undefined))).toBe('Ksh 0')
  })

  it('formats zero explicitly', () => {
    expect(normalizeSpaces(formatKES(0))).toBe('Ksh 0')
  })
})

describe('formatNumber', () => {
  it('adds thousands separators', () => {
    expect(formatNumber(1234567)).toBe('1,234,567')
  })

  it('treats null/undefined as zero', () => {
    expect(formatNumber(null)).toBe('0')
  })
})