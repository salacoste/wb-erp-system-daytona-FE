/**
 * analytics-utils — storage-discrepancy reconciliation (Request #52 thresholds).
 * iter-126: pins isStorageDivergent (canonical 3% tolerance) — replaces a flat >1 ₽ check that
 * over-flagged large-storage cabinets.
 */
import { describe, it, expect } from 'vitest'
import {
  getDiscrepancyStatus,
  calculateStorageDiscrepancy,
  isStorageDivergent,
  sharePercentage,
  sharePercentageGate,
} from '../analytics-utils'

describe('getDiscrepancyStatus — Request #52 bands', () => {
  it('maps percent to ok/<3, warning/3-5, error/>=5', () => {
    expect(getDiscrepancyStatus(0)).toBe('ok')
    expect(getDiscrepancyStatus(2.9)).toBe('ok')
    expect(getDiscrepancyStatus(3)).toBe('warning') // boundary: 3% is NOT "ok"
    expect(getDiscrepancyStatus(4.9)).toBe('warning')
    expect(getDiscrepancyStatus(5)).toBe('error')
    expect(getDiscrepancyStatus(12)).toBe('error')
  })
})

describe('calculateStorageDiscrepancy', () => {
  it('computes amount + percent off the official (weekly) baseline', () => {
    const d = calculateStorageDiscrepancy(1923.34, 1949.52)
    expect(d.amount).toBeCloseTo(26.18, 2)
    expect(d.percent).toBeCloseTo(1.36, 2)
    expect(d.status).toBe('ok')
  })
  it('guards a zero baseline (percent → 0, no div-by-zero)', () => {
    expect(calculateStorageDiscrepancy(0, 500).percent).toBe(0)
  })
})

describe('isStorageDivergent — canonical 3% tolerance (not a flat >1 ₽)', () => {
  it('does NOT flag a within-tolerance diff on large storage (the >1 ₽ false-positive)', () => {
    // 100 000 → 102 000 = 2% diff: old `Math.abs(diff) > 1` flagged it; 2% is within tolerance.
    expect(isStorageDivergent(102_000, 100_000)).toBe(false)
    // symmetric: api BELOW weekly within tolerance (99 vs 100 = 1%) is also not divergent
    expect(isStorageDivergent(99, 100)).toBe(false)
  })
  it('flags a diff at/above 3%', () => {
    expect(isStorageDivergent(103, 100)).toBe(true) // exactly 3% → warning
    expect(isStorageDivergent(110, 100)).toBe(true) // 10% → error
    expect(isStorageDivergent(90, 100)).toBe(true) // 10% under → divergent (abs)
  })
  it('returns false when the weekly report is null or zero (no baseline)', () => {
    expect(isStorageDivergent(5000, null)).toBe(false)
    expect(isStorageDivergent(5000, 0)).toBe(false)
  })
})

describe('sharePercentage — FR-1 contribution shares', () => {
  it('computes part / total × 100', () => {
    expect(sharePercentage(250, 1000)).toBe(25)
    expect(sharePercentage(50, 200)).toBe(25)
  })
  it('returns null when the part is null/undefined (missing value)', () => {
    expect(sharePercentage(null, 1000)).toBeNull()
    expect(sharePercentage(undefined, 1000)).toBeNull()
  })
  it('returns null when the total is null/undefined', () => {
    expect(sharePercentage(250, null)).toBeNull()
    expect(sharePercentage(250, undefined)).toBeNull()
  })
  it('returns null on divide-by-zero (total = 0)', () => {
    expect(sharePercentage(250, 0)).toBeNull()
  })
  it('preserves a negative part (loss-making contribution)', () => {
    expect(sharePercentage(-100, 1000)).toBe(-10)
  })
})

describe('sharePercentageGate — BD-5 review R1 single-row suppression', () => {
  it('nulls the share when fewer than 2 rows (single row is trivially 100 %)', () => {
    expect(sharePercentageGate(100, 1)).toBeNull()
    expect(sharePercentageGate(50, 0)).toBeNull()
    expect(sharePercentageGate(100, null)).toBeNull()
    expect(sharePercentageGate(100, undefined)).toBeNull()
  })
  it('passes the share through when 2+ rows', () => {
    expect(sharePercentageGate(25, 2)).toBe(25)
    expect(sharePercentageGate(100, 5)).toBe(100)
  })
  it('preserves a null share (total===0 case) regardless of rowCount', () => {
    expect(sharePercentageGate(null, 5)).toBeNull()
  })
})
