/**
 * Unit Tests for Duration Formatting Utilities
 * Covers: pluralizeDays, calculateDurationMinutes, formatDuration, formatDurationCompact
 */

import { describe, it, expect } from 'vitest'
import {
  pluralizeDays,
  calculateDurationMinutes,
  formatDuration,
  formatDurationCompact,
} from '../duration-utils'

// =============================================================================
// pluralizeDays
// =============================================================================

describe('pluralizeDays', () => {
  it('returns "день" for 1', () => {
    expect(pluralizeDays(1)).toBe('день')
  })

  it('returns "день" for 21', () => {
    expect(pluralizeDays(21)).toBe('день')
  })

  it('returns "день" for 31', () => {
    expect(pluralizeDays(31)).toBe('день')
  })

  it('returns "дня" for 2', () => {
    expect(pluralizeDays(2)).toBe('дня')
  })

  it('returns "дня" for 3', () => {
    expect(pluralizeDays(3)).toBe('дня')
  })

  it('returns "дня" for 4', () => {
    expect(pluralizeDays(4)).toBe('дня')
  })

  it('returns "дня" for 22', () => {
    expect(pluralizeDays(22)).toBe('дня')
  })

  it('returns "дней" for 5', () => {
    expect(pluralizeDays(5)).toBe('дней')
  })

  it('returns "дней" for 10', () => {
    expect(pluralizeDays(10)).toBe('дней')
  })

  it('returns "дней" for 11-14 (special rule)', () => {
    expect(pluralizeDays(11)).toBe('дней')
    expect(pluralizeDays(12)).toBe('дней')
    expect(pluralizeDays(13)).toBe('дней')
    expect(pluralizeDays(14)).toBe('дней')
  })

  it('returns "дней" for 20', () => {
    expect(pluralizeDays(20)).toBe('дней')
  })

  it('returns "дней" for 25-30', () => {
    expect(pluralizeDays(25)).toBe('дней')
    expect(pluralizeDays(30)).toBe('дней')
  })

  it('handles negative numbers using absolute value', () => {
    expect(pluralizeDays(-1)).toBe('день')
    expect(pluralizeDays(-2)).toBe('дня')
    expect(pluralizeDays(-5)).toBe('дней')
  })

  it('returns "дней" for 0', () => {
    expect(pluralizeDays(0)).toBe('дней')
  })
})

// =============================================================================
// calculateDurationMinutes
// =============================================================================

describe('calculateDurationMinutes', () => {
  it('calculates minutes between two Date objects', () => {
    const from = new Date('2025-01-01T10:00:00Z')
    const to = new Date('2025-01-01T10:30:00Z')
    expect(calculateDurationMinutes(from, to)).toBe(30)
  })

  it('calculates minutes between two ISO strings', () => {
    expect(calculateDurationMinutes('2025-01-01T10:00:00Z', '2025-01-01T11:00:00Z')).toBe(60)
  })

  it('calculates across days', () => {
    expect(calculateDurationMinutes('2025-01-01T10:00:00Z', '2025-01-02T10:00:00Z')).toBe(1440)
  })

  it('returns negative for reversed order', () => {
    expect(calculateDurationMinutes('2025-01-02T10:00:00Z', '2025-01-01T10:00:00Z')).toBe(-1440)
  })

  it('returns 0 for same time', () => {
    const d = new Date('2025-01-01T10:00:00Z')
    expect(calculateDurationMinutes(d, d)).toBe(0)
  })

  it('rounds to nearest minute', () => {
    // 90 seconds = 1.5 minutes, rounds to 2
    const from = new Date('2025-01-01T10:00:00Z')
    const to = new Date('2025-01-01T10:01:30Z')
    expect(calculateDurationMinutes(from, to)).toBe(2)
  })

  it('handles mixed Date and string inputs', () => {
    const from = new Date('2025-01-01T10:00:00Z')
    expect(calculateDurationMinutes(from, '2025-01-01T10:15:00Z')).toBe(15)
  })
})

// =============================================================================
// formatDuration
// =============================================================================

describe('formatDuration', () => {
  it('returns em-dash for null', () => {
    expect(formatDuration(null)).toBe('—')
  })

  it('returns em-dash for undefined', () => {
    expect(formatDuration(undefined)).toBe('—')
  })

  it('returns em-dash for NaN', () => {
    expect(formatDuration(Number.NaN)).toBe('—')
  })

  it('returns em-dash for Infinity', () => {
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe('—')
  })

  it('returns "< 1 мин" for 0', () => {
    expect(formatDuration(0)).toBe('< 1 мин')
  })

  it('returns "< 1 мин" for fractional minutes', () => {
    expect(formatDuration(0.5)).toBe('< 1 мин')
  })

  it('formats single minutes', () => {
    expect(formatDuration(1)).toBe('1 мин')
  })

  it('formats 30 minutes', () => {
    expect(formatDuration(30)).toBe('30 мин')
  })

  it('formats 59 minutes', () => {
    expect(formatDuration(59)).toBe('59 мин')
  })

  it('formats 1 hour exactly', () => {
    expect(formatDuration(60)).toBe('1 ч')
  })

  it('formats 1 hour 30 minutes', () => {
    expect(formatDuration(90)).toBe('1 ч 30 мин')
  })

  it('formats 23 hours 59 minutes', () => {
    expect(formatDuration(23 * 60 + 59)).toBe('23 ч 59 мин')
  })

  it('formats 1 day exactly', () => {
    expect(formatDuration(1440)).toBe('1 д')
  })

  it('formats 1 day 5 hours', () => {
    expect(formatDuration(1440 + 300)).toBe('1 д 5 ч')
  })

  it('formats 6 days 23 hours', () => {
    expect(formatDuration(6 * 1440 + 23 * 60)).toBe('6 д 23 ч')
  })

  it('formats 7 days with pluralization "дней"', () => {
    expect(formatDuration(7 * 1440)).toBe('7 дней')
  })

  it('formats 21 days with "день"', () => {
    expect(formatDuration(21 * 1440)).toBe('21 день')
  })

  it('formats 22 days with "дня"', () => {
    expect(formatDuration(22 * 1440)).toBe('22 дня')
  })
})

// =============================================================================
// formatDurationCompact
// =============================================================================

describe('formatDurationCompact', () => {
  it('returns em-dash for null', () => {
    expect(formatDurationCompact(null)).toBe('—')
  })

  it('returns "<1м" for 0', () => {
    expect(formatDurationCompact(0)).toBe('<1м')
  })

  it('formats minutes compactly', () => {
    expect(formatDurationCompact(30)).toBe('30м')
  })

  it('formats hours compactly', () => {
    expect(formatDurationCompact(120)).toBe('2ч')
  })

  it('formats hours + minutes compactly', () => {
    expect(formatDurationCompact(90)).toBe('1ч30м')
  })

  it('formats days compactly', () => {
    expect(formatDurationCompact(1440)).toBe('1д')
  })

  it('formats days + hours compactly', () => {
    expect(formatDurationCompact(1440 + 120)).toBe('1д2ч')
  })

  it('formats 7+ days as Nд', () => {
    expect(formatDurationCompact(7 * 1440)).toBe('7д')
  })
})
