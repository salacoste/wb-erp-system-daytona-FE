/**
 * TDD Unit Tests for VelocityMetricsWidget component
 * Story 40.6-FE: Orders Analytics Dashboard
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Tests velocity metrics display, color coding, percentiles, loading/error states.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { VelocityMetricsWidget } from '@/components/custom/orders/analytics/VelocityMetricsWidget'

import {
  mockVelocityMetricsFast,
  mockVelocityMetricsAcceptable,
  mockVelocityMetricsSlow,
  mockVelocityMetricsEmpty,
  confirmationTimeColorTestCases,
  completionTimeColorTestCases,
  durationTestCases,
} from '@/test/fixtures/orders-analytics'

describe('VelocityMetricsWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // iter-90: null average time handling
  describe('Null average time handling', () => {
    it('renders "—" and "Нет данных" (not "0 мин"/green) when avgCompletionTimeMinutes is null', () => {
      render(
        <VelocityMetricsWidget
          data={{ ...mockVelocityMetricsFast, avgCompletionTimeMinutes: null }}
        />
      )
      const value = screen.getByTestId('completion-time-value')
      expect(value).toHaveTextContent('—')
      expect(value).not.toHaveTextContent('0 мин')
      expect(value).toHaveClass('text-muted-foreground')
      expect(value).not.toHaveClass('text-status-success')
      expect(screen.getByText('Нет данных')).toBeInTheDocument()
    })

    it('still renders the confirmation card normally when only completion is null', () => {
      render(
        <VelocityMetricsWidget
          data={{ ...mockVelocityMetricsFast, avgCompletionTimeMinutes: null }}
        />
      )
      expect(screen.getByTestId('confirmation-time-value')).toHaveTextContent('25 мин')
    })

    it('renders "—" for the confirmation card when avgConfirmationTimeMinutes is null', () => {
      render(
        <VelocityMetricsWidget
          data={{ ...mockVelocityMetricsFast, avgConfirmationTimeMinutes: null }}
        />
      )
      const value = screen.getByTestId('confirmation-time-value')
      expect(value).toHaveTextContent('—')
      expect(value).toHaveClass('text-muted-foreground')
      expect(value).not.toHaveClass('text-status-success')
    })

    it('renders a real 0 as "0 мин" (not "—")', () => {
      render(
        <VelocityMetricsWidget data={{ ...mockVelocityMetricsFast, avgCompletionTimeMinutes: 0 }} />
      )
      const value = screen.getByTestId('completion-time-value')
      expect(value).toHaveTextContent('0 мин')
      expect(value).not.toHaveTextContent('—')
    })
  })

  // Percentiles totalOrders===0 guard
  describe('Percentiles totalOrders===0 guard', () => {
    it('shows "Недостаточно данных" instead of fabricated "P50: 0 мин" when totalOrders=0', async () => {
      const user = userEvent.setup()
      render(<VelocityMetricsWidget data={mockVelocityMetricsEmpty} />)
      const trigger = screen.getByText('P50/P95 детали')
      await user.click(trigger)
      expect(screen.getByTestId('percentiles-empty')).toHaveTextContent('Недостаточно данных')
      expect(screen.queryByTestId('percentiles-content')).not.toBeInTheDocument()
    })

    it('shows real percentiles when totalOrders > 0', async () => {
      const user = userEvent.setup()
      render(<VelocityMetricsWidget data={mockVelocityMetricsFast} />)
      const trigger = screen.getByText('P50/P95 детали')
      await user.click(trigger)
      expect(screen.getByTestId('percentiles-content')).toBeInTheDocument()
      expect(screen.queryByTestId('percentiles-empty')).not.toBeInTheDocument()
    })
  })

  // 1. Average Time Display Tests (AC2)
  describe('Average Time Display', () => {
    it('displays average confirmation time in human-readable format', () => {
      render(<VelocityMetricsWidget data={mockVelocityMetricsFast} />)
      expect(screen.getByTestId('confirmation-time-value')).toHaveTextContent('25 мин')
    })

    it('displays average completion time in human-readable format', () => {
      render(<VelocityMetricsWidget data={mockVelocityMetricsFast} />)
      expect(screen.getByTestId('completion-time-value')).toHaveTextContent('2 ч 30 мин')
    })

    it('displays "Подтверждение" label for confirmation time', () => {
      render(<VelocityMetricsWidget data={mockVelocityMetricsFast} />)
      expect(screen.getByText('Подтверждение')).toBeInTheDocument()
    })

    it('displays "Выполнение" label for completion time', () => {
      render(<VelocityMetricsWidget data={mockVelocityMetricsFast} />)
      expect(screen.getByText('Выполнение')).toBeInTheDocument()
    })

    it('displays widget title "Скорость обработки"', () => {
      render(<VelocityMetricsWidget data={mockVelocityMetricsFast} />)
      expect(screen.getByText(/скорость обработки/i)).toBeInTheDocument()
    })
  })

  // 2. Duration Formatting Tests
  describe('Duration Formatting', () => {
    it('formats minutes under 60 as "X мин"', () => {
      render(
        <VelocityMetricsWidget
          data={{ ...mockVelocityMetricsFast, avgConfirmationTimeMinutes: 35 }}
        />
      )
      expect(screen.getByTestId('confirmation-time-value')).toHaveTextContent('35 мин')
    })

    it('formats exactly 60 minutes as "1 ч"', () => {
      render(
        <VelocityMetricsWidget
          data={{ ...mockVelocityMetricsFast, avgConfirmationTimeMinutes: 60 }}
        />
      )
      expect(screen.getByTestId('confirmation-time-value')).toHaveTextContent('1 ч')
    })

    it('formats 90 minutes as "1 ч 30 мин"', () => {
      render(
        <VelocityMetricsWidget
          data={{ ...mockVelocityMetricsFast, avgConfirmationTimeMinutes: 90 }}
        />
      )
      expect(screen.getByTestId('confirmation-time-value')).toHaveTextContent('1 ч 30 мин')
    })

    it('formats 270 minutes as "4 ч 30 мин"', () => {
      render(
        <VelocityMetricsWidget
          data={{ ...mockVelocityMetricsFast, avgCompletionTimeMinutes: 270 }}
        />
      )
      expect(screen.getByTestId('completion-time-value')).toHaveTextContent('4 ч 30 мин')
    })

    it('formats 1440+ minutes with days', () => {
      render(
        <VelocityMetricsWidget
          data={{ ...mockVelocityMetricsSlow, avgCompletionTimeMinutes: 1500 }}
        />
      )
      expect(screen.getByTestId('completion-time-value')).toHaveTextContent('1 д 1 ч')
    })

    it('handles zero minutes', () => {
      render(
        <VelocityMetricsWidget data={{ ...mockVelocityMetricsFast, avgCompletionTimeMinutes: 0 }} />
      )
      expect(screen.getByTestId('completion-time-value')).toHaveTextContent('0 мин')
    })
  })

  // 3. Confirmation Time Color Coding
  describe('Confirmation Time Color Coding', () => {
    describe('Green (< 30 min)', () => {
      it('applies green color for 25 min confirmation time', () => {
        render(<VelocityMetricsWidget data={mockVelocityMetricsFast} />)
        const metric = screen.getByTestId('confirmation-time-value')
        expect(metric).toHaveClass('text-status-success')
      })

      it('applies green color for 29 min confirmation time', () => {
        render(
          <VelocityMetricsWidget
            data={{ ...mockVelocityMetricsFast, avgConfirmationTimeMinutes: 29 }}
          />
        )
        const metric = screen.getByTestId('confirmation-time-value')
        expect(metric).toHaveClass('text-status-success')
      })
    })

    describe('Yellow (30-59 min)', () => {
      it('applies yellow color for 30 min confirmation time', () => {
        render(
          <VelocityMetricsWidget
            data={{ ...mockVelocityMetricsAcceptable, avgConfirmationTimeMinutes: 30 }}
          />
        )
        const metric = screen.getByTestId('confirmation-time-value')
        expect(metric).toHaveClass('text-status-warning')
      })

      it('applies yellow color for 59 min confirmation time', () => {
        render(
          <VelocityMetricsWidget
            data={{ ...mockVelocityMetricsAcceptable, avgConfirmationTimeMinutes: 59 }}
          />
        )
        const metric = screen.getByTestId('confirmation-time-value')
        expect(metric).toHaveClass('text-status-warning')
      })
    })

    describe('Red (>= 60 min)', () => {
      it('applies red color for 60 min confirmation time', () => {
        render(
          <VelocityMetricsWidget
            data={{ ...mockVelocityMetricsSlow, avgConfirmationTimeMinutes: 60 }}
          />
        )
        const metric = screen.getByTestId('confirmation-time-value')
        expect(metric).toHaveClass('text-status-error')
      })

      it('applies red color for 90 min confirmation time', () => {
        render(<VelocityMetricsWidget data={mockVelocityMetricsSlow} />)
        const metric = screen.getByTestId('confirmation-time-value')
        expect(metric).toHaveClass('text-status-error')
      })
    })
  })

  // 4. Completion Time Color Coding
  describe('Completion Time Color Coding', () => {
    describe('Green (< 3h / 180 min)', () => {
      it('applies green color for 150 min completion time', () => {
        render(<VelocityMetricsWidget data={mockVelocityMetricsFast} />)
        const metric = screen.getByTestId('completion-time-value')
        expect(metric).toHaveClass('text-status-success')
      })

      it('applies green color for 179 min completion time', () => {
        render(
          <VelocityMetricsWidget
            data={{ ...mockVelocityMetricsFast, avgCompletionTimeMinutes: 179 }}
          />
        )
        const metric = screen.getByTestId('completion-time-value')
        expect(metric).toHaveClass('text-status-success')
      })
    })

    describe('Yellow (3-6h / 180-359 min)', () => {
      it('applies yellow color for 180 min completion time', () => {
        render(
          <VelocityMetricsWidget
            data={{ ...mockVelocityMetricsAcceptable, avgCompletionTimeMinutes: 180 }}
          />
        )
        const metric = screen.getByTestId('completion-time-value')
        expect(metric).toHaveClass('text-status-warning')
      })

      it('applies yellow color for 359 min completion time', () => {
        render(
          <VelocityMetricsWidget
            data={{ ...mockVelocityMetricsAcceptable, avgCompletionTimeMinutes: 359 }}
          />
        )
        const metric = screen.getByTestId('completion-time-value')
        expect(metric).toHaveClass('text-status-warning')
      })
    })

    describe('Red (>= 6h / 360 min)', () => {
      it('applies red color for 360 min completion time', () => {
        render(
          <VelocityMetricsWidget
            data={{ ...mockVelocityMetricsSlow, avgCompletionTimeMinutes: 360 }}
          />
        )
        const metric = screen.getByTestId('completion-time-value')
        expect(metric).toHaveClass('text-status-error')
      })

      it('applies red color for 480 min completion time', () => {
        render(<VelocityMetricsWidget data={mockVelocityMetricsSlow} />)
        const metric = screen.getByTestId('completion-time-value')
        expect(metric).toHaveClass('text-status-error')
      })
    })
  })

  // 5. Percentiles Collapsible Section
  describe('Percentiles Collapsible Section', () => {
    it('shows collapsible toggle for P50/P95 details', () => {
      render(<VelocityMetricsWidget data={mockVelocityMetricsFast} />)
      expect(screen.getByRole('button', { name: /p50\/p95 детали/i })).toBeInTheDocument()
    })

    it('percentiles section is collapsed by default', () => {
      render(<VelocityMetricsWidget data={mockVelocityMetricsFast} />)
      expect(screen.queryByTestId('percentiles-content')).not.toBeInTheDocument()
    })

    it('expands percentiles section on click', async () => {
      const user = userEvent.setup()
      render(<VelocityMetricsWidget data={mockVelocityMetricsFast} />)
      await user.click(screen.getByRole('button', { name: /p50\/p95 детали/i }))
      expect(screen.getByTestId('percentiles-content')).toBeInTheDocument()
    })

    it('displays P50 confirmation time when expanded', async () => {
      const user = userEvent.setup()
      render(<VelocityMetricsWidget data={mockVelocityMetricsFast} />)
      await user.click(screen.getByRole('button', { name: /p50\/p95/i }))
      expect(screen.getByText(/p50:.*20 мин/i)).toBeInTheDocument()
    })

    it('displays P95 confirmation time when expanded', async () => {
      const user = userEvent.setup()
      render(<VelocityMetricsWidget data={mockVelocityMetricsFast} />)
      await user.click(screen.getByRole('button', { name: /p50\/p95/i }))
      expect(screen.getByText(/p95:.*45 мин/i)).toBeInTheDocument()
    })

    it('displays P50 and P95 for completion time', async () => {
      const user = userEvent.setup()
      render(<VelocityMetricsWidget data={mockVelocityMetricsFast} />)
      await user.click(screen.getByRole('button', { name: /p50\/p95/i }))
      expect(screen.getByText(/p50:.*2 ч/i)).toBeInTheDocument()
      expect(screen.getByText(/p95:.*4 ч/i)).toBeInTheDocument()
    })

    it('collapses percentiles section on second click', async () => {
      const user = userEvent.setup()
      render(<VelocityMetricsWidget data={mockVelocityMetricsFast} />)
      const toggle = screen.getByRole('button', { name: /p50\/p95/i })
      await user.click(toggle)
      expect(screen.getByTestId('percentiles-content')).toBeInTheDocument()
      await user.click(toggle)
      expect(screen.queryByTestId('percentiles-content')).not.toBeInTheDocument()
    })
  })

  // 6. Loading State
  describe('Loading State', () => {
    it('shows skeleton when isLoading is true', () => {
      render(<VelocityMetricsWidget data={undefined} isLoading={true} />)
      expect(screen.getByTestId('velocity-widget-skeleton')).toBeInTheDocument()
    })

    it('hides actual content during loading', () => {
      render(<VelocityMetricsWidget data={mockVelocityMetricsFast} isLoading={true} />)
      expect(screen.queryByTestId('confirmation-time-value')).not.toBeInTheDocument()
      expect(screen.getByTestId('velocity-widget-skeleton')).toBeInTheDocument()
    })

    it('shows widget title even during loading', () => {
      render(<VelocityMetricsWidget data={undefined} isLoading={true} />)
      expect(screen.getByText(/скорость обработки/i)).toBeInTheDocument()
    })
  })

  // 7. Error State
  describe('Error State', () => {
    it('shows error message when error prop is provided', () => {
      render(<VelocityMetricsWidget data={undefined} error={new Error('Failed')} />)
      expect(screen.getByText(/не удалось загрузить/i)).toBeInTheDocument()
    })

    it('shows retry button on error', () => {
      const onRetry = vi.fn()
      render(<VelocityMetricsWidget error={new Error('Failed')} onRetry={onRetry} />)
      expect(screen.getByRole('button', { name: /повторить/i })).toBeInTheDocument()
    })

    it('calls onRetry when retry button clicked', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      render(<VelocityMetricsWidget error={new Error('Failed')} onRetry={onRetry} />)
      await user.click(screen.getByRole('button', { name: /повторить/i }))
      expect(onRetry).toHaveBeenCalledTimes(1)
    })
  })

  // 8. Accessibility
  describe('Accessibility', () => {
    it('uses aria-label for time values', () => {
      render(<VelocityMetricsWidget data={mockVelocityMetricsFast} />)
      expect(screen.getByLabelText(/среднее время подтверждение/i)).toBeInTheDocument()
    })

    it('status labels describe speed for each metric', () => {
      // Both confirmation and completion show "Быстро" for fast metrics
      render(<VelocityMetricsWidget data={mockVelocityMetricsFast} />)
      const fastLabels = screen.getAllByText('Быстро')
      expect(fastLabels).toHaveLength(2)
    })

    it('collapsible section has aria-expanded attribute', () => {
      render(<VelocityMetricsWidget data={mockVelocityMetricsFast} />)
      const toggle = screen.getByRole('button', { name: /p50\/p95/i })
      expect(toggle).toHaveAttribute('aria-expanded', 'false')
    })
  })

  // TDD Verification Tests
  describe('TDD Verification', () => {
    it('should have correct confirmation time color thresholds', () => {
      const getConfirmationColor = (minutes: number): string => {
        if (minutes < 30) return 'green'
        if (minutes < 60) return 'yellow'
        return 'red'
      }

      confirmationTimeColorTestCases.forEach(({ minutes, expectedColor }) => {
        expect(getConfirmationColor(minutes)).toBe(expectedColor)
      })
    })

    it('should have correct completion time color thresholds', () => {
      const getCompletionColor = (minutes: number): string => {
        if (minutes < 180) return 'green'
        if (minutes < 360) return 'yellow'
        return 'red'
      }

      completionTimeColorTestCases.forEach(({ minutes, expectedColor }) => {
        expect(getCompletionColor(minutes)).toBe(expectedColor)
      })
    })

    it('should format duration correctly', () => {
      const formatDuration = (minutes: number): string => {
        if (minutes < 60) {
          return `${Math.round(minutes)} мин`
        }
        const hours = Math.floor(minutes / 60)
        const mins = Math.round(minutes % 60)
        if (hours < 24) {
          return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`
        }
        const days = Math.floor(hours / 24)
        const remainingHours = hours % 24
        return `${days} д ${remainingHours} ч`
      }

      durationTestCases.forEach(({ minutes, expected }) => {
        expect(formatDuration(minutes)).toBe(expected)
      })
    })

    it('should have all mock fixtures available', () => {
      expect(mockVelocityMetricsFast).toBeDefined()
      expect(mockVelocityMetricsAcceptable).toBeDefined()
      expect(mockVelocityMetricsSlow).toBeDefined()
      expect(mockVelocityMetricsEmpty).toBeDefined()
    })

    it('should have testing utilities available', () => {
      expect(render).toBeDefined()
      expect(screen).toBeDefined()
      expect(userEvent).toBeDefined()
    })
  })
})
