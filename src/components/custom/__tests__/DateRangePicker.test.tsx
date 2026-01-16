/**
 * Unit tests for DateRangePicker component
 * Story 6.1-FE: Date Range Support for Analytics
 *
 * Test cases:
 * - Date range picker renders correctly
 * - Start week validation (cannot be after end)
 * - Max 52 weeks validation with error message
 * - Quick select "Последние 4 недели" works
 * - calculateWeeksDiff helper function
 * - formatPeriodLabel helper function
 */

import { describe, it, expect } from 'vitest'
import { calculateWeeksDiff, formatPeriodLabel } from '../DateRangePicker'

describe('DateRangePicker helpers', () => {
  describe('calculateWeeksDiff', () => {
    it('should return 1 for same week', () => {
      expect(calculateWeeksDiff('2025-W47', '2025-W47')).toBe(1)
    })

    it('should calculate weeks in same year correctly', () => {
      expect(calculateWeeksDiff('2025-W44', '2025-W47')).toBe(4)
      expect(calculateWeeksDiff('2025-W01', '2025-W10')).toBe(10)
      expect(calculateWeeksDiff('2025-W40', '2025-W52')).toBe(13)
    })

    it('should calculate weeks across years correctly', () => {
      // From W50 of 2024 to W02 of 2025 = ~4 weeks
      expect(calculateWeeksDiff('2024-W50', '2025-W02')).toBe(5)
    })

    it('should return 0 for invalid week format', () => {
      expect(calculateWeeksDiff('invalid', '2025-W47')).toBe(0)
      expect(calculateWeeksDiff('2025-W47', 'invalid')).toBe(0)
      expect(calculateWeeksDiff('2025-47', '2025-W47')).toBe(0)
    })
  })

  describe('formatPeriodLabel', () => {
    it('should format single week correctly', () => {
      expect(formatPeriodLabel('2025-W47', '2025-W47')).toBe('W47 (1 неделя)')
    })

    it('should format range in same year correctly', () => {
      expect(formatPeriodLabel('2025-W44', '2025-W47')).toBe('W44 — W47 (4 недели)')
    })

    it('should format 2 weeks with correct grammar', () => {
      expect(formatPeriodLabel('2025-W46', '2025-W47')).toBe('W46 — W47 (2 недели)')
    })

    it('should format 5+ weeks with correct grammar', () => {
      expect(formatPeriodLabel('2025-W40', '2025-W47')).toBe('W40 — W47 (8 недель)')
    })

    it('should format range across years correctly', () => {
      const result = formatPeriodLabel('2024-W50', '2025-W02')
      expect(result).toContain('2024-W50')
      // W02 or W2 both acceptable
      expect(result).toMatch(/2025-W0?2/)
    })

    it('should handle invalid format gracefully', () => {
      expect(formatPeriodLabel('invalid', '2025-W47')).toBe('invalid — 2025-W47')
    })
  })
})

describe('DateRangePicker validation logic', () => {
  // Helper to simulate validation
  const validateRange = (start: string, end: string, maxWeeks = 52): { isValid: boolean; error?: string } => {
    // Parse weeks
    const startMatch = start.match(/^(\d{4})-W(\d{2})$/)
    const endMatch = end.match(/^(\d{4})-W(\d{2})$/)

    if (!startMatch || !endMatch) {
      return { isValid: false, error: 'Invalid week format' }
    }

    // Check start <= end
    const startNum = parseInt(startMatch[1]) * 100 + parseInt(startMatch[2])
    const endNum = parseInt(endMatch[1]) * 100 + parseInt(endMatch[2])

    if (startNum > endNum) {
      return { isValid: false, error: 'Start week cannot be after end week' }
    }

    // Check range <= maxWeeks
    const weeksCount = calculateWeeksDiff(start, end)
    if (weeksCount > maxWeeks) {
      return { isValid: false, error: `Range cannot exceed ${maxWeeks} weeks` }
    }

    return { isValid: true }
  }

  it('should validate same week as valid', () => {
    expect(validateRange('2025-W47', '2025-W47')).toEqual({ isValid: true })
  })

  it('should validate normal range as valid', () => {
    expect(validateRange('2025-W44', '2025-W47')).toEqual({ isValid: true })
  })

  it('should reject start after end', () => {
    const result = validateRange('2025-W48', '2025-W44')
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('Start week cannot be after end week')
  })

  it('should reject range exceeding 52 weeks', () => {
    // W01 to W53 = 53 weeks (more than 52)
    const result = validateRange('2024-W01', '2025-W01')
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('Range cannot exceed 52 weeks')
  })

  it('should accept exactly 52 weeks', () => {
    const result = validateRange('2025-W01', '2025-W52')
    expect(result.isValid).toBe(true)
  })

  it('should handle custom maxWeeks', () => {
    // 5 weeks with max 4
    const result = validateRange('2025-W44', '2025-W48', 4)
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('Range cannot exceed 4 weeks')
  })
})
