/**
 * Unit Tests for Formatting Utilities
 *
 * Epic 37 Story 37.3: Aggregate Metrics Display
 * Tests Russian locale formatting for currency, percentages, and ROAS
 *
 * @see docs/stories/epic-37/story-37.3-aggregate-metrics-display.BMAD.md
 */

import {
  formatCurrency,
  formatPercentage,
  formatRevenueWithPercent,
  formatROAS,
} from '../formatters';

describe('Formatters', () => {
  describe('formatCurrency', () => {
    it('should format positive values with Russian locale', () => {
      expect(formatCurrency(35570)).toBe('35\u00A0570\u00A0₽');
    });

    it('should format zero values', () => {
      expect(formatCurrency(0)).toBe('0\u00A0₽');
    });

    it('should format negative values', () => {
      expect(formatCurrency(-1500)).toBe('-1\u00A0500\u00A0₽');
    });

    it('should format large numbers without abbreviation (PO Decision AC 19)', () => {
      expect(formatCurrency(1234567)).toBe('1\u00A0234\u00A0567\u00A0₽');
    });

    it('should format small values', () => {
      expect(formatCurrency(50)).toBe('50\u00A0₽');
    });

    it('should not show decimal places', () => {
      expect(formatCurrency(1234.56)).toBe('1\u00A0235\u00A0₽'); // Rounded
    });
  });

  describe('formatPercentage', () => {
    it('should format with 1 decimal place by default', () => {
      expect(formatPercentage(71.234)).toBe('71.2%');
    });

    it('should format zero percentage', () => {
      expect(formatPercentage(0)).toBe('0.0%');
    });

    it('should format 100 percentage', () => {
      expect(formatPercentage(100)).toBe('100.0%');
    });

    it('should format with custom decimal places', () => {
      expect(formatPercentage(71.234, 2)).toBe('71.23%');
      expect(formatPercentage(71.234, 0)).toBe('71%');
    });

    it('should handle very small percentages', () => {
      expect(formatPercentage(0.1)).toBe('0.1%');
    });
  });

  describe('formatRevenueWithPercent', () => {
    it('should format revenue with inline percentage', () => {
      const result = formatRevenueWithPercent(10234, 71.2);
      expect(result).toBe('10\u00A0234\u00A0₽ (71.2%)');
    });

    it('should handle zero revenue', () => {
      const result = formatRevenueWithPercent(0, 0);
      expect(result).toBe('0\u00A0₽ (0.0%)');
    });

    it('should handle 100% organic contribution', () => {
      const result = formatRevenueWithPercent(5000, 100);
      expect(result).toBe('5\u00A0000\u00A0₽ (100.0%)');
    });

    it('should format large revenue correctly', () => {
      const result = formatRevenueWithPercent(1234567, 45.6);
      expect(result).toBe('1\u00A0234\u00A0567\u00A0₽ (45.6%)');
    });
  });

  describe('formatROAS', () => {
    it('should format ROAS with 2 decimal places', () => {
      expect(formatROAS(0.90)).toBe('0.90');
      expect(formatROAS(1.76)).toBe('1.76');
    });

    it('should return em dash for null', () => {
      expect(formatROAS(null)).toBe('—');
    });

    it('should return em dash for undefined', () => {
      expect(formatROAS(undefined)).toBe('—');
    });

    it('should format zero ROAS', () => {
      expect(formatROAS(0)).toBe('0.00');
    });

    it('should format very small ROAS', () => {
      expect(formatROAS(0.005)).toBe('0.01'); // Rounded up
      expect(formatROAS(0.004)).toBe('0.00'); // Rounded down
    });

    it('should format ROAS > 1.0', () => {
      expect(formatROAS(2.5)).toBe('2.50');
    });

    it('should format large ROAS', () => {
      expect(formatROAS(10.123)).toBe('10.12');
    });
  });
});
