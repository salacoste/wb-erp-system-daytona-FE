import { describe, it, expect } from 'vitest'
import { formatReorderValue, formatDaysUntilStockout } from '../supply-planning-utils'

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

/**
 * Unit tests for formatDaysUntilStockout — sentinel handling + Russian plural grammar.
 * The 999 "never stocks out" sentinel must render "∞" (not a raw number), null → "Нет данных",
 * 0 → "Сегодня".
 */
describe('formatDaysUntilStockout', () => {
  it('handles the sentinel and edge values', () => {
    expect(formatDaysUntilStockout(null)).toBe('Нет данных')
    expect(formatDaysUntilStockout(0)).toBe('Сегодня')
    expect(formatDaysUntilStockout(999)).toBe('∞')
    expect(formatDaysUntilStockout(1000)).toBe('∞')
  })

  it('applies Russian plural grammar by last digit', () => {
    expect(formatDaysUntilStockout(1)).toBe('1 день')
    expect(formatDaysUntilStockout(2)).toBe('2 дня')
    expect(formatDaysUntilStockout(5)).toBe('5 дней')
    expect(formatDaysUntilStockout(11)).toBe('11 дней') // teens always "дней"
    expect(formatDaysUntilStockout(21)).toBe('21 день')
    expect(formatDaysUntilStockout(22)).toBe('22 дня')
    expect(formatDaysUntilStockout(25)).toBe('25 дней')
  })
})
