import { describe, it, expect } from 'vitest'
import {
  parseWeekToNumber,
  calculateWeeksDiff,
  getWeekNWeeksBefore,
  formatPeriodLabel,
  resolveQuickSelectStart,
  QUICK_SELECT_OPTIONS,
} from '../date-range-utils'

describe('date-range-utils', () => {
  describe('QUICK_SELECT_OPTIONS', () => {
    it('has 4 preset options', () => {
      expect(QUICK_SELECT_OPTIONS).toHaveLength(4)
    })

    it('contains expected week counts', () => {
      const values = QUICK_SELECT_OPTIONS.map(o => o.value)
      expect(values).toEqual([4, 8, 12, 13])
    })
  })

  describe('parseWeekToNumber', () => {
    it('converts "2025-W47" to 202547', () => {
      expect(parseWeekToNumber('2025-W47')).toBe(202547)
    })

    it('converts "2024-W01" to 202401', () => {
      expect(parseWeekToNumber('2024-W01')).toBe(202401)
    })

    it('returns 0 for invalid format', () => {
      expect(parseWeekToNumber('invalid')).toBe(0)
    })

    it('returns 0 for empty string', () => {
      expect(parseWeekToNumber('')).toBe(0)
    })

    it('returns 0 for partial match', () => {
      expect(parseWeekToNumber('2025-W')).toBe(0)
    })
  })

  describe('calculateWeeksDiff', () => {
    it('returns 1 for same week', () => {
      expect(calculateWeeksDiff('2025-W47', '2025-W47')).toBe(1)
    })

    it('calculates weeks in same year', () => {
      expect(calculateWeeksDiff('2025-W44', '2025-W47')).toBe(4)
    })

    it('calculates weeks across years', () => {
      expect(calculateWeeksDiff('2024-W50', '2025-W02')).toBe(5)
    })

    it('returns 0 for invalid start', () => {
      expect(calculateWeeksDiff('invalid', '2025-W47')).toBe(0)
    })

    it('returns 0 for invalid end', () => {
      expect(calculateWeeksDiff('2025-W47', 'invalid')).toBe(0)
    })
  })

  describe('getWeekNWeeksBefore', () => {
    it('returns same week for n=1', () => {
      expect(getWeekNWeeksBefore('2025-W47', 1)).toBe('2025-W47')
    })

    it('returns 4 weeks before', () => {
      expect(getWeekNWeeksBefore('2025-W47', 4)).toBe('2025-W44')
    })

    it('handles year boundary backwards', () => {
      const result = getWeekNWeeksBefore('2025-W03', 5)
      expect(result).toBe('2024-W51')
    })

    it('returns input for invalid week format', () => {
      expect(getWeekNWeeksBefore('invalid', 4)).toBe('invalid')
    })

    it('handles single digit week padding', () => {
      const result = getWeekNWeeksBefore('2025-W10', 5)
      expect(result).toBe('2025-W06')
    })
  })

  describe('formatPeriodLabel', () => {
    it('formats single week', () => {
      expect(formatPeriodLabel('2025-W47', '2025-W47')).toBe('W47 (1 неделя)')
    })

    it('formats same-year range', () => {
      expect(formatPeriodLabel('2025-W44', '2025-W47')).toBe('W44 — W47 (4 недели)')
    })

    it('formats cross-year range', () => {
      expect(formatPeriodLabel('2024-W50', '2025-W02')).toBe('2024-W50 — 2025-W2 (5 недель)')
    })

    it('formats 2-4 weeks with correct pluralization', () => {
      expect(formatPeriodLabel('2025-W45', '2025-W47')).toBe('W45 — W47 (3 недели)')
    })

    it('formats 5+ weeks with correct pluralization', () => {
      expect(formatPeriodLabel('2025-W40', '2025-W47')).toBe('W40 — W47 (8 недель)')
    })

    it('returns fallback for invalid inputs', () => {
      expect(formatPeriodLabel('invalid', 'also-invalid')).toBe('invalid — also-invalid')
    })
  })

  describe('resolveQuickSelectStart', () => {
    const weeks = [
      { week: '2025-W48' },
      { week: '2025-W47' },
      { week: '2025-W46' },
      { week: '2025-W45' },
      { week: '2025-W44' },
      { week: '2025-W43' },
    ]

    it('returns exact match when available', () => {
      expect(resolveQuickSelectStart(weeks, 4)).toBe('2025-W45')
    })

    it('returns latest available before ideal when not exact', () => {
      const partialWeeks = [
        { week: '2025-W48' },
        { week: '2025-W47' },
        { week: '2025-W45' },
        { week: '2025-W43' },
      ]
      const result = resolveQuickSelectStart(partialWeeks, 4)
      expect(result).toBe('2025-W45')
    })

    it('returns earliest week when all are after ideal', () => {
      const shortList = [{ week: '2025-W48' }, { week: '2025-W47' }]
      const result = resolveQuickSelectStart(shortList, 8)
      expect(result).toBe('2025-W47')
    })
  })
})
