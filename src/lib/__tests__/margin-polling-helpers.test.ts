/**
 * Unit tests for margin-polling-helpers (Story 4.8) — regression coverage added iter-147.
 *
 * estimateCalculationTime is pure (5s/week, clamped 5–60s). getPollingStrategy depends on
 * calculateAffectedWeeks (date-dependent): bulk is deterministic; far-past → historical strategy;
 * today → current-week strategy (tested against documented behavior, confirmed by the run).
 */

import { describe, it, expect } from 'vitest'
import { estimateCalculationTime, getPollingStrategy } from '@/lib/margin-polling-helpers'

describe('estimateCalculationTime (5s/week, clamp 5–60s)', () => {
  it('returns the 5s minimum for an empty list', () => {
    expect(estimateCalculationTime([])).toBe(5000)
  })
  it('scales at 5s per week within range', () => {
    expect(estimateCalculationTime(['w'])).toBe(5000) // 1×5 = 5s (== min)
    expect(estimateCalculationTime(['a', 'b', 'c'])).toBe(15000) // 3×5 = 15s
    expect(estimateCalculationTime(Array(11).fill('w'))).toBe(55000) // 11×5 = 55s
  })
  it('clamps to the 60s maximum', () => {
    expect(estimateCalculationTime(Array(12).fill('w'))).toBe(60000) // 12×5 = 60s
    expect(estimateCalculationTime(Array(50).fill('w'))).toBe(60000) // clamped
  })
})

describe('getPollingStrategy', () => {
  it('uses the bulk strategy for any bulk operation (5s / 20 attempts)', () => {
    expect(getPollingStrategy('2025-01-01', true)).toEqual({
      interval: 5000,
      maxAttempts: 20,
      estimatedTime: 60000,
    })
  })

  it('uses the historical strategy for a far-past valid_from (>1 week affected)', () => {
    const result = getPollingStrategy('2020-01-01', false)
    expect(result.interval).toBe(5000)
    expect(result.maxAttempts).toBe(10)
    expect(result.estimatedTime).toBe(60000) // hundreds of weeks → clamped to max
  })

  it('uses a non-bulk strategy for today (10 attempts; interval 3s current / 5s if a boundary day spans 2 weeks)', () => {
    // Day-invariant assertion: both non-bulk branches share maxAttempts 10; interval is 3000
    // (current single week) or 5000 (historical) — avoids flakiness on week-boundary days where
    // calculateAffectedWeeks(today) may span 2 weeks.
    const result = getPollingStrategy(new Date(), false)
    expect(result.maxAttempts).toBe(10)
    expect([3000, 5000]).toContain(result.interval)
  })
})
