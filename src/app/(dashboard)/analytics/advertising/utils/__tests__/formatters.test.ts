/**
 * Unit Tests for Formatting Utilities
 *
 * Epic 37 Story 37.3: Aggregate Metrics Display
 * Tests Russian locale formatting for currency, percentages, and ROAS
 *
 * @see docs/stories/epic-37/story-37.3-aggregate-metrics-display.BMAD.md
 */

import { formatCurrency, formatRevenueWithPercent, formatROAS } from '../formatters'

describe('Formatters', () => {
  describe('formatCurrency', () => {
    it('should format positive values with Russian locale', () => {
      expect(formatCurrency(35570)).toBe('35\u00A0570\u00A0₽')
    })

    it('should format zero values', () => {
      expect(formatCurrency(0)).toBe('0\u00A0₽')
    })

    it('should format negative values', () => {
      expect(formatCurrency(-1500)).toBe('-1\u00A0500\u00A0₽')
    })

    it('should format large numbers without abbreviation (PO Decision AC 19)', () => {
      expect(formatCurrency(1234567)).toBe('1\u00A0234\u00A0567\u00A0₽')
    })

    it('should format small values', () => {
      expect(formatCurrency(50)).toBe('50\u00A0₽')
    })

    it('should not show decimal places', () => {
      expect(formatCurrency(1234.56)).toBe('1\u00A0235\u00A0₽') // Rounded
    })
  })

  // NOTE: the local dot-locale `formatPercentage` shadow was deleted (iter-68); percent rendering
  // now delegates to the canonical `formatPercentage(x, 1)` in @/lib/utils. Its standalone edge
  // cases (decimals=0/2, very small values) are covered in src/lib/utils.test.ts; the tests below
  // are the integration point asserting the comma+NBSP output.
  // NBSP code-point: ru-RU percent separator is U+00A0 (regular NBSP) on ICU >= 73 (CI Node);
  // older ICU (< 73) emitted U+202F (narrow NBSP) and would surface here as an assertion mismatch.
  describe('formatRevenueWithPercent', () => {
    it('should format revenue with inline percentage', () => {
      const result = formatRevenueWithPercent(10234, 71.2)
      expect(result).toBe('10\u00A0234\u00A0₽ (71,2\u00A0%)')
    })

    it('should handle zero revenue', () => {
      const result = formatRevenueWithPercent(0, 0)
      expect(result).toBe('0\u00A0₽ (0,0\u00A0%)')
    })

    it('should handle 100% organic contribution', () => {
      const result = formatRevenueWithPercent(5000, 100)
      expect(result).toBe('5\u00A0000\u00A0₽ (100,0\u00A0%)')
    })

    it('should format large revenue correctly', () => {
      const result = formatRevenueWithPercent(1234567, 45.6)
      expect(result).toBe('1\u00A0234\u00A0567\u00A0₽ (45,6\u00A0%)')
    })
    it('should render negative revenue and percentage (attribution edge case)', () => {
      // organicContribution can go negative when ad-attributed revenue exceeds total revenue;
      // ru-RU uses an ASCII hyphen-minus, and the comma+NBSP percent rules still apply.
      const result = formatRevenueWithPercent(-500, -5)
      expect(result).toBe('-500\u00A0₽ (-5,0\u00A0%)')
    })
  })

  describe('formatROAS', () => {
    it('should format ROAS with 2 decimal places', () => {
      expect(formatROAS(0.9)).toBe('0.90')
      expect(formatROAS(1.76)).toBe('1.76')
    })

    it('should return em dash for null', () => {
      expect(formatROAS(null)).toBe('—')
    })

    it('should return em dash for undefined', () => {
      expect(formatROAS(undefined)).toBe('—')
    })

    it('should format zero ROAS', () => {
      expect(formatROAS(0)).toBe('0.00')
    })

    it('should format very small ROAS', () => {
      expect(formatROAS(0.005)).toBe('0.01') // Rounded up
      expect(formatROAS(0.004)).toBe('0.00') // Rounded down
    })

    it('should format ROAS > 1.0', () => {
      expect(formatROAS(2.5)).toBe('2.50')
    })

    it('should format large ROAS', () => {
      expect(formatROAS(10.123)).toBe('10.12')
    })
  })
})
