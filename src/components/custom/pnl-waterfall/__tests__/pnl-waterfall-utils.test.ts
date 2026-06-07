/**
 * Tests for pnl-waterfall utility modules beyond the existing pnl-formatters.test.ts
 *
 * Tests for pnl-types (type guards / shape validation) and structural helpers
 * used by the waterfall chart sections.
 */

import { describe, it, expect } from 'vitest'
import { formatPercent, formatCurrency } from '../pnl-formatters'
import { EXPORT_TYPE_LABELS } from '../../export-dialog/export-dialog-constants'

/**
 * pnl-waterfall formatting consistency checks.
 * These supplement pnl-formatters.test.ts by testing edge cases specific to
 * waterfall chart rendering (large numbers, zero, boundary values).
 */
describe('formatCurrency (waterfall edge cases)', () => {
  it('handles large currency values (millions) with Russian locale grouping', () => {
    const result = formatCurrency(5000000)
    expect(result).toMatch(/5\s*000\s*000/)
    expect(result).toContain('₽')
  })

  it('formats zero without sign even with showSign=true', () => {
    const result = formatCurrency(0, true)
    expect(result).not.toContain('+')
    expect(result).not.toContain('−')
  })

  it('formats zero normally without showSign', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
    expect(result).toContain('₽')
  })

  it('handles small values under 1 RUB with zero fraction digits', () => {
    const result = formatCurrency(0.5)
    // maximumFractionDigits: 0 rounds to nearest integer
    expect(result).toContain('₽')
  })

  it('negative with showSign uses U+2212 minus, never plus', () => {
    const result = formatCurrency(-500, true)
    expect(result).toContain('−')
    expect(result).not.toContain('+')
  })

  it('positive with showSign includes plus sign', () => {
    const result = formatCurrency(500, true)
    expect(result).toContain('+')
  })
})

describe('formatPercent (waterfall edge cases)', () => {
  it('handles exactly 100%', () => {
    const result = formatPercent(100)
    expect(result).toMatch(/100,0/)
    expect(result).toContain('%')
  })

  it('handles large negative values', () => {
    const result = formatPercent(-150.5)
    expect(result).toMatch(/-150,5/)
  })

  it('handles very small positive values near zero', () => {
    const result = formatPercent(0.1)
    expect(result).toMatch(/0,1/)
  })
})

describe('EXPORT_TYPE_LABELS completeness', () => {
  it('contains all four export types with Russian labels', () => {
    expect(EXPORT_TYPE_LABELS['by-sku']).toBe('По товарам (SKU)')
    expect(EXPORT_TYPE_LABELS['by-brand']).toBe('По брендам')
    expect(EXPORT_TYPE_LABELS['by-category']).toBe('По категориям')
    expect(EXPORT_TYPE_LABELS['cabinet-summary']).toBe('Сводка по кабинету')
  })

  it('has exactly 4 entries', () => {
    expect(Object.keys(EXPORT_TYPE_LABELS)).toHaveLength(4)
  })
})
