/**
 * Tests for comparison-delta-utils — Story 127.3-FE
 */

import { describe, it, expect } from 'vitest'
import {
  calculatePreviousPeriod,
  calculateAdDelta,
  calculateAdvertisingDeltas,
  formatAdDelta,
  isInvertedAdMetric,
  getAdDeltaColor,
} from '../comparison-delta-utils'
import type { AdvertisingSummary } from '@/types/advertising-analytics'

function makeSummary(overrides: Partial<AdvertisingSummary> = {}): AdvertisingSummary {
  return {
    total_spend: 1000,
    total_sales: 5000,
    total_revenue: 3000,
    total_profit: 1500,
    overall_roas: 3.0,
    overall_roi: 50,
    avg_ctr: 2.5,
    avg_conversion_rate: 5.0,
    total_organic_sales: 2000,
    avg_organic_contribution: 40,
    ...overrides,
  }
}

describe('calculatePreviousPeriod', () => {
  it('shifts a 14-day range back by 14 days', () => {
    const result = calculatePreviousPeriod('2025-01-15', '2025-01-28')
    expect(result.from).toBe('2025-01-01')
    expect(result.to).toBe('2025-01-14')
  })

  it('handles a single-day range', () => {
    const result = calculatePreviousPeriod('2025-01-15', '2025-01-15')
    expect(result.from).toBe('2025-01-14')
    expect(result.to).toBe('2025-01-14')
  })

  it('crosses month boundaries', () => {
    const result = calculatePreviousPeriod('2025-02-05', '2025-02-10')
    expect(result.from).toBe('2025-01-30')
    expect(result.to).toBe('2025-02-04')
  })
})

describe('calculateAdDelta', () => {
  it('calculates positive percent change', () => {
    const delta = calculateAdDelta(150, 100)
    expect(delta.direction).toBe('up')
    expect(delta.percent).toBe(50)
  })

  it('calculates negative percent change', () => {
    const delta = calculateAdDelta(80, 100)
    expect(delta.direction).toBe('down')
    expect(delta.percent).toBe(-20)
  })

  it('returns neutral when current equals previous', () => {
    const delta = calculateAdDelta(100, 100)
    expect(delta.direction).toBe('neutral')
    expect(delta.percent).toBe(0)
  })

  it('returns neutral when previous is zero (avoid division by zero)', () => {
    const delta = calculateAdDelta(100, 0)
    expect(delta.direction).toBe('neutral')
  })
})

describe('calculateAdvertisingDeltas', () => {
  it('returns null when current is undefined', () => {
    expect(calculateAdvertisingDeltas(undefined, makeSummary())).toBeNull()
  })

  it('returns null when previous is undefined', () => {
    expect(calculateAdvertisingDeltas(makeSummary(), undefined)).toBeNull()
  })

  it('computes deltas for all comparable metrics', () => {
    const current = makeSummary({
      total_spend: 1200,
      total_revenue: 3600,
      overall_roas: 3.6,
      total_sales: 6000,
      avg_ctr: 3.0,
    })
    const previous = makeSummary({
      total_spend: 1000,
      total_revenue: 3000,
      overall_roas: 3.0,
      total_sales: 5000,
      avg_ctr: 2.5,
    })
    const deltas = calculateAdvertisingDeltas(current, previous)
    expect(deltas).not.toBeNull()
    expect(deltas!.total_spend?.direction).toBe('up')
    expect(deltas!.total_spend?.percent).toBe(20)
    expect(deltas!.total_revenue?.direction).toBe('up')
    expect(deltas!.overall_roas?.direction).toBe('up')
    expect(deltas!.total_sales?.direction).toBe('up')
    expect(deltas!.avg_ctr?.direction).toBe('up')
  })

  it('handles null ROAS values as 0', () => {
    const current = makeSummary({ overall_roas: null })
    const previous = makeSummary({ overall_roas: 3.0 })
    const deltas = calculateAdvertisingDeltas(current, previous)
    expect(deltas!.overall_roas?.direction).toBe('down')
  })
})

describe('formatAdDelta', () => {
  it('formats up direction with arrow', () => {
    const result = formatAdDelta({ percent: 25.5, direction: 'up' })
    expect(result).toContain('↑')
    expect(result).toMatch(/25,5%/)
  })

  it('formats down direction with arrow', () => {
    const result = formatAdDelta({ percent: -10.3, direction: 'down' })
    expect(result).toContain('↓')
    expect(result).toMatch(/10,3%/)
  })

  it('formats neutral with dash', () => {
    const result = formatAdDelta({ percent: 0, direction: 'neutral' })
    expect(result).toContain('—')
  })
})

describe('isInvertedAdMetric', () => {
  it('marks total_spend as inverted', () => {
    expect(isInvertedAdMetric('total_spend')).toBe(true)
  })

  it('does not invert revenue', () => {
    expect(isInvertedAdMetric('total_revenue')).toBe(false)
  })
})

describe('getAdDeltaColor', () => {
  it('returns green for up on non-inverted metric', () => {
    expect(getAdDeltaColor('up', false)).toBe('text-status-success') // Story 170.1 token pin
  })

  it('returns red for down on non-inverted metric', () => {
    expect(getAdDeltaColor('down', false)).toBe('text-status-error') // Story 170.1 token pin
  })

  it('returns red for up on inverted metric (spend up = bad)', () => {
    expect(getAdDeltaColor('up', true)).toBe('text-status-error') // Story 170.1 token pin
  })

  it('returns green for down on inverted metric (spend down = good)', () => {
    expect(getAdDeltaColor('down', true)).toBe('text-status-success') // Story 170.1 token pin
  })

  it('returns muted for neutral', () => {
    expect(getAdDeltaColor('neutral', false)).toBe('text-muted-foreground')
  })
})
