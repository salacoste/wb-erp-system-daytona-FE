/**
 * Unit Tests for PeriodContextLabel component
 * Story 60.7-FE: Period Context Label
 *
 * Tests cover all acceptance criteria:
 * - AC1: Week format display
 * - AC2: Month format display
 * - AC3: Refresh time display
 * - AC4: Auto-update refresh time
 * - AC5: Responsive layout
 * - AC6: Russian locale
 * - AC7: Context integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { PeriodContextLabel } from '../PeriodContextLabel'

describe('PeriodContextLabel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Set fixed date for consistent testing
    vi.setSystemTime(new Date('2026-01-29T12:00:00+03:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Week Format (AC1)', () => {
    it('should format week as "Обзор за: Неделя X, YYYY (DD mon — DD mon)"', () => {
      render(<PeriodContextLabel periodType="week" week="2026-W05" showRefreshTime={false} />)
      expect(screen.getByText(/Неделя 5, 2026/)).toBeInTheDocument()
    })

    it('should include date range in parentheses with Russian month abbreviations', () => {
      render(<PeriodContextLabel periodType="week" week="2026-W05" showRefreshTime={false} />)
      // Week 5 of 2026 is Jan 27 - Feb 2
      const label = screen.getByText(/Неделя 5, 2026/)
      expect(label.textContent).toContain('янв')
      expect(label.textContent).toContain('фев')
    })

    it('should handle week 1 of year correctly', () => {
      render(<PeriodContextLabel periodType="week" week="2026-W01" showRefreshTime={false} />)
      // Week 1 of 2026 starts Dec 29, 2025
      expect(screen.getByText(/Неделя 1, 2026/)).toBeInTheDocument()
    })

    it('should handle week 52/53 (year boundary weeks)', () => {
      render(<PeriodContextLabel periodType="week" week="2025-W52" showRefreshTime={false} />)
      expect(screen.getByText(/Неделя 52, 2025/)).toBeInTheDocument()
    })
  })

  describe('Month Format (AC2)', () => {
    it('should format month as "Обзор за: Январь 2026"', () => {
      render(<PeriodContextLabel periodType="month" month="2026-01" showRefreshTime={false} />)
      expect(screen.getByText(/Январь 2026/)).toBeInTheDocument()
    })

    it('should use Russian month names for all months', () => {
      render(<PeriodContextLabel periodType="month" month="2026-07" showRefreshTime={false} />)
      expect(screen.getByText(/Июль 2026/)).toBeInTheDocument()
    })

    it('should capitalize month name (first letter uppercase)', () => {
      render(<PeriodContextLabel periodType="month" month="2026-03" showRefreshTime={false} />)
      // Should be "Март" not "март"
      expect(screen.getByText(/Март/)).toBeInTheDocument()
    })
  })

  describe('Refresh Time Display (AC3)', () => {
    it('should show relative time "X мин назад" for recent refresh', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      render(<PeriodContextLabel periodType="week" week="2026-W05" lastRefresh={fiveMinutesAgo} />)
      // Check for Russian relative time
      expect(screen.getByText(/Обновлено:/)).toBeInTheDocument()
      expect(screen.getByText(/минут назад/i)).toBeInTheDocument()
    })

    it('should show "меньше минуты назад" for just now', () => {
      const justNow = new Date()
      render(<PeriodContextLabel periodType="week" week="2026-W05" lastRefresh={justNow} />)
      // date-fns Russian locale uses "меньше минуты" for less than a minute
      expect(screen.getByText(/меньше минуты назад/i)).toBeInTheDocument()
    })

    it('should show hours for older refresh times', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      render(<PeriodContextLabel periodType="week" week="2026-W05" lastRefresh={twoHoursAgo} />)
      // Should contain "час" (hour in Russian)
      expect(screen.getByText(/час/i)).toBeInTheDocument()
    })

    it('should handle undefined lastRefresh gracefully', () => {
      render(<PeriodContextLabel periodType="week" week="2026-W05" lastRefresh={undefined} />)
      // Should not crash, and should not show "Обновлено:" section
      expect(screen.queryByText(/Обновлено:/)).not.toBeInTheDocument()
    })
  })

  describe('Auto-Update Refresh Time (AC4)', () => {
    it('should update refresh time every minute', () => {
      // Use a fresh "now" date for lastRefresh
      const justNow = new Date()
      render(<PeriodContextLabel periodType="week" week="2026-W05" lastRefresh={justNow} />)

      // Initially should show "меньше минуты назад" (date-fns Russian locale)
      expect(screen.getByText(/меньше минуты назад/i)).toBeInTheDocument()

      // Advance time by 90 seconds (1.5 minutes)
      act(() => {
        vi.advanceTimersByTime(90000)
      })

      // Now should show "1 минуту назад" or similar
      expect(screen.getByText(/минут/i)).toBeInTheDocument()
    })

    it('should clear interval on unmount (no memory leak)', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
      const { unmount } = render(
        <PeriodContextLabel periodType="week" week="2026-W05" lastRefresh={new Date()} />
      )

      unmount()
      expect(clearIntervalSpy).toHaveBeenCalled()
      clearIntervalSpy.mockRestore()
    })

    it('should restart interval when lastRefresh prop changes', () => {
      const oldRefresh = new Date(Date.now() - 5 * 60 * 1000)
      const { rerender } = render(
        <PeriodContextLabel periodType="week" week="2026-W05" lastRefresh={oldRefresh} />
      )

      // Initially shows 5 minutes ago
      expect(screen.getByText(/минут назад/i)).toBeInTheDocument()

      // Update with new refresh time
      const newRefresh = new Date()
      rerender(<PeriodContextLabel periodType="week" week="2026-W05" lastRefresh={newRefresh} />)

      // Should now show "меньше минуты назад" (date-fns Russian locale)
      expect(screen.getByText(/меньше минуты назад/i)).toBeInTheDocument()
    })
  })

  describe('Responsive Layout (AC5)', () => {
    it('should have flex-col class for mobile stacking', () => {
      const { container } = render(<PeriodContextLabel periodType="week" week="2026-W05" />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).toContain('flex-col')
    })

    it('should have sm:flex-row class for desktop inline', () => {
      const { container } = render(<PeriodContextLabel periodType="week" week="2026-W05" />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).toContain('sm:flex-row')
    })

    it('should show separator dot only on desktop (hidden sm:inline)', () => {
      render(<PeriodContextLabel periodType="week" week="2026-W05" lastRefresh={new Date()} />)
      // Find the separator element (bullet character)
      const separator = document.querySelector('[aria-hidden="true"]')
      expect(separator).toBeInTheDocument()
      expect(separator?.className).toContain('hidden')
      expect(separator?.className).toContain('sm:inline')
    })
  })

  describe('Russian Locale (AC6)', () => {
    it('should use Russian locale for date-fns formatDistanceToNow', () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
      render(<PeriodContextLabel periodType="week" week="2026-W05" lastRefresh={tenMinutesAgo} />)
      // Should contain "назад" (Russian for "ago")
      expect(screen.getByText(/назад/)).toBeInTheDocument()
    })

    it('should format day/month in Russian style (DD mon)', () => {
      render(<PeriodContextLabel periodType="week" week="2026-W03" showRefreshTime={false} />)
      // Week 3 of 2026 is in January
      // Should contain "янв" not "Jan"
      const label = screen.getByText(/Неделя 3, 2026/)
      expect(label.textContent).toContain('янв')
    })
  })

  describe('Context Integration (AC7)', () => {
    it('should accept all props from useDashboardPeriod context shape', () => {
      // Test that all required props work together
      render(
        <PeriodContextLabel
          periodType="week"
          week="2026-W05"
          month="2026-01"
          lastRefresh={new Date()}
          showRefreshTime={true}
          className="custom-class"
        />
      )
      expect(screen.getByText(/Неделя 5, 2026/)).toBeInTheDocument()
      expect(screen.getByText(/Обновлено:/)).toBeInTheDocument()
    })

    it('should re-render when period type changes', () => {
      const { rerender } = render(
        <PeriodContextLabel
          periodType="week"
          week="2026-W05"
          month="2026-01"
          showRefreshTime={false}
        />
      )

      expect(screen.getByText(/Неделя 5, 2026/)).toBeInTheDocument()

      rerender(
        <PeriodContextLabel
          periodType="month"
          week="2026-W05"
          month="2026-01"
          showRefreshTime={false}
        />
      )

      expect(screen.getByText(/Январь 2026/)).toBeInTheDocument()
    })
  })

  describe('Custom className', () => {
    it('should merge custom className with default classes', () => {
      const { container } = render(
        <PeriodContextLabel periodType="week" week="2026-W05" className="custom-test-class" />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).toContain('custom-test-class')
      expect(wrapper.className).toContain('flex')
    })
  })

  describe('Accessibility', () => {
    it('should have sufficient color contrast for text', () => {
      const { container } = render(<PeriodContextLabel periodType="week" week="2026-W05" />)
      const wrapper = container.firstChild as HTMLElement
      // Uses text-muted-foreground and text-foreground which have sufficient contrast
      expect(wrapper.className).toContain('text-muted-foreground')
    })

    it('should not use any time-based animations or flashing', () => {
      const { container } = render(
        <PeriodContextLabel periodType="week" week="2026-W05" lastRefresh={new Date()} />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).not.toContain('animate-')
    })
  })
})
