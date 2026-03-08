import { describe, it, expect } from 'vitest'
import {
  calculatePreviousPeriod,
  calculateFunnelDelta,
  formatDelta,
  getDeltaColor,
  isInvertedMetric,
} from '../funnel-comparison-utils'

describe('calculatePreviousPeriod', () => {
  it('shifts 30-day range back correctly', () => {
    const result = calculatePreviousPeriod('2026-02-07', '2026-03-08')
    expect(result.prevFrom).toBe('2026-01-08')
    expect(result.prevTo).toBe('2026-02-06')
  })

  it('handles single-day range', () => {
    const result = calculatePreviousPeriod('2026-03-08', '2026-03-08')
    expect(result.prevFrom).toBe('2026-03-07')
    expect(result.prevTo).toBe('2026-03-07')
  })

  it('handles 7-day range', () => {
    const result = calculatePreviousPeriod('2026-03-01', '2026-03-07')
    expect(result.prevFrom).toBe('2026-02-22')
    expect(result.prevTo).toBe('2026-02-28')
  })
})

describe('calculateFunnelDelta', () => {
  it('returns up direction for increase', () => {
    const delta = calculateFunnelDelta(125, 100)
    expect(delta.direction).toBe('up')
    expect(delta.percent).toBeCloseTo(25)
  })

  it('returns down direction for decrease', () => {
    const delta = calculateFunnelDelta(80, 100)
    expect(delta.direction).toBe('down')
    expect(delta.percent).toBeCloseTo(-20)
  })

  it('returns neutral for same values', () => {
    const delta = calculateFunnelDelta(100, 100)
    expect(delta.direction).toBe('neutral')
    expect(delta.percent).toBe(0)
  })

  it('returns neutral when previous is 0 (avoids division by zero)', () => {
    const delta = calculateFunnelDelta(50, 0)
    expect(delta.direction).toBe('neutral')
    expect(delta.percent).toBe(0)
  })

  it('handles both values being 0', () => {
    const delta = calculateFunnelDelta(0, 0)
    expect(delta.direction).toBe('neutral')
    expect(delta.percent).toBe(0)
  })
})

describe('formatDelta', () => {
  it('formats up direction with arrow', () => {
    expect(formatDelta({ percent: 25, direction: 'up' })).toBe('↑ 25,0%')
  })

  it('formats down direction with arrow (absolute value)', () => {
    expect(formatDelta({ percent: -5.7, direction: 'down' })).toBe('↓ 5,7%')
  })

  it('formats neutral with dash', () => {
    expect(formatDelta({ percent: 0, direction: 'neutral' })).toBe('— 0,0%')
  })
})

describe('getDeltaColor', () => {
  it('returns green for up (normal metric)', () => {
    expect(getDeltaColor('up', false)).toBe('text-green-600')
  })

  it('returns red for down (normal metric)', () => {
    expect(getDeltaColor('down', false)).toBe('text-red-600')
  })

  it('returns red for up (inverted metric like cancelCount)', () => {
    expect(getDeltaColor('up', true)).toBe('text-red-600')
  })

  it('returns green for down (inverted metric like cancelCount)', () => {
    expect(getDeltaColor('down', true)).toBe('text-green-600')
  })

  it('returns muted for neutral regardless of inversion', () => {
    expect(getDeltaColor('neutral', false)).toBe('text-muted-foreground')
    expect(getDeltaColor('neutral', true)).toBe('text-muted-foreground')
  })
})

describe('isInvertedMetric', () => {
  it('returns true for cancelCount', () => {
    expect(isInvertedMetric('cancelCount')).toBe(true)
  })

  it('returns false for normal metrics', () => {
    expect(isInvertedMetric('openCardCount')).toBe(false)
    expect(isInvertedMetric('buyoutCount')).toBe(false)
    expect(isInvertedMetric('ordersCount')).toBe(false)
  })
})
