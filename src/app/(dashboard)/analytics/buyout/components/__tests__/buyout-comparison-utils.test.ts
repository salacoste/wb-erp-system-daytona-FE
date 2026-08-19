/**
 * Unit tests for buyout comparison utils
 * Story 127.4-FE: WoW comparison for buyout analytics
 */

import { describe, it, expect } from 'vitest'
import {
  calculatePreviousPeriod,
  calculateBuyoutDelta,
  formatDelta,
  getDeltaColor,
  isInvertedMetric,
} from '../buyout-comparison-utils'
import type { BuyoutDelta } from '../buyout-comparison-utils'

describe('calculatePreviousPeriod', () => {
  it('shifts a 30-day range back by 30 days', () => {
    const result = calculatePreviousPeriod('2025-12-01', '2025-12-30')
    expect(result).toEqual({ prevFrom: '2025-11-01', prevTo: '2025-11-30' })
  })

  it('shifts a single-day range back by 1 day', () => {
    const result = calculatePreviousPeriod('2025-06-15', '2025-06-15')
    expect(result).toEqual({ prevFrom: '2025-06-14', prevTo: '2025-06-14' })
  })

  it('handles year boundary', () => {
    const result = calculatePreviousPeriod('2026-01-05', '2026-01-05')
    expect(result).toEqual({ prevFrom: '2026-01-04', prevTo: '2026-01-04' })
  })
})

describe('calculateBuyoutDelta', () => {
  it('returns null when current is null', () => {
    expect(calculateBuyoutDelta(null, 50)).toBeNull()
  })

  it('returns null when previous is null', () => {
    expect(calculateBuyoutDelta(50, null)).toBeNull()
  })

  it('returns neutral when previous is 0', () => {
    expect(calculateBuyoutDelta(50, 0)).toEqual({ percent: 0, direction: 'neutral' })
  })

  it('returns up direction for increase', () => {
    const result = calculateBuyoutDelta(75, 50)
    expect(result?.direction).toBe('up')
    expect(result?.percent).toBe(50)
  })

  it('returns down direction for decrease', () => {
    const result = calculateBuyoutDelta(50, 75)
    expect(result?.direction).toBe('down')
    expect(result?.percent).toBeCloseTo(-33.33, 1)
  })

  it('returns neutral for equal values', () => {
    expect(calculateBuyoutDelta(50, 50)).toEqual({ percent: 0, direction: 'neutral' })
  })
})

describe('formatDelta', () => {
  it('formats up direction with ▲', () => {
    const delta: BuyoutDelta = { percent: 25.5, direction: 'up' }
    expect(formatDelta(delta)).toBe('▲ 25,5%')
  })

  it('formats down direction with ▼', () => {
    const delta: BuyoutDelta = { percent: -10.3, direction: 'down' }
    expect(formatDelta(delta)).toBe('▼ 10,3%')
  })

  it('formats neutral direction with —', () => {
    const delta: BuyoutDelta = { percent: 0, direction: 'neutral' }
    expect(formatDelta(delta)).toBe('— 0,0%')
  })
})

describe('getDeltaColor', () => {
  it('returns muted for neutral', () => {
    expect(getDeltaColor('neutral', false)).toBe('text-muted-foreground')
  })

  it('returns financial-positive for up on normal metric', () => {
    expect(getDeltaColor('up', false)).toBe('text-financial-positive')
  })

  it('returns financial-negative for down on normal metric', () => {
    expect(getDeltaColor('down', false)).toBe('text-financial-negative')
  })

  it('flips color for inverted metric (return rate)', () => {
    expect(getDeltaColor('up', true)).toBe('text-financial-negative')
    expect(getDeltaColor('down', true)).toBe('text-financial-positive')
  })
})

describe('isInvertedMetric', () => {
  it('returns true for return rate', () => {
    expect(isInvertedMetric('overallReturnRatePct')).toBe(true)
  })

  it('returns true for returns count', () => {
    expect(isInvertedMetric('totalReturnsCount')).toBe(true)
  })

  it('returns false for buyout rate', () => {
    expect(isInvertedMetric('overallBuyoutRatePct')).toBe(false)
  })

  it('returns false for sales count', () => {
    expect(isInvertedMetric('totalSalesCount')).toBe(false)
  })
})
