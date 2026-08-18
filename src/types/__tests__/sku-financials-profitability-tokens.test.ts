import { describe, it, expect } from 'vitest'
import { PROFITABILITY_COLORS, PROFITABILITY_HEX } from '../sku-financials/core'

// 168.11: single token set — sku badges (PROFITABILITY_COLORS) and the 168.9 legend
// (SkuTableHeaders) share the same semantic tokens; /15-chip idiom (168.8 precedent).
describe('PROFITABILITY_COLORS — /15-chip token pins (168.11)', () => {
  it.each([
    ['excellent', 'bg-financial-positive/15 text-financial-positive'],
    ['good', 'bg-status-information/15 text-status-information'],
    ['warning', 'bg-status-warning/15 text-status-warning'],
    ['critical', 'bg-status-error/15 text-status-error'],
    ['loss', 'bg-financial-negative/15 text-financial-negative'],
    ['unknown', 'bg-muted text-muted-foreground'],
  ] as const)('%s → exact chip classes', (status, expected) => {
    expect(PROFITABILITY_COLORS[status]).toBe(expected)
  })
})

describe('PROFITABILITY_HEX — chart-safe var pins (168.11)', () => {
  it.each([
    ['excellent', 'var(--color-financial-positive)'],
    ['good', 'var(--color-status-information)'],
    ['warning', 'var(--color-status-warning)'],
    ['critical', 'var(--color-status-error)'],
    ['loss', 'var(--color-financial-negative)'],
    ['unknown', 'var(--color-muted-foreground)'],
  ] as const)('%s → exact CSS var', (status, expected) => {
    expect(PROFITABILITY_HEX[status]).toBe(expected)
  })

  it('no raw hex remains in the profitability token maps', () => {
    for (const v of [...Object.values(PROFITABILITY_COLORS), ...Object.values(PROFITABILITY_HEX)]) {
      expect(v).not.toMatch(/#[0-9A-Fa-f]{6}/)
    }
  })
})
