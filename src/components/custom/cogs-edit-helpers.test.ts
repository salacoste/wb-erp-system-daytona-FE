/**
 * Tests for cogs-edit-helpers.formatCurrencyRu
 * CogsEditDialog feeds record.unit_cost_rub here, which the cogs-history normalizer maps to NaN
 * for an invalid/missing backend cost (honest sentinel). Must render "—", not "не число ₽".
 */

import { describe, it, expect } from 'vitest'
import { formatCurrencyRu } from './cogs-edit-helpers'

describe('cogs-edit-helpers.formatCurrencyRu', () => {
  it('renders "—" for NaN (normalizer invalid-cost sentinel), not "не число ₽"', () => {
    expect(formatCurrencyRu(NaN)).toBe('—')
    expect(formatCurrencyRu(Infinity)).toBe('—')
  })

  it('formats a valid cost in Russian RUB with 2 decimals', () => {
    const out = formatCurrencyRu(99.9)
    expect(out).toMatch(/₽/)
    expect(out).toMatch(/99,90/)
  })

  it('renders a legitimate zero as "0,00 ₽" (distinct from the NaN "—")', () => {
    expect(formatCurrencyRu(0)).not.toBe('—')
    expect(formatCurrencyRu(0)).toMatch(/0,00/)
  })
})
