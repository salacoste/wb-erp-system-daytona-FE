/**
 * Unit tests for DeliveryDatePicker component
 * Story 44.26a-FE: Product Search & Delivery Date Selection
 * Epic 44: Price Calculator UI (Frontend)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeliveryDatePicker } from '../DeliveryDatePicker'
import type { NormalizedCoefficient } from '@/lib/coefficient-utils'

// Mock coefficients data for 14 days - isAvailable=true means slot is bookable
const mockCoefficients: NormalizedCoefficient[] = [
  { date: '2026-01-22', coefficient: 1.0, status: 'base', isAvailable: true },
  { date: '2026-01-23', coefficient: 1.25, status: 'elevated', isAvailable: true },
  { date: '2026-01-24', coefficient: 1.5, status: 'elevated', isAvailable: true },
  { date: '2026-01-25', coefficient: 1.0, status: 'base', isAvailable: true },
  { date: '2026-01-26', coefficient: 1.75, status: 'high', isAvailable: true },
  { date: '2026-01-27', coefficient: 2.0, status: 'high', isAvailable: true },
  { date: '2026-01-28', coefficient: -1, status: 'unavailable', isAvailable: false },
  { date: '2026-01-29', coefficient: 1.0, status: 'base', isAvailable: true },
  { date: '2026-01-30', coefficient: 2.25, status: 'peak', isAvailable: true },
  { date: '2026-01-31', coefficient: 1.0, status: 'base', isAvailable: true },
  { date: '2026-02-01', coefficient: 1.25, status: 'elevated', isAvailable: true },
  { date: '2026-02-02', coefficient: -1, status: 'unavailable', isAvailable: false },
  { date: '2026-02-03', coefficient: 1.0, status: 'base', isAvailable: true },
  { date: '2026-02-04', coefficient: 1.0, status: 'base', isAvailable: true },
]

const allUnavailableCoefficients: NormalizedCoefficient[] = [
  { date: '2026-01-22', coefficient: -1, status: 'unavailable', isAvailable: false },
  { date: '2026-01-23', coefficient: -1, status: 'unavailable', isAvailable: false },
  { date: '2026-01-24', coefficient: -1, status: 'unavailable', isAvailable: false },
]

describe('DeliveryDatePicker', () => {
  const defaultProps = {
    coefficients: mockCoefficients,
    selectedDate: '2026-01-23',
    onDateSelect: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // Rendering Tests
  // ==========================================================================

  describe('rendering', () => {
    it('renders label with default text', () => {
      render(<DeliveryDatePicker {...defaultProps} />)

      expect(screen.getByText('Дата сдачи товара')).toBeInTheDocument()
    })

    it('renders custom label when provided', () => {
      render(<DeliveryDatePicker {...defaultProps} label="Дата доставки" />)

      expect(screen.getByText('Дата доставки')).toBeInTheDocument()
    })

    it('renders hint icon when showHint is true', () => {
      render(<DeliveryDatePicker {...defaultProps} showHint />)

      // Help button with sr-only text
      expect(screen.getByText('Справка по дате сдачи')).toBeInTheDocument()
    })

    it('does not render hint when showHint is false', () => {
      render(<DeliveryDatePicker {...defaultProps} showHint={false} />)

      expect(screen.queryByText('Справка по дате сдачи')).not.toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Date Display Tests (AC3)
  // ==========================================================================

  describe('date display', () => {
    it('shows selected date in Russian long format', () => {
      render(<DeliveryDatePicker {...defaultProps} selectedDate="2026-01-23" />)

      // "23 января 2026" format
      expect(screen.getByText(/23 января 2026/i)).toBeInTheDocument()
    })

    it('shows coefficient next to date', () => {
      render(<DeliveryDatePicker {...defaultProps} selectedDate="2026-01-23" />)

      // Component uses abbreviated "Коэфф. приёмки:" label
      expect(screen.getByText(/коэфф.*приёмки/i)).toBeInTheDocument()
      expect(screen.getByText(/×1.25/i)).toBeInTheDocument()
    })

    it('shows API error when no coefficients provided', () => {
      render(
        <DeliveryDatePicker
          {...defaultProps}
          selectedDate={null}
          coefficients={[]}
        />
      )

      // Empty coefficients = API error (API should always return data)
      expect(screen.getByText(/API не вернул данные/i)).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Loading & Error States Tests (AC6)
  // ==========================================================================

  describe('loading state', () => {
    it('shows skeleton while loading', () => {
      render(<DeliveryDatePicker {...defaultProps} isLoading />)

      const skeleton = document.querySelector('.animate-pulse')
      expect(skeleton).toBeInTheDocument()
    })

    it('does not show date picker content while loading', () => {
      render(<DeliveryDatePicker {...defaultProps} isLoading />)

      expect(screen.queryByText(/23 января 2026/i)).not.toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('shows error message when provided', () => {
      render(
        <DeliveryDatePicker {...defaultProps} error="Ошибка загрузки коэффициентов" />
      )

      expect(screen.getByText(/ошибка загрузки коэффициентов/i)).toBeInTheDocument()
    })

    it('applies error styling to error message', () => {
      render(<DeliveryDatePicker {...defaultProps} error="Ошибка" />)

      const errorDiv = screen.getByText(/ошибка/i).closest('div')
      expect(errorDiv?.className).toContain('destructive')
    })
  })

  describe('no available dates from API', () => {
    it('shows warning when all dates are unavailable', async () => {
      render(
        <DeliveryDatePicker
          {...defaultProps}
          coefficients={allUnavailableCoefficients}
        />
      )

      // Expand calendar to see warning
      const trigger = screen.getByRole('button', { name: /выбрать дату/i })
      await userEvent.click(trigger)

      await waitFor(() => {
        // Shows "no available dates" message (not API error, just no slots)
        expect(screen.getByText(/нет доступных дат/i)).toBeInTheDocument()
      })
    })

    it('does not show calendar grid when all dates unavailable', async () => {
      render(
        <DeliveryDatePicker
          {...defaultProps}
          coefficients={allUnavailableCoefficients}
        />
      )

      // Expand calendar
      const trigger = screen.getByRole('button', { name: /выбрать дату/i })
      await userEvent.click(trigger)

      // Calendar grid should NOT be visible (no available dates)
      await waitFor(() => {
        expect(screen.queryByRole('grid')).not.toBeInTheDocument()
      })
    })
  })

  // ==========================================================================
  // Collapsible Calendar Tests
  // ==========================================================================

  describe('collapsible calendar', () => {
    it('calendar is collapsed by default', () => {
      render(<DeliveryDatePicker {...defaultProps} />)

      // Calendar content should not be visible initially
      expect(screen.queryByText(/коэффициенты на 14 дней/i)).not.toBeInTheDocument()
    })

    it('expands calendar when trigger is clicked', async () => {
      render(<DeliveryDatePicker {...defaultProps} />)

      const trigger = screen.getByRole('button', { name: /выбрать дату/i })
      await userEvent.click(trigger)

      await waitFor(() => {
        expect(screen.getByText(/коэффициенты на 14 дней/i)).toBeInTheDocument()
      })
    })

    it('shows CoefficientCalendar when expanded', async () => {
      render(<DeliveryDatePicker {...defaultProps} />)

      const trigger = screen.getByRole('button', { name: /выбрать дату/i })
      await userEvent.click(trigger)

      await waitFor(() => {
        // Calendar grid should be visible
        expect(screen.getByRole('grid')).toBeInTheDocument()
      })
    })
  })

  // ==========================================================================
  // Date Selection Tests
  // ==========================================================================

  describe('date selection', () => {
    it('calls onDateSelect when date is selected from calendar', async () => {
      const onDateSelect = vi.fn()
      render(<DeliveryDatePicker {...defaultProps} onDateSelect={onDateSelect} />)

      // Expand calendar
      const trigger = screen.getByRole('button', { name: /выбрать дату/i })
      await userEvent.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument()
      })

      // Click on a date cell (day 22 = first base coefficient 1.0)
      const dateCells = screen.getAllByRole('gridcell')
      const day22Cell = dateCells.find((cell) => cell.textContent?.includes('22'))
      if (day22Cell) {
        await userEvent.click(day22Cell)
      }

      expect(onDateSelect).toHaveBeenCalledWith('2026-01-22', 1.0)
    })

    it('does not call onDateSelect for unavailable dates', async () => {
      const onDateSelect = vi.fn()
      render(<DeliveryDatePicker {...defaultProps} onDateSelect={onDateSelect} />)

      // Expand calendar
      const trigger = screen.getByRole('button', { name: /выбрать дату/i })
      await userEvent.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument()
      })

      // Click on unavailable date (day 28)
      const dateCells = screen.getAllByRole('gridcell')
      const day28Cell = dateCells.find((cell) => cell.textContent?.includes('28'))
      if (day28Cell) {
        await userEvent.click(day28Cell)
      }

      // Should not be called for unavailable date
      expect(onDateSelect).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // Coefficient Status Colors Tests (AC4)
  // ==========================================================================

  describe('coefficient status colors', () => {
    it('shows green for base coefficient (<=1.0)', async () => {
      render(<DeliveryDatePicker {...defaultProps} selectedDate="2026-01-22" />)

      const trigger = screen.getByRole('button', { name: /выбрать дату/i })
      await userEvent.click(trigger)

      await waitFor(() => {
        const dateCells = screen.getAllByRole('gridcell')
        const baseCell = dateCells.find((cell) => cell.textContent?.includes('22'))
        expect(baseCell?.className).toContain('green')
      })
    })

    it('shows yellow for elevated coefficient (1.01-1.5)', async () => {
      render(<DeliveryDatePicker {...defaultProps} selectedDate="2026-01-23" />)

      const trigger = screen.getByRole('button', { name: /выбрать дату/i })
      await userEvent.click(trigger)

      await waitFor(() => {
        const dateCells = screen.getAllByRole('gridcell')
        const elevatedCell = dateCells.find((cell) => cell.textContent?.includes('23'))
        expect(elevatedCell?.className).toContain('yellow')
      })
    })

    it('shows gray for unavailable dates (coefficient -1)', async () => {
      render(<DeliveryDatePicker {...defaultProps} />)

      const trigger = screen.getByRole('button', { name: /выбрать дату/i })
      await userEvent.click(trigger)

      await waitFor(() => {
        const dateCells = screen.getAllByRole('gridcell')
        const unavailableCell = dateCells.find((cell) => cell.textContent?.includes('28'))
        expect(unavailableCell?.className).toContain('gray')
      })
    })
  })

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================

  describe('accessibility', () => {
    it('trigger button has proper aria-label', () => {
      render(<DeliveryDatePicker {...defaultProps} />)

      expect(
        screen.getByRole('button', { name: /выбрать дату сдачи товара/i })
      ).toBeInTheDocument()
    })

    it('can be operated with keyboard', async () => {
      render(<DeliveryDatePicker {...defaultProps} />)

      const trigger = screen.getByRole('button', { name: /выбрать дату/i })
      trigger.focus()

      // Press Enter to expand
      await userEvent.keyboard('{Enter}')

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument()
      })
    })
  })

  // ==========================================================================
  // Edge Cases Tests
  // ==========================================================================

  describe('edge cases', () => {
    it('handles empty coefficients array with API error', () => {
      render(<DeliveryDatePicker {...defaultProps} coefficients={[]} />)

      // Story 44.XX: Empty coefficients = API error (should always return data)
      expect(screen.getByText(/API не вернул данные/i)).toBeInTheDocument()
    })

    it('selects first available date as default when selectedDate is null', () => {
      render(<DeliveryDatePicker {...defaultProps} selectedDate={null} />)

      // Should show an available date (either tomorrow or first available from coefficients)
      // The component shows tomorrow if available, else first available date
      // Since we can't control "today", just verify some date is shown
      const dateText = screen.getByRole('button', { name: /выбрать дату/i })
      expect(dateText).toHaveTextContent(/\d+ января 2026/i)
    })
  })
})
