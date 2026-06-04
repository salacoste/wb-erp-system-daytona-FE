/**
 * Unit tests for iso-week/core (Epic 61 canonical ISO-week module) — coverage added iter-154.
 *
 * date-fns-backed. Uses round-trip assertions (parse→Date→format) to stay TZ-robust, local-Date
 * constructors (not string-parse), and node-verified concrete values (getIsoWeeksInYear, Jan-15-2026→W03).
 */

import { describe, it, expect } from 'vitest'
import {
  getCurrentIsoWeek,
  formatIsoWeekString,
  parseIsoWeek,
  dateToIsoWeek,
  getIsoWeeksInYear,
} from '@/lib/iso-week/core'

describe('formatIsoWeekString', () => {
  it('zero-pads the week to 2 digits', () => {
    expect(formatIsoWeekString(2026, 5)).toBe('2026-W05')
    expect(formatIsoWeekString(2026, 53)).toBe('2026-W53')
  })
})

describe('getIsoWeeksInYear (node-verified)', () => {
  it('returns 53 for long ISO years and 52 otherwise', () => {
    expect(getIsoWeeksInYear(2026)).toBe(53)
    expect(getIsoWeeksInYear(2020)).toBe(53)
    expect(getIsoWeeksInYear(2025)).toBe(52)
  })
})

describe('getCurrentIsoWeek', () => {
  it('uses the provided date (local Jan 15 2026 → W03)', () => {
    expect(getCurrentIsoWeek({ date: new Date(2026, 0, 15) })).toBe('2026-W03')
  })
  it('defaults to today and returns a well-formed week string', () => {
    expect(getCurrentIsoWeek()).toMatch(/^\d{4}-W\d{2}$/)
  })
})

describe('parseIsoWeek + dateToIsoWeek round-trip (TZ-robust)', () => {
  it('parse(week) → Date → dateToIsoWeek round-trips', () => {
    for (const w of ['2026-W03', '2026-W10', '2025-W52']) {
      expect(dateToIsoWeek(parseIsoWeek(w))).toBe(w)
    }
  })
  it('parseIsoWeek returns the Monday of the week (getCurrentIsoWeek agrees)', () => {
    expect(getCurrentIsoWeek({ date: parseIsoWeek('2026-W10') })).toBe('2026-W10')
  })
  it('accepts W53 for a 53-week year', () => {
    expect(() => parseIsoWeek('2026-W53')).not.toThrow()
  })
})

describe('parseIsoWeek validation', () => {
  it('throws on malformed format', () => {
    expect(() => parseIsoWeek('nope')).toThrow(/Invalid ISO week format/)
  })
  it('throws on out-of-range week number', () => {
    expect(() => parseIsoWeek('2026-W00')).toThrow(/Must be 1-53/)
    expect(() => parseIsoWeek('2026-W54')).toThrow(/Must be 1-53/)
  })
  it('throws when W53 requested for a 52-week year', () => {
    expect(() => parseIsoWeek('2025-W53')).toThrow(/only 52 weeks/)
  })
})

describe('dateToIsoWeek', () => {
  it('converts a local Date to its ISO week', () => {
    expect(dateToIsoWeek(new Date(2026, 0, 15))).toBe('2026-W03')
  })
  it('throws on an invalid date', () => {
    expect(() => dateToIsoWeek('not-a-date')).toThrow(/Invalid date/)
  })
})
