/**
 * IncompleteWeekBanner Component Tests
 * Dashboard Data Availability Indicators
 *
 * @see docs/request-backend/136-DAILY-DATA-AVAILABILITY-GUIDE.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { IncompleteWeekBanner } from '../IncompleteWeekBanner'

describe('IncompleteWeekBanner', () => {
  beforeEach(() => {
    // Mock Date to return a fixed date: 2026-01-30 (Thursday of week 5)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-30T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Week Period', () => {
    it('shows banner for current (incomplete) week', () => {
      // 2026-W05 is the current week based on our mocked date
      render(<IncompleteWeekBanner period="2026-W05" periodType="week" />)

      expect(screen.getByText('Неделя ещё не завершена')).toBeInTheDocument()
      expect(screen.getByText(/Некоторые метрики/)).toBeInTheDocument()
      expect(screen.getByText(/выкупы, логистика, хранение, теор. прибыль/)).toBeInTheDocument()
    })

    it('does not show banner for completed weeks', () => {
      // 2026-W04 is a past week
      const { container } = render(<IncompleteWeekBanner period="2026-W04" periodType="week" />)

      expect(container.firstChild).toBeNull()
    })

    it('shows expected report date', () => {
      render(<IncompleteWeekBanner period="2026-W05" periodType="week" />)

      // The expected date should be Tuesday after the week ends
      expect(screen.getByText(/~/)).toBeInTheDocument()
    })
  })

  describe('Month Period', () => {
    it('shows banner for current (incomplete) month', () => {
      // 2026-01 is the current month based on our mocked date
      render(<IncompleteWeekBanner period="2026-01" periodType="month" />)

      expect(screen.getByText('Месяц ещё не завершён')).toBeInTheDocument()
      expect(screen.getByText(/Данные обновляются по мере поступления/)).toBeInTheDocument()
    })

    it('does not show banner for completed months', () => {
      // 2025-12 is a past month
      const { container } = render(<IncompleteWeekBanner period="2025-12" periodType="month" />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('Styling', () => {
    it('applies blue alert styling', () => {
      render(<IncompleteWeekBanner period="2026-W05" periodType="week" />)

      const alert = screen.getByRole('status')
      expect(alert).toHaveClass('border-blue-200')
      expect(alert).toHaveClass('bg-blue-50')
    })

    it('applies custom className', () => {
      render(<IncompleteWeekBanner period="2026-W05" periodType="week" className="custom-class" />)

      const alert = screen.getByRole('status')
      expect(alert).toHaveClass('custom-class')
    })
  })

  describe('Accessibility', () => {
    it('has proper role and aria-live', () => {
      render(<IncompleteWeekBanner period="2026-W05" periodType="week" />)

      const alert = screen.getByRole('status')
      expect(alert).toHaveAttribute('aria-live', 'polite')
    })
  })
})
