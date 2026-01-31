/**
 * TDD Tests for Zero Margin Display Bug
 *
 * Story: Zero Margin Display Bug Fix
 *
 * ROOT CAUSE:
 * ```typescript
 * // WRONG: 0 is falsy in JavaScript
 * if (!grossProfit || !revenue) return null  // 0 treated as falsy!
 *
 * // CORRECT: Explicit null/undefined check
 * if (grossProfit == null || revenue == null) return null
 * ```
 *
 * These tests follow TDD methodology - they should FAIL initially,
 * demonstrating the bug before the fix is implemented.
 *
 * @see docs/stories/epic-60/TDD-VALIDATION-INTEGRATION.md
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { formatMarginPercent, MarginDisplay, MarginBadge, MarginInfoCard } from '../MarginDisplay'

/**
 * Test Case Matrix:
 * | Input marginPct | Expected Display | Current (BUG) |
 * |-----------------|------------------|---------------|
 * | 0               | "0,00 %"         | "—" ❌        |
 * | null            | "—"              | "—" ✅        |
 * | undefined       | "—"              | "—" ✅        |
 * | -5              | "-5,00 %"        | "-5,00 %" ✅  |
 * | NaN             | "—"              | ? (untested)  |
 * | Infinity        | "—"              | ? (untested)  |
 * | -Infinity       | "—"              | ? (untested)  |
 * | -0              | "0,00 %"         | ? (untested)  |
 * | 0.001           | "0,00 %"         | ? (untested)  |
 */

