/**
 * Tests for cogs-edit-helpers.formatCurrencyRu
 * CogsEditDialog feeds record.unit_cost_rub here, which the cogs-history normalizer maps to NaN
 * for an invalid/missing backend cost (honest sentinel). Must render "—", not "не число ₽".
 */

import { describe, it, expect } from 'vitest'
import { formatCurrencyRu, sourceLabels } from './cogs-edit-helpers'

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

describe('cogs-edit-helpers.sourceLabels — BD-13 МойСклад provenance', () => {
  it('labels moysklad so CogsEditDialog does not fall back to the raw string', () => {
    expect(sourceLabels.moysklad).toBe('Синхронизация с МойСклад')
    // All backend-emitted sources resolve — no raw-string leak for known values.
    expect(sourceLabels.manual).toBe('Ручной ввод')
    expect(sourceLabels.system).toBe('Системный пересчёт')
  })
})
