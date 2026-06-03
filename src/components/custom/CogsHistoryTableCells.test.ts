/**
 * Tests for CogsHistoryTableCells.formatCurrency
 * Guards the cogs-history normalizer's NaN "invalid cost" sentinel so it renders "—"
 * (anti-pattern #8 — never a fabricated "0 ₽" or the raw Intl "не число ₽").
 */

import { describe, it, expect } from 'vitest'
import { formatCurrency } from './CogsHistoryTableCells'

describe('CogsHistoryTableCells.formatCurrency', () => {
  it('renders "—" for NaN (normalizer invalid-cost sentinel), not "не число ₽"', () => {
    expect(formatCurrency(NaN)).toBe('—')
    expect(formatCurrency(Infinity)).toBe('—')
  })

  it('formats a valid cost in Russian RUB with 2 decimals', () => {
    const out = formatCurrency(1234.5)
    expect(out).toMatch(/₽/)
    expect(out).toMatch(/1\D?234,50/) // NBSP grouping
  })

  it('renders a legitimate zero as "0,00 ₽" (distinct from the NaN "—")', () => {
    expect(formatCurrency(0)).toMatch(/0,00/)
    expect(formatCurrency(0)).not.toBe('—')
  })
})
