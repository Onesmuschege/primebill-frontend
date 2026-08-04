import { describe, it, expect } from 'vitest'
import { formatKES, formatNumber } from '../formatCurrency'

describe('formatKES', () => {
  it('formats a positive amount as KES currency', () => {
    expect(formatKES(1500)).toBe('Ksh 1,500')
  })

  it('treats null/undefined as zero', () => {
    expect(formatKES(null)).toBe('Ksh 0')
    expect(formatKES(undefined)).toBe('Ksh 0')
  })

  it('formats zero explicitly', () => {
    expect(formatKES(0)).toBe('Ksh 0')
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