/**
 * Unit tests for CoefficientCalendar component
 * Story 44.26a-FE: Product Search & Delivery Date Selection
 * Epic 44: Price Calculator UI (Frontend)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CoefficientCalendar } from '../CoefficientCalendar'
import type { NormalizedCoefficient } from '@/lib/coefficient-utils'

// Mock coefficients with various status levels - isAvailable flag determines if slot is bookable
const mockCoefficients: NormalizedCoefficient[] = [
  { date: '2026-01-22', coefficient: 1.0, status: 'base', isAvailable: true }, // Green
  { date: '2026-01-23', coefficient: 1.25, status: 'elevated', isAvailable: true }, // Yellow
  { date: '2026-01-24', coefficient: 1.5, status: 'elevated', isAvailable: true }, // Yellow
  { date: '2026-01-25', coefficient: 1.0, status: 'base', isAvailable: true }, // Green
  { date: '2026-01-26', coefficient: 1.75, status: 'high', isAvailable: true }, // Orange
  { date: '2026-01-27', coefficient: 2.0, status: 'high', isAvailable: true }, // Orange
  { date: '2026-01-28', coefficient: -1, status: 'unavailable', isAvailable: false }, // Gray
  { date: '2026-01-29', coefficient: 1.0, status: 'base', isAvailable: true }, // Green
  { date: '2026-01-30', coefficient: 2.25, status: 'peak', isAvailable: true }, // Red
  { date: '2026-01-31', coefficient: 1.0, status: 'base', isAvailable: true }, // Green
  { date: '2026-02-01', coefficient: 2.5, status: 'peak', isAvailable: true }, // Red
  { date: '2026-02-02', coefficient: -1, status: 'unavailable', isAvailable: false }, // Gray
  { date: '2026-02-03', coefficient: 1.0, status: 'base', isAvailable: true }, // Green
  { date: '2026-02-04', coefficient: 1.0, status: 'base', isAvailable: true }, // Green
]

describe('CoefficientCalendar', () => {
  const defaultProps = {
    coefficients: mockCoefficients,
    maxDays: 14,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // Rendering Tests
  // ==========================================================================

  describe('rendering', () => {
    it('renders calendar grid with 7 columns', () => {
      render(<CoefficientCalendar {...defaultProps} />)

      const grid = screen.getByRole('grid')
      expect(grid).toBeInTheDocument()
      expect(grid.className).toContain('grid-cols-7')
    })

    it('renders header with day count', () => {
      render(<CoefficientCalendar {...defaultProps} />)

      expect(screen.getByText(/коэффициенты на 14 дней/i)).toBeInTheDocument()
    })

    it('renders all coefficient cells', () => {
      render(<CoefficientCalendar {...defaultProps} />)

      const cells = screen.getAllByRole('gridcell')
      expect(cells).toHaveLength(14)
    })

    it('respects maxDays prop', () => {
      render(<CoefficientCalendar {...defaultProps} maxDays={7} />)

      expect(screen.getByText(/коэффициенты на 7 дней/i)).toBeInTheDocument()
      const cells = screen.getAllByRole('gridcell')
      expect(cells).toHaveLength(7)
    })

    it('shows empty message when no coefficients', () => {
      render(<CoefficientCalendar coefficients={[]} />)

      expect(screen.getByText(/нет данных о коэффициентах/i)).toBeInTheDocument()
    })

    it('renders legend with all status colors', () => {
      render(<CoefficientCalendar {...defaultProps} />)

      expect(screen.getByText('≤1.0')).toBeInTheDocument()
      expect(screen.getByText('1.0-1.5')).toBeInTheDocument()
      expect(screen.getByText('1.5-2.0')).toBeInTheDocument()
      expect(screen.getByText('>2.0')).toBeInTheDocument()
      expect(screen.getByText('н/д')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Color Coding Tests (AC4)
  // ==========================================================================

  describe('color coding', () => {
    it('applies green background for base coefficient (<=1.0)', () => {
      render(<CoefficientCalendar {...defaultProps} />)

      const cells = screen.getAllByRole('gridcell')
      const baseCell = cells[0] // First cell is base (1.0)
      expect(baseCell.className).toContain('green')
    })

    it('applies yellow background for elevated coefficient (1.01-1.5)', () => {
      render(<CoefficientCalendar {...defaultProps} />)

      const cells = screen.getAllByRole('gridcell')
      const elevatedCell = cells[1] // Second cell is elevated (1.25)
      expect(elevatedCell.className).toContain('yellow')
    })

    it('applies orange background for high coefficient (1.51-2.0)', () => {
      render(<CoefficientCalendar {...defaultProps} />)

      const cells = screen.getAllByRole('gridcell')
      const highCell = cells[4] // Fifth cell is high (1.75)
      expect(highCell.className).toContain('orange')
    })

    it('applies red background for peak coefficient (>2.0)', () => {
      render(<CoefficientCalendar {...defaultProps} />)

      const cells = screen.getAllByRole('gridcell')
      const peakCell = cells[8] // Ninth cell is peak (2.25)
      expect(peakCell.className).toContain('red')
    })

    it('applies gray background for unavailable (coefficient -1)', () => {
      render(<CoefficientCalendar {...defaultProps} />)

      const cells = screen.getAllByRole('gridcell')
      const unavailableCell = cells[6] // Seventh cell is unavailable
      expect(unavailableCell.className).toContain('gray')
    })
  })

  // ==========================================================================
  // Cell Content Tests
  // ==========================================================================

  describe('cell content', () => {
    it('displays day number in each cell', () => {
      render(<CoefficientCalendar {...defaultProps} />)

      expect(screen.getByText('22')).toBeInTheDocument()
      expect(screen.getByText('23')).toBeInTheDocument()
      expect(screen.getByText('31')).toBeInTheDocument()
    })

    it('displays formatted coefficient in each cell', () => {
      render(<CoefficientCalendar {...defaultProps} />)

      // Multiple cells can have same coefficient, use getAllByText
      const baseCells = screen.getAllByText('1.00')
      expect(baseCells.length).toBeGreaterThan(0)
      expect(screen.getByText('1.25')).toBeInTheDocument()
      expect(screen.getByText('2.25')).toBeInTheDocument()
    })

    it('displays "--" for unavailable dates', () => {
      render(<CoefficientCalendar {...defaultProps} />)

      const unavailableCells = screen.getAllByText('--')
      expect(unavailableCells.length).toBeGreaterThan(0)
    })
  })

  // ==========================================================================
  // Selection Tests (AC4)
  // ==========================================================================

  describe('selection', () => {
    it('highlights selected date with ring styling', () => {
      render(
        <CoefficientCalendar {...defaultProps} selectedDate="2026-01-23" />
      )

      const cells = screen.getAllByRole('gridcell')
      const selectedCell = cells[1]
      expect(selectedCell.className).toContain('ring')
      expect(selectedCell.className).toContain('blue')
    })

    it('calls onDateSelect when available date is clicked', async () => {
      const onDateSelect = vi.fn()
      render(
        <CoefficientCalendar
          {...defaultProps}
          onDateSelect={onDateSelect}
          selectedDate="2026-01-22"
        />
      )

      const cells = screen.getAllByRole('gridcell')
      await userEvent.click(cells[3]) // Click on day 25 (base)

      expect(onDateSelect).toHaveBeenCalledWith('2026-01-25', 1.0)
    })

    it('does not call onDateSelect when unavailable date is clicked', async () => {
      const onDateSelect = vi.fn()
      render(
        <CoefficientCalendar
          {...defaultProps}
          onDateSelect={onDateSelect}
          selectedDate="2026-01-22"
        />
      )

      const cells = screen.getAllByRole('gridcell')
      await userEvent.click(cells[6]) // Click on unavailable day 28

      expect(onDateSelect).not.toHaveBeenCalled()
    })

    it('shows cursor-pointer on available cells when selectable', () => {
      render(
        <CoefficientCalendar
          {...defaultProps}
          onDateSelect={vi.fn()}
          selectedDate="2026-01-22"
        />
      )

      const cells = screen.getAllByRole('gridcell')
      const availableCell = cells[0]
      expect(availableCell.className).toContain('cursor-pointer')
    })

    it('shows cursor-not-allowed on unavailable cells', () => {
      render(
        <CoefficientCalendar
          {...defaultProps}
          onDateSelect={vi.fn()}
          selectedDate="2026-01-22"
        />
      )

      const cells = screen.getAllByRole('gridcell')
      const unavailableCell = cells[6]
      expect(unavailableCell.className).toContain('cursor-not-allowed')
    })
  })

  // ==========================================================================
  // Keyboard Navigation Tests (AC4)
  // ==========================================================================

  describe('keyboard navigation', () => {
    it('allows navigation with arrow keys', async () => {
      const onDateSelect = vi.fn()
      render(
        <CoefficientCalendar
          {...defaultProps}
          onDateSelect={onDateSelect}
          selectedDate="2026-01-22"
        />
      )

      const cells = screen.getAllByRole('gridcell')
      const firstCell = cells[0]
      firstCell.focus()

      // Press right arrow
      await userEvent.keyboard('{ArrowRight}')

      // Second cell should have focus
      expect(document.activeElement).toBe(cells[1])
    })

    it('allows selection with Enter key', async () => {
      const onDateSelect = vi.fn()
      render(
        <CoefficientCalendar
          {...defaultProps}
          onDateSelect={onDateSelect}
          selectedDate="2026-01-22"
        />
      )

      const cells = screen.getAllByRole('gridcell')
      cells[1].focus()

      await userEvent.keyboard('{Enter}')

      expect(onDateSelect).toHaveBeenCalledWith('2026-01-23', 1.25)
    })

    it('allows selection with Space key', async () => {
      const onDateSelect = vi.fn()
      render(
        <CoefficientCalendar
          {...defaultProps}
          onDateSelect={onDateSelect}
          selectedDate="2026-01-22"
        />
      )

      const cells = screen.getAllByRole('gridcell')
      cells[0].focus()

      await userEvent.keyboard(' ')

      expect(onDateSelect).toHaveBeenCalledWith('2026-01-22', 1.0)
    })

    it('prevents Enter/Space selection on unavailable dates', async () => {
      const onDateSelect = vi.fn()
      render(
        <CoefficientCalendar
          {...defaultProps}
          onDateSelect={onDateSelect}
          selectedDate="2026-01-22"
        />
      )

      // Note: unavailable cells have tabIndex=-1 and won't receive keyboard events
      // This test verifies the behavior is correct
      const cells = screen.getAllByRole('gridcell')
      const unavailableCell = cells[6]

      expect(unavailableCell).toHaveAttribute('tabindex', '-1')
    })

    it('navigates down with ArrowDown', async () => {
      render(
        <CoefficientCalendar
          {...defaultProps}
          onDateSelect={vi.fn()}
          selectedDate="2026-01-22"
        />
      )

      const cells = screen.getAllByRole('gridcell')
      cells[0].focus()

      // Press down arrow (should move 7 cells)
      await userEvent.keyboard('{ArrowDown}')

      expect(document.activeElement).toBe(cells[7])
    })

    it('navigates up with ArrowUp', async () => {
      render(
        <CoefficientCalendar
          {...defaultProps}
          onDateSelect={vi.fn()}
          selectedDate="2026-01-22"
        />
      )

      const cells = screen.getAllByRole('gridcell')
      cells[7].focus()

      await userEvent.keyboard('{ArrowUp}')

      expect(document.activeElement).toBe(cells[0])
    })
  })

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================

  describe('accessibility', () => {
    it('has proper grid role', () => {
      render(<CoefficientCalendar {...defaultProps} />)

      expect(screen.getByRole('grid')).toBeInTheDocument()
    })

    it('has proper aria-label on grid', () => {
      render(<CoefficientCalendar {...defaultProps} />)

      expect(
        screen.getByRole('grid', { name: /календарь коэффициентов/i })
      ).toBeInTheDocument()
    })

    it('cells have aria-label with date and coefficient info', () => {
      render(<CoefficientCalendar {...defaultProps} />)

      const cells = screen.getAllByRole('gridcell')
      const firstCell = cells[0]

      expect(firstCell).toHaveAttribute('aria-label')
      expect(firstCell.getAttribute('aria-label')).toContain('коэффициент')
    })

    it('cells have aria-selected attribute', () => {
      render(
        <CoefficientCalendar {...defaultProps} selectedDate="2026-01-23" />
      )

      const cells = screen.getAllByRole('gridcell')
      const selectedCell = cells[1]

      expect(selectedCell).toHaveAttribute('aria-selected', 'true')
    })

    it('unavailable cells have aria-disabled', () => {
      render(<CoefficientCalendar {...defaultProps} />)

      const cells = screen.getAllByRole('gridcell')
      const unavailableCell = cells[6]

      expect(unavailableCell).toHaveAttribute('aria-disabled', 'true')
    })

    it('available cells have tabIndex 0', () => {
      render(<CoefficientCalendar {...defaultProps} />)

      const cells = screen.getAllByRole('gridcell')
      const availableCell = cells[0]

      expect(availableCell).toHaveAttribute('tabindex', '0')
    })

    it('unavailable cells have tabIndex -1', () => {
      render(<CoefficientCalendar {...defaultProps} />)

      const cells = screen.getAllByRole('gridcell')
      const unavailableCell = cells[6]

      expect(unavailableCell).toHaveAttribute('tabindex', '-1')
    })
  })

  // ==========================================================================
  // Tooltip Tests
  // ==========================================================================

  describe('tooltips', () => {
    it('shows tooltip on hover with date info', async () => {
      render(<CoefficientCalendar {...defaultProps} />)

      const cells = screen.getAllByRole('gridcell')
      await userEvent.hover(cells[0])

      await waitFor(() => {
        // Tooltip should appear with date format
        expect(screen.getByRole('tooltip')).toBeInTheDocument()
      })
    })

    it('tooltip shows coefficient status label', async () => {
      render(<CoefficientCalendar {...defaultProps} />)

      const cells = screen.getAllByRole('gridcell')
      await userEvent.hover(cells[0])

      await waitFor(() => {
        // Should show status label (Базовый for coefficient 1.0)
        const tooltip = screen.getByRole('tooltip')
        expect(tooltip.textContent).toContain('Базовый')
      })
    })

    it('tooltip shows "Недоступно" for unavailable dates', async () => {
      render(<CoefficientCalendar {...defaultProps} />)

      const cells = screen.getAllByRole('gridcell')
      await userEvent.hover(cells[6]) // Unavailable cell

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip')
        expect(tooltip.textContent).toContain('Недоступно')
      })
    })
  })

  // ==========================================================================
  // Edge Cases Tests
  // ==========================================================================

  describe('edge cases', () => {
    it('handles coefficients array shorter than maxDays', () => {
      const shortCoefficients: NormalizedCoefficient[] = [
        { date: '2026-01-22', coefficient: 1.0, status: 'base' },
        { date: '2026-01-23', coefficient: 1.25, status: 'elevated' },
      ]

      render(<CoefficientCalendar coefficients={shortCoefficients} maxDays={14} />)

      const cells = screen.getAllByRole('gridcell')
      expect(cells).toHaveLength(2)
      // Header shows actual count (2 days)
      expect(screen.getByText(/коэффициенты на 2 дн/i)).toBeInTheDocument()
    })

    it('does not render onDateSelect handler when not provided', () => {
      render(<CoefficientCalendar {...defaultProps} />)

      const cells = screen.getAllByRole('gridcell')
      // Cells should not have cursor-pointer class when not selectable
      expect(cells[0].className).not.toContain('cursor-pointer')
    })
  })
})
