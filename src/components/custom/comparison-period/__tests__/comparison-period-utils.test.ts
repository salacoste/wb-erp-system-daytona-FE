/**
 * Tests for comparison-period-utils
 * Pure calculation helpers for ISO week period arithmetic.
 */

import { describe, it, expect } from 'vitest'
import {
  calculatePreviousPeriod,
  calculateSamePeriodLastYear,
  formatPeriodDisplay,
  getEffectiveComparisonPeriod,
} from '../comparison-period-utils'

describe('calculatePreviousPeriod', () => {
  it('calculates previous single week', () => {
    const result = calculatePreviousPeriod('2025-W45', '2025-W45')
    expect(result).toEqual({ start: '2025-W44', end: '2025-W44' })
  })

  it('calculates previous multi-week period (3 weeks)', () => {
    const result = calculatePreviousPeriod('2025-W45', '2025-W47')
    expect(result).toEqual({ start: '2025-W42', end: '2025-W44' })
  })

  it('handles year boundary: week 1 wraps to previous year', () => {
    // periodLength=1, prevEnd=1-1=0 → wraps to W52 of prev year, prevStart=52
    const result = calculatePreviousPeriod('2025-W01', '2025-W01')
    expect(result).toEqual({ start: '2024-W52', end: '2024-W52' })
  })

  it('handles multi-week period crossing year boundary', () => {
    // periodLength=2, prevEnd=2-1=1, prevStart=1-2+1=0 → wraps to W52 of prev year
    const result = calculatePreviousPeriod('2025-W02', '2025-W03')
    expect(result).toEqual({ start: '2024-W52', end: '2025-W01' })
  })

  it('handles mid-year period (2 weeks)', () => {
    const result = calculatePreviousPeriod('2025-W20', '2025-W21')
    expect(result).toEqual({ start: '2025-W18', end: '2025-W19' })
  })
})

describe('calculateSamePeriodLastYear', () => {
  it('shifts single week back one year', () => {
    const result = calculateSamePeriodLastYear('2025-W45', '2025-W45')
    expect(result).toEqual({ start: '2024-W45', end: '2024-W45' })
  })

  it('shifts multi-week period back one year', () => {
    const result = calculateSamePeriodLastYear('2025-W10', '2025-W14')
    expect(result).toEqual({ start: '2024-W10', end: '2024-W14' })
  })

  it('handles year boundary in week numbers', () => {
    const result = calculateSamePeriodLastYear('2026-W01', '2026-W02')
    expect(result).toEqual({ start: '2025-W01', end: '2025-W02' })
  })

  it('preserves zero-padded week numbers', () => {
    const result = calculateSamePeriodLastYear('2025-W05', '2025-W09')
    expect(result.start).toBe('2024-W05')
    expect(result.end).toBe('2024-W09')
  })
})

describe('formatPeriodDisplay', () => {
  it('returns single week when start equals end', () => {
    expect(formatPeriodDisplay('2025-W45', '2025-W45')).toBe('2025-W45')
  })

  it('returns range with em dash when start differs from end', () => {
    const result = formatPeriodDisplay('2025-W10', '2025-W15')
    expect(result).toBe('2025-W10 — 2025-W15')
  })

  it('uses em dash (U+2014) as separator, not hyphen', () => {
    const result = formatPeriodDisplay('2025-W01', '2025-W52')
    expect(result).toContain('—')
    expect(result).not.toContain(' - ')
  })
})

describe('getEffectiveComparisonPeriod', () => {
  it('returns previous period for "previous" preset', () => {
    const result = getEffectiveComparisonPeriod('previous', '2025-W10', '2025-W12', '', '')
    expect(result).toEqual({ start: '2025-W07', end: '2025-W09' })
  })

  it('returns same period last year for "same_last_year" preset', () => {
    const result = getEffectiveComparisonPeriod('same_last_year', '2025-W10', '2025-W12', '', '')
    expect(result).toEqual({ start: '2024-W10', end: '2024-W12' })
  })

  it('returns custom values for "custom" preset', () => {
    const result = getEffectiveComparisonPeriod(
      'custom',
      '2025-W10',
      '2025-W12',
      '2025-W05',
      '2025-W08'
    )
    expect(result).toEqual({ start: '2025-W05', end: '2025-W08' })
  })

  it('ignores current period when custom preset is selected', () => {
    const result = getEffectiveComparisonPeriod(
      'custom',
      '2025-W50',
      '2025-W52',
      '2025-W01',
      '2025-W04'
    )
    expect(result).toEqual({ start: '2025-W01', end: '2025-W04' })
  })
})
