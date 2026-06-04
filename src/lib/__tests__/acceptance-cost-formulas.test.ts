/**
 * Unit tests for acceptance-cost-formulas (Story 44.42-FE) — regression coverage added iter-141.
 *
 * Pure formula formatters + helpers. The box/pallet formula strings already use comma decimals
 * (.toFixed(2).replace('.',',')) — locale-correct. formatCurrency is interpolated (not hardcoded) to
 * avoid pinning the NBSP. roundToTwo float edges (1.005→1) were node-verified, not fabricated.
 */

import { describe, it, expect } from 'vitest'
import { formatCurrency } from '@/lib/utils'
import {
  formatBoxFormula,
  formatPalletFormula,
  createZeroResult,
  roundToTwo,
  formatPerUnitCost,
} from '@/lib/acceptance-cost-formulas'

describe('formatBoxFormula', () => {
  it('renders "volume л × rate ₽/л × coeff = total" with Russian commas', () => {
    expect(formatBoxFormula(5, 1.7, 1.2, 10.2)).toBe(
      `5,00 л × 1,70 ₽/л × 1,20 = ${formatCurrency(10.2)}`
    )
  })
})

describe('formatPalletFormula', () => {
  it('renders "rate ₽ × coeff = total" with Russian commas', () => {
    expect(formatPalletFormula(500, 1, 500)).toBe(`500,00 ₽ × 1,00 = ${formatCurrency(500)}`)
  })
})

describe('createZeroResult', () => {
  it('returns an all-zero result with an em-dash formula', () => {
    expect(createZeroResult()).toEqual({ totalCost: 0, perUnitCost: 0, formula: '—' })
  })
})

describe('roundToTwo', () => {
  it('rounds to 2 decimals (node-verified, incl. float edges)', () => {
    expect(roundToTwo(1.234)).toBe(1.23)
    expect(roundToTwo(1.236)).toBe(1.24)
    expect(roundToTwo(2.675)).toBe(2.68)
    expect(roundToTwo(10)).toBe(10)
    expect(roundToTwo(-1.236)).toBe(-1.24)
    expect(roundToTwo(0)).toBe(0)
  })
  it('exhibits the IEEE-754 1.005 edge (100.4999… → 1, not 1.01)', () => {
    expect(roundToTwo(1.005)).toBe(1)
  })
})

describe('formatPerUnitCost', () => {
  it('renders "<currency>/шт" for a positive unit count', () => {
    expect(formatPerUnitCost(1.02, 10)).toBe(`${formatCurrency(1.02)}/шт`)
  })
  it('returns "—" when unitsPerPackage <= 0', () => {
    expect(formatPerUnitCost(5, 0)).toBe('—')
    expect(formatPerUnitCost(5, -1)).toBe('—')
  })
})
