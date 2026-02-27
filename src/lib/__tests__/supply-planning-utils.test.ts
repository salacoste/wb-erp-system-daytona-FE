import { describe, it, expect } from 'vitest'
import { formatReorderValue } from '../supply-planning-utils'

/**
 * Unit tests for formatReorderValue function
 * Epic 70.4-FE - Supply Planning
 * Tests edge cases and Russian RUB currency formatting
 */
describe('formatReorderValue', () => {
  it('returns dash for NaN', () => {
    expect(formatReorderValue(NaN)).toBe('—')
  })

  it('returns dash for Infinity', () => {
    expect(formatReorderValue(Infinity)).toBe('—')
  })

  it('returns dash for negative Infinity', () => {
    expect(formatReorderValue(-Infinity)).toBe('—')
  })

  it('returns dash for zero', () => {
    expect(formatReorderValue(0)).toBe('—')
  })

  it('formats positive value with RUB currency and no decimals', () => {
    const result = formatReorderValue(70000)
    expect(result).toMatch(/70\s?000/)
    expect(result).toContain('₽')
  })

  it('formats negative value correctly', () => {
    const result = formatReorderValue(-5000)
    expect(result).toContain('₽')
    expect(result).toMatch(/-|−/) // ASCII or Unicode minus sign
  })

  it('formats small positive values', () => {
    const result = formatReorderValue(100)
    expect(result).toMatch(/100\s₽/)
  })

  it('formats large positive values with space separator', () => {
    const result = formatReorderValue(1234567)
    expect(result).toMatch(/1\s?234\s?567/)
    expect(result).toContain('₽')
  })
})
