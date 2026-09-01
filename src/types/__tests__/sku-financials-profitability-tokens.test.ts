import { describe, it, expect } from 'vitest'
import { PROFITABILITY_COLORS } from '../sku-financials/core'

// 168.11: semantic /15-chip tokens; tinted backgrounds use the readable foreground.
describe('PROFITABILITY_COLORS — /15-chip token pins (168.11)', () => {
  it.each([
    ['excellent', 'bg-financial-positive/15 text-foreground'],
    ['good', 'bg-status-information/15 text-foreground'],
    ['warning', 'bg-status-warning/15 text-foreground'],
    ['critical', 'bg-status-error/15 text-foreground'],
    ['loss', 'bg-financial-negative/15 text-foreground'],
    ['unknown', 'bg-muted text-muted-foreground'],
  ] as const)('%s → exact chip classes', (status, expected) => {
    expect(PROFITABILITY_COLORS[status]).toBe(expected)
  })

  it('no raw hex remains in the profitability token map', () => {
    for (const v of Object.values(PROFITABILITY_COLORS)) {
      expect(v).not.toMatch(/#[0-9A-Fa-f]{6}/)
    }
  })
})
