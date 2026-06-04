/**
 * Unit tests for iso-presets (Story 61.6-FE) — coverage added iter-161.
 *
 * Calendar-month / quarter → ISO-week-range conversion (Thursday-rule membership + buildPeriodRange).
 * Month is 0-indexed (Jan=0). All range outputs node-verified — NOTE the original bare-todo skeleton
 * (src/lib/__tests__/period-presets.test.ts, misplaced) spec'd Feb as W05:W09; the ACTUAL output is
 * W06:W09 (W05's Thursday 2026-01-29 falls in January). Verify, don't trust unverified todo names.
 */

import { describe, it, expect } from 'vitest'
import {
  getWeeksInCalendarMonth,
  getWeeksInQuarter,
  monthToIsoWeekRange,
  quarterToIsoWeekRange,
  getMoMPreset,
  getQoQPreset,
} from '../iso-presets'

describe('getWeeksInCalendarMonth (Thursday-rule, month 0-indexed)', () => {
  it('returns the weeks whose Thursday falls in the month', () => {
    const jan = getWeeksInCalendarMonth(2026, 0)
    expect(jan).toEqual(['2026-W01', '2026-W02', '2026-W03', '2026-W04', '2026-W05'])
  })
  it('excludes a boundary week whose Thursday belongs to the prior month', () => {
    // W05 (Thu 2026-01-29) is January's, NOT February's
    expect(getWeeksInCalendarMonth(2026, 1)).toEqual([
      '2026-W06',
      '2026-W07',
      '2026-W08',
      '2026-W09',
    ])
  })
})

describe('monthToIsoWeekRange (node-verified)', () => {
  it('converts a month (0-indexed) to its ISO-week range', () => {
    expect(monthToIsoWeekRange(2026, 0)).toBe('2026-W01:W05') // January
    expect(monthToIsoWeekRange(2026, 1)).toBe('2026-W06:W09') // February (actual, not the todo's W05:W09)
    expect(monthToIsoWeekRange(2025, 11)).toBe('2025-W49:W52') // December 2025
  })
})

describe('getWeeksInQuarter / quarterToIsoWeekRange', () => {
  it('unions the quarter months into a sorted week list', () => {
    expect(getWeeksInQuarter(2026, 1)).toHaveLength(13) // Q1 2026 = W01..W13
  })
  it('converts a quarter to its ISO-week range', () => {
    expect(quarterToIsoWeekRange(2026, 1)).toBe('2026-W01:W13')
  })
  it('throws on an out-of-range quarter', () => {
    expect(() => getWeeksInQuarter(2026, 0)).toThrow(/Invalid quarter/)
    expect(() => getWeeksInQuarter(2026, 5)).toThrow(/Invalid quarter/)
  })
})

describe('MoM / QoQ presets (today-dependent → structure-asserted)', () => {
  it('getMoMPreset returns two distinct period strings', () => {
    const { period1, period2 } = getMoMPreset()
    expect(period1).toBeTruthy()
    expect(period2).toBeTruthy()
    expect(period1).not.toBe(period2)
  })
  it('getQoQPreset returns two distinct period strings', () => {
    const { period1, period2 } = getQoQPreset()
    expect(period1).not.toBe(period2)
  })
})
