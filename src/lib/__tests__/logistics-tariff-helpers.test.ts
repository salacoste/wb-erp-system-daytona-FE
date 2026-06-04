/**
 * Unit tests for logistics-tariff-helpers (price-calculator) — regression coverage added iter-137.
 *
 * Pure tariff math + display-string builders. createBreakdown's display strings now use the canonical
 * formatDecimal (iter-138 fix) → Russian comma in coefficientDisplay/additionalDisplay/volumeDisplay.
 */

import { describe, it, expect } from 'vitest'
import { formatCurrency } from '@/lib/utils'
import {
  DEFAULT_BOX_TARIFFS,
  DEFAULT_RETURN_TARIFFS,
  createBreakdown,
  createZeroResult,
  parseTariffExpression,
  normalizeCoefficient,
  denormalizeCoefficient,
} from '@/lib/logistics-tariff-helpers'

describe('default tariff constants', () => {
  it('box defaults: 46 base / 14 additional / 1.0 coefficient', () => {
    expect(DEFAULT_BOX_TARIFFS).toEqual({
      baseLiterRub: 46,
      additionalLiterRub: 14,
      coefficient: 1.0,
    })
  })
  it('return defaults: 50 base / 25 additional', () => {
    expect(DEFAULT_RETURN_TARIFFS).toEqual({ baseLiterRub: 50, additionalLiterRub: 25 })
  })
})

describe('parseTariffExpression', () => {
  it('extracts the leading integer before the multiplier', () => {
    expect(parseTariffExpression('48*1')).toBe(48)
    expect(parseTariffExpression('5*x')).toBe(5)
    expect(parseTariffExpression('125*1.0')).toBe(125)
  })
  it('returns 0 when there is no "N*" prefix', () => {
    expect(parseTariffExpression('48')).toBe(0)
    expect(parseTariffExpression('abc')).toBe(0)
    expect(parseTariffExpression('')).toBe(0)
  })
})

describe('coefficient normalize/denormalize (WB integer 100 ↔ decimal 1.0)', () => {
  it('normalizes integer → decimal', () => {
    expect(normalizeCoefficient(100)).toBe(1)
    expect(normalizeCoefficient(125)).toBe(1.25)
    expect(normalizeCoefficient(0)).toBe(0)
  })
  it('denormalizes decimal → rounded integer', () => {
    expect(denormalizeCoefficient(1.0)).toBe(100)
    expect(denormalizeCoefficient(1.25)).toBe(125)
    expect(denormalizeCoefficient(1.256)).toBe(126) // 125.6 → 126 (node-verified; 1.255 is a float-edge → 125)
  })
  it('round-trips', () => {
    expect(denormalizeCoefficient(normalizeCoefficient(125))).toBe(125)
  })
})

describe('createZeroResult', () => {
  it('returns an all-zero result with locale-correct display + default source', () => {
    const result = createZeroResult(DEFAULT_BOX_TARIFFS)
    expect(result.volumeLiters).toBe(0)
    expect(result.totalCost).toBe(0)
    expect(result.coefficient).toBe(1.0)
    expect(result.source).toBe('default')
    expect(result.breakdown.volumeDisplay).toBe('0,00 л')
    expect(result.breakdown.totalDisplay).toBe('0,00 ₽')
  })
  it('falls back to coefficient 1.0 when tariffs.coefficient is 0 (|| guard)', () => {
    expect(createZeroResult({ ...DEFAULT_BOX_TARIFFS, coefficient: 0 }).coefficient).toBe(1.0)
  })
})

describe('createBreakdown', () => {
  it('renders the "no additional liters" branch + locale-correct volume/total', () => {
    const b = createBreakdown(3, 46, 0, 14, 1.0, 74)
    expect(b.volumeDisplay).toBe('3,00 л') // comma — correct
    expect(b.baseRateDisplay).toBe('46 ₽ (первый литр)')
    expect(b.additionalDisplay).toBe('Нет доп. литров')
    expect(b.totalDisplay).toBe(formatCurrency(74)) // formatCurrency — correct (comma + NBSP)
  })

  it('renders the additional-liters branch with Russian comma decimals (iter-138 fix)', () => {
    const b = createBreakdown(3, 46, 2, 14, 1.0, 74)
    expect(b.additionalDisplay).toBe('2,0 л × 14 ₽ = 28,00 ₽')
    expect(b.coefficientDisplay).toBe('×1,00')
  })
})