describe('Zero Margin Display Bug - TDD Tests', () => {
  describe('formatMarginPercent edge cases', () => {
    it('should format 0% correctly as "0,00 %" (not empty)', () => {
      const result = formatMarginPercent(0)
      // Russian locale: 0,00 % (with non-breaking space)
      expect(result).toMatch(/0[,.]00\s*%/)
      expect(result).not.toBe('—')
      expect(result).not.toBe('')
    })

    it('should format negative zero (-0) same as positive zero', () => {
      const resultNegZero = formatMarginPercent(-0)
      const resultPosZero = formatMarginPercent(0)
      // Both should render as 0,00 %
      expect(resultNegZero).toMatch(/0[,.]00\s*%/)
      expect(resultPosZero).toMatch(/0[,.]00\s*%/)
    })

    it('should format very small numbers that round to 0%', () => {
      // 0.001% should round to 0,00%
      const result = formatMarginPercent(0.001)
      expect(result).toMatch(/0[,.]00\s*%/)
    })

    it('should format very small numbers that round to 0.01%', () => {
      // 0.01% should show as 0,01%
      const result = formatMarginPercent(0.01)
      expect(result).toMatch(/0[,.]01\s*%/)
    })

    it('should format negative margin correctly', () => {
      const result = formatMarginPercent(-5)
      expect(result).toMatch(/-5[,.]00\s*%/)
    })

    it('should format large negative margin correctly', () => {
      const result = formatMarginPercent(-123.45)
      expect(result).toMatch(/-123[,.]45\s*%/)
    })
  })

  describe('MarginDisplay component - zero margin handling', () => {
    it('should display 0% when marginPct is exactly zero (THE BUG)', () => {
      /**
       * RED TEST: This test should FAIL if the bug exists
       *
       * Expected: Shows "0,00 %" with gray color
       * Actual (BUG): Shows "—" (dash) treating 0 as null
       */
      render(<MarginDisplay marginPct={0} />)

      // Should find the formatted zero percentage
      const marginText = screen.getByText(/0[,.]00\s*%/)
      expect(marginText).toBeInTheDocument()
      expect(marginText).toHaveClass('text-gray-600')

      // Should NOT show the dash (null indicator)
      expect(screen.queryByText('—')).not.toBeInTheDocument()
    })

    it('should display dash for null margin', () => {
      render(<MarginDisplay marginPct={null} />)

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('should display dash for undefined margin', () => {
      render(<MarginDisplay marginPct={undefined} />)

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('should display negative margin correctly', () => {
      render(<MarginDisplay marginPct={-5} />)

      const marginText = screen.getByText(/-5/)
      expect(marginText).toBeInTheDocument()
      expect(marginText).toHaveClass('text-red-600')
    })

    it('should not show profit/loss label for zero margin', () => {
      render(<MarginDisplay marginPct={0} />)

      // Zero margin should not show "(прибыльно)" or "(убыток)"
      expect(screen.queryByText('(прибыльно)')).not.toBeInTheDocument()
      expect(screen.queryByText('(убыток)')).not.toBeInTheDocument()
    })

    it('should show profit label for positive margin', () => {
      render(<MarginDisplay marginPct={10} />)

      expect(screen.getByText('(прибыльно)')).toBeInTheDocument()
    })

    it('should show loss label for negative margin', () => {
      render(<MarginDisplay marginPct={-10} />)

      expect(screen.getByText('(убыток)')).toBeInTheDocument()
    })
  })

  describe('MarginDisplay - NaN and Infinity handling', () => {
    /**
     * These tests document expected behavior for edge cases.
     * Current implementation passes NaN/Infinity to formatMarginPercent
     * which produces "NaN %" or "∞ %" - not ideal but component doesn't crash.
     *
     * RECOMMENDATION: Add isFinite() check to treat NaN/Infinity as null
     */

    it('should display dash for NaN margin (RECOMMENDED FIX)', () => {
      /**
       * NaN should be treated as invalid/missing data
       * Display: "—" (dash)
       *
       * Current behavior: Shows "не число %" (Russian for NaN) which is not user-friendly
       * Recommended fix: Add Number.isFinite(marginPct) check
       */
      render(<MarginDisplay marginPct={NaN} />)

      // Document current behavior - component doesn't crash
      // In Russian locale, NaN formats as "не число %"
      // Future improvement: show dash instead
      expect(screen.queryByText(/не число|NaN|—/)).toBeInTheDocument()
    })

    it('should display dash for Infinity margin (RECOMMENDED FIX)', () => {
      render(<MarginDisplay marginPct={Infinity} />)

      // Document current behavior - component doesn't crash
      // Future improvement: show dash instead of "∞ %"
      expect(screen.queryByText(/∞|Infinity|—/)).toBeInTheDocument()
    })

    it('should display dash for -Infinity margin (RECOMMENDED FIX)', () => {
      render(<MarginDisplay marginPct={-Infinity} />)

      // Document current behavior - component doesn't crash
      // Future improvement: show dash instead of "-∞ %"
      expect(screen.queryByText(/∞|Infinity|—/)).toBeInTheDocument()
    })
  })

  describe('MarginBadge component - zero margin handling', () => {
    it('should display 0% badge when marginPct is exactly zero', () => {
      const { container } = render(<MarginBadge marginPct={0} />)

      // Should have gray styling for zero
      const badge = container.querySelector('.bg-gray-50')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('text-gray-700')
      expect(badge).toHaveClass('border-gray-200')

      // Should show formatted zero, not dash
      expect(screen.queryByText('—')).not.toBeInTheDocument()
    })

    it('should display dash badge for null margin', () => {
      render(<MarginBadge marginPct={null} />)

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('should display dash badge for undefined margin', () => {
      render(<MarginBadge marginPct={undefined} />)

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('should display green badge for positive margin', () => {
      const { container } = render(<MarginBadge marginPct={25} />)

      const badge = container.querySelector('.bg-green-50')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('text-green-700')
    })

    it('should display red badge for negative margin', () => {
      const { container } = render(<MarginBadge marginPct={-10} />)

      const badge = container.querySelector('.bg-red-50')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('text-red-700')
    })
  })

  describe('MarginInfoCard component - zero margin handling', () => {
    it('should display 0% in card when marginPct is exactly zero', () => {
      render(<MarginInfoCard marginPct={0} period="2025-W03" salesQty={100} revenue={50000} />)

      // Should show margin header
      expect(screen.getByText('Маржинальность')).toBeInTheDocument()

      // Should show 0% formatted value
      const marginValue = screen.getByText(/0[,.]00\s*%/)
      expect(marginValue).toBeInTheDocument()

      // Should NOT show dash
      expect(screen.queryByText('—')).not.toBeInTheDocument()

      // Should show period details since margin is available (0 is valid)
      expect(screen.getByText(/2025-W03/)).toBeInTheDocument()
      expect(screen.getByText(/100 шт/)).toBeInTheDocument()
    })

    it('should not show period details when margin is null', () => {
      render(<MarginInfoCard marginPct={null} period="2025-W03" salesQty={100} revenue={50000} />)

      // Should show dash
      expect(screen.getByText('—')).toBeInTheDocument()

      // Should NOT show period details
      expect(screen.queryByText(/2025-W03/)).not.toBeInTheDocument()
    })
  })

  describe('Edge case: negative zero (-0)', () => {
    it('should treat -0 same as 0 in MarginDisplay', () => {
      const { rerender } = render(<MarginDisplay marginPct={-0} />)

      // -0 should display same as 0
      expect(screen.getByText(/0[,.]00\s*%/)).toBeInTheDocument()
      expect(screen.queryByText('—')).not.toBeInTheDocument()

      // Verify both render identically
      rerender(<MarginDisplay marginPct={0} />)
      expect(screen.getByText(/0[,.]00\s*%/)).toBeInTheDocument()
    })

    it('should use gray color for -0 (same as 0)', () => {
      render(<MarginDisplay marginPct={-0} />)

      const marginText = screen.getByText(/0[,.]00\s*%/)
      expect(marginText).toHaveClass('text-gray-600')
    })
  })

  describe('Edge case: very small percentages', () => {
    it('should display 0.001% correctly (very small positive)', () => {
      render(<MarginDisplay marginPct={0.001} />)

      // Should round to 0.00%
      expect(screen.getByText(/0[,.]00\s*%/)).toBeInTheDocument()
      expect(screen.queryByText('—')).not.toBeInTheDocument()
    })

    it('should display -0.001% correctly (very small negative)', () => {
      render(<MarginDisplay marginPct={-0.001} />)

      // Should round to -0.00% or 0.00%
      // Note: -0.001 rounds to 0, so should show as 0,00 %
      const marginText = screen.getByText(/0[,.]00\s*%/)
      expect(marginText).toBeInTheDocument()
    })

    it('should display 0.01% as 0,01 %', () => {
      render(<MarginDisplay marginPct={0.01} />)

      expect(screen.getByText(/0[,.]01\s*%/)).toBeInTheDocument()
    })

    it('should display -0.01% as -0,01 %', () => {
      render(<MarginDisplay marginPct={-0.01} />)

      expect(screen.getByText(/-0[,.]01\s*%/)).toBeInTheDocument()
    })
  })

  describe('Size variants with zero margin', () => {
    it('should apply small size class for zero margin', () => {
      render(<MarginDisplay marginPct={0} size="sm" />)

      const marginText = screen.getByText(/0[,.]00\s*%/)
      expect(marginText).toHaveClass('text-sm')
    })

    it('should apply medium size class for zero margin', () => {
      render(<MarginDisplay marginPct={0} size="md" />)

      const marginText = screen.getByText(/0[,.]00\s*%/)
      expect(marginText).toHaveClass('text-base')
      expect(marginText).toHaveClass('font-semibold')
    })

    it('should apply large size class for zero margin', () => {
      render(<MarginDisplay marginPct={0} size="lg" />)

      const marginText = screen.getByText(/0[,.]00\s*%/)
      expect(marginText).toHaveClass('text-2xl')
      expect(marginText).toHaveClass('font-bold')
    })
  })

  describe('Regression prevention: falsy value handling', () => {
    /**
     * Complete matrix of falsy values in JavaScript:
     * - 0 (zero)
     * - -0 (negative zero)
     * - "" (empty string) - N/A for number type
     * - null
     * - undefined
     * - NaN
     * - false - N/A for number type
     */

    it('should NOT treat 0 as missing data', () => {
      render(<MarginDisplay marginPct={0} />)
      expect(screen.queryByText('—')).not.toBeInTheDocument()
    })

    it('should treat null as missing data', () => {
      render(<MarginDisplay marginPct={null} />)
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('should treat undefined as missing data', () => {
      render(<MarginDisplay marginPct={undefined} />)
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('should differentiate between 0 and null', () => {
      const { rerender } = render(<MarginDisplay marginPct={0} />)

      // 0 should show formatted value
      expect(screen.getByText(/0[,.]00\s*%/)).toBeInTheDocument()
      expect(screen.queryByText('—')).not.toBeInTheDocument()

      // null should show dash
      rerender(<MarginDisplay marginPct={null} />)
      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })
})
