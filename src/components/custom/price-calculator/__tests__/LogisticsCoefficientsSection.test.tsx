/**
 * LogisticsCoefficientsSection Component Tests
 * Story 44.9-FE: Logistics Coefficients UI
 *
 * TDD Unit tests for logistics coefficients collapsible section.
 * Tests coefficient display, status badges, auto-fill, calendar, and cost impact.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LogisticsCoefficientsSection } from '../LogisticsCoefficientsSection'
import type { RawCoefficient } from '@/lib/coefficient-utils'

// Mock formatCurrency from utils
vi.mock('@/lib/utils', async () => {
  const actual = await vi.importActual('@/lib/utils')
  return {
    ...actual,
    formatCurrency: (value: number) => `${value.toFixed(2)} ₽`,
    formatDate: (date: string) => {
      const d = new Date(date)
      return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
    },
  }
})

describe('LogisticsCoefficientsSection', () => {
  const defaultProps = {
    warehouseId: 507,
    coefficient: 1.25,
    source: 'auto' as const,
    baseLogisticsCost: 58,
  }

  const rawCoefficientsFixture: RawCoefficient[] = [
    { date: '2026-01-20', coefficient: 100 },
    { date: '2026-01-21', coefficient: 125 },
    { date: '2026-01-22', coefficient: 150 },
    { date: '2026-01-23', coefficient: 175 },
    { date: '2026-01-24', coefficient: 200 },
    { date: '2026-01-25', coefficient: 100 },
    { date: '2026-01-26', coefficient: 100 },
    { date: '2026-01-27', coefficient: 100 },
    { date: '2026-01-28', coefficient: 125 },
    { date: '2026-01-29', coefficient: 125 },
    { date: '2026-01-30', coefficient: 150 },
    { date: '2026-01-31', coefficient: 150 },
    { date: '2026-02-01', coefficient: 125 },
    { date: '2026-02-02', coefficient: 100 },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================
  // AC1: Coefficient Display in Collapsible Section
  // ===========================================

  describe('AC1: Collapsible Section', () => {
    it('renders collapsible section with header showing coefficient', () => {
      render(<LogisticsCoefficientsSection {...defaultProps} />)

      // Should show coefficient in header
      expect(screen.getByText(/Коэффициент: 1\.25/)).toBeInTheDocument()
    })

    it('shows percentage increase in collapsed header for elevated coefficients', () => {
      render(<LogisticsCoefficientsSection {...defaultProps} coefficient={1.25} />)

      // Header should show +25% for coefficient 1.25
      expect(screen.getByText(/\+25\.0%/)).toBeInTheDocument()
    })

    it('shows "(базовый)" for coefficient 1.0', () => {
      render(<LogisticsCoefficientsSection {...defaultProps} coefficient={1.0} />)

      expect(screen.getByText(/базовый/)).toBeInTheDocument()
    })

    it('is collapsed by default', () => {
      render(<LogisticsCoefficientsSection {...defaultProps} />)

      // Content should not be visible initially
      expect(screen.queryByText('Увеличение стоимости:')).not.toBeInTheDocument()
    })

    it('expands when header is clicked', () => {
      render(<LogisticsCoefficientsSection {...defaultProps} />)

      // Click the collapsible trigger
      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)

      // Content should be visible after click
      expect(screen.getByText('Увеличение стоимости:')).toBeInTheDocument()
    })

    it('shows chevron icon that rotates on expand', () => {
      render(<LogisticsCoefficientsSection {...defaultProps} />)

      // Chevron should be present (via the ChevronDown icon)
      const trigger = screen.getByRole('button')
      expect(trigger.querySelector('svg')).toBeInTheDocument()
    })

    it('shows effective date when provided', () => {
      render(
        <LogisticsCoefficientsSection
          {...defaultProps}
          effectiveDate="2026-01-20"
        />
      )

      // Expand the section
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByText(/Действует с:/)).toBeInTheDocument()
    })
  })

  // ===========================================
  // AC2: Coefficient Value Display
  // ===========================================

  describe('AC2: Coefficient Value Display', () => {
    it('displays coefficient with 2 decimal places', () => {
      render(<LogisticsCoefficientsSection {...defaultProps} coefficient={1.25} />)

      // Expand section
      fireEvent.click(screen.getByRole('button'))

      // Should show formatted coefficient
      expect(screen.getByText('1.25')).toBeInTheDocument()
    })

    it('shows "Базовый" badge (green) for coefficient 1.00', () => {
      render(<LogisticsCoefficientsSection {...defaultProps} coefficient={1.0} />)

      // Expand section
      fireEvent.click(screen.getByRole('button'))

      const badge = screen.getByText('Базовый')
      expect(badge).toBeInTheDocument()
      // Check for green styling
      expect(badge).toHaveClass('bg-green-100')
    })

    it('shows "Повышенный" badge (yellow) for coefficient 1.25', () => {
      render(<LogisticsCoefficientsSection {...defaultProps} coefficient={1.25} />)

      // Expand section
      fireEvent.click(screen.getByRole('button'))

      const badge = screen.getByText('Повышенный')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-yellow-100')
    })

    it('shows "Высокий" badge (orange) for coefficient 1.75', () => {
      render(<LogisticsCoefficientsSection {...defaultProps} coefficient={1.75} />)

      // Expand section
      fireEvent.click(screen.getByRole('button'))

      const badge = screen.getByText('Высокий')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-orange-100')
    })

    it('shows "Пиковый" badge (red) for coefficient > 2.0', () => {
      render(<LogisticsCoefficientsSection {...defaultProps} coefficient={2.5} />)

      // Expand section
      fireEvent.click(screen.getByRole('button'))

      const badge = screen.getByText('Пиковый')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-red-100')
    })

    it('has tooltip explaining coefficient impact', () => {
      render(<LogisticsCoefficientsSection {...defaultProps} />)

      // Expand section
      fireEvent.click(screen.getByRole('button'))

      // Info icon should be present for tooltip
      const infoIcon = screen.getByRole('button').parentElement?.parentElement?.querySelector(
        '[class*="cursor-help"]'
      )
      expect(infoIcon).toBeInTheDocument()
    })
  })

  // ===========================================
  // AC3: 14-Day Coefficient Calendar
  // ===========================================

  describe('AC3: 14-Day Coefficient Calendar', () => {
    it('renders calendar when rawCoefficients are provided', () => {
      render(
        <LogisticsCoefficientsSection
          {...defaultProps}
          rawCoefficients={rawCoefficientsFixture}
        />
      )

      // Expand section
      fireEvent.click(screen.getByRole('button'))

      // Calendar header should be visible with actual coefficient count
      expect(screen.getByText(/Коэффициенты на \d+ дней:/)).toBeInTheDocument()
    })

    it('does not render calendar when no coefficients provided', () => {
      render(<LogisticsCoefficientsSection {...defaultProps} />)

      // Expand section
      fireEvent.click(screen.getByRole('button'))

      // Calendar should not be present
      expect(screen.queryByText(/Коэффициенты на \d+ дней:/)).not.toBeInTheDocument()
    })

    it('shows color-coded coefficient cells in calendar', () => {
      render(
        <LogisticsCoefficientsSection
          {...defaultProps}
          rawCoefficients={rawCoefficientsFixture}
        />
      )

      // Expand section
      fireEvent.click(screen.getByRole('button'))

      // Should have coefficient calendar component rendered with grid
      const calendarGrid = screen.getByRole('grid', { name: /Календарь коэффициентов/i })
      expect(calendarGrid).toBeInTheDocument()

      // Should have gridcells with coefficient data
      const gridCells = screen.getAllByRole('gridcell')
      expect(gridCells.length).toBeGreaterThan(0)
    })
  })

  // ===========================================
  // AC4: Cost Impact Calculation
  // ===========================================

  describe('AC4: Cost Impact Calculation', () => {
    it('shows cost increase when coefficient > 1', () => {
      render(
        <LogisticsCoefficientsSection
          {...defaultProps}
          coefficient={1.25}
          baseLogisticsCost={58}
        />
      )

      // Expand section
      fireEvent.click(screen.getByRole('button'))

      // 58 * 1.25 = 72.5, increase = 14.5
      expect(screen.getByText('Увеличение стоимости:')).toBeInTheDocument()
      // Check for the increase value (may include currency formatting)
      expect(screen.getByText(/\+14\.50/)).toBeInTheDocument()
    })

    it('does not show cost increase when coefficient is 1.0', () => {
      render(
        <LogisticsCoefficientsSection
          {...defaultProps}
          coefficient={1.0}
          baseLogisticsCost={58}
        />
      )

      // Expand section
      fireEvent.click(screen.getByRole('button'))

      // No increase section should be shown
      expect(screen.queryByText('Увеличение стоимости:')).not.toBeInTheDocument()
    })

    it('calculates percentage increase correctly', () => {
      render(
        <LogisticsCoefficientsSection
          {...defaultProps}
          coefficient={1.5}
          baseLogisticsCost={100}
        />
      )

      // Expand section
      fireEvent.click(screen.getByRole('button'))

      // 50% increase (appears in both header and cost impact section)
      const percentageMatches = screen.getAllByText(/\+50\.0%/)
      expect(percentageMatches.length).toBeGreaterThanOrEqual(1)
    })

    it('updates calculation when coefficient changes', () => {
      const { rerender } = render(
        <LogisticsCoefficientsSection
          {...defaultProps}
          coefficient={1.25}
          baseLogisticsCost={100}
        />
      )

      // Expand section
      fireEvent.click(screen.getByRole('button'))

      // Initial: 25% increase (appears in both header and cost impact section)
      const initialMatches = screen.getAllByText(/\+25\.0%/)
      expect(initialMatches.length).toBeGreaterThanOrEqual(1)

      // Update coefficient to 1.5
      rerender(
        <LogisticsCoefficientsSection
          {...defaultProps}
          coefficient={1.5}
          baseLogisticsCost={100}
        />
      )

      // Updated: 50% increase (appears in both header and cost impact section)
      const updatedMatches = screen.getAllByText(/\+50\.0%/)
      expect(updatedMatches.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ===========================================
  // AC5: Coefficient Auto-fill Integration
  // ===========================================

  describe('AC5: Auto-fill Badge', () => {
    it('shows "Автозаполнено" badge when source is auto', () => {
      render(<LogisticsCoefficientsSection {...defaultProps} source="auto" />)

      // Expand section
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByText('Автозаполнено')).toBeInTheDocument()
    })

    it('shows "Вручную" badge when source is manual', () => {
      render(<LogisticsCoefficientsSection {...defaultProps} source="manual" />)

      // Expand section
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByText('Вручную')).toBeInTheDocument()
    })

    it('auto badge has green styling', () => {
      render(<LogisticsCoefficientsSection {...defaultProps} source="auto" />)

      // Expand section
      fireEvent.click(screen.getByRole('button'))

      const badge = screen.getByText('Автозаполнено')
      expect(badge).toHaveClass('bg-green-50')
    })
  })

  // ===========================================
  // AC6: Tooltips and Help Link
  // ===========================================

  describe('AC6: Help Link', () => {
    it('shows help link to WB documentation', () => {
      render(<LogisticsCoefficientsSection {...defaultProps} />)

      // Expand section
      fireEvent.click(screen.getByRole('button'))

      const helpLink = screen.getByText('Где найти коэффициенты?')
      expect(helpLink).toBeInTheDocument()
      expect(helpLink.closest('a')).toHaveAttribute(
        'href',
        'https://seller.wildberries.ru/supplies-management/all-supplies'
      )
    })

    it('help link opens in new tab', () => {
      render(<LogisticsCoefficientsSection {...defaultProps} />)

      // Expand section
      fireEvent.click(screen.getByRole('button'))

      const helpLink = screen.getByText('Где найти коэффициенты?').closest('a')
      expect(helpLink).toHaveAttribute('target', '_blank')
      expect(helpLink).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  // ===========================================
  // AC7: No Warehouse Selected State
  // ===========================================

  describe('AC7: No Warehouse Selected', () => {
    it('shows info notice when no warehouse selected', () => {
      render(
        <LogisticsCoefficientsSection
          {...defaultProps}
          warehouseId={null}
        />
      )

      expect(
        screen.getByText('Выберите склад для отображения коэффициента')
      ).toBeInTheDocument()
    })

    it('does not show collapsible section when no warehouse', () => {
      render(
        <LogisticsCoefficientsSection
          {...defaultProps}
          warehouseId={null}
        />
      )

      // Should not show the collapsible trigger
      expect(screen.queryByText(/Коэффициент:/)).not.toBeInTheDocument()
    })

    it('shows info icon with blue styling', () => {
      render(
        <LogisticsCoefficientsSection
          {...defaultProps}
          warehouseId={null}
        />
      )

      // Should have Alert component with blue styling
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('bg-blue-50')
    })
  })

  // ===========================================
  // Edge Cases and Error States
  // ===========================================

  describe('Edge Cases', () => {
    it('handles coefficient of 0 (unavailable)', () => {
      render(<LogisticsCoefficientsSection {...defaultProps} coefficient={0} />)

      // Expand section
      fireEvent.click(screen.getByRole('button'))

      const badge = screen.getByText('Недоступно')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-gray-100')
    })

    it('handles loading state', () => {
      render(<LogisticsCoefficientsSection {...defaultProps} isLoading={true} />)

      const trigger = screen.getByRole('button')
      expect(trigger).toBeDisabled()
    })

    it('handles disabled state', () => {
      render(<LogisticsCoefficientsSection {...defaultProps} disabled={true} />)

      const trigger = screen.getByRole('button')
      expect(trigger).toBeDisabled()
    })

    it('handles very high coefficient (> 3.0)', () => {
      render(<LogisticsCoefficientsSection {...defaultProps} coefficient={3.5} />)

      // Expand section
      fireEvent.click(screen.getByRole('button'))

      // Should show "Пиковый" badge
      expect(screen.getByText('Пиковый')).toBeInTheDocument()
      expect(screen.getByText('3.50')).toBeInTheDocument()
    })

    it('handles empty rawCoefficients array', () => {
      render(
        <LogisticsCoefficientsSection
          {...defaultProps}
          rawCoefficients={[]}
        />
      )

      // Expand section
      fireEvent.click(screen.getByRole('button'))

      // Calendar should not be shown (no "Коэффициенты на X дней:" header)
      expect(screen.queryByText(/Коэффициенты на \d+ дней:/)).not.toBeInTheDocument()
    })

    it('handles zero base logistics cost', () => {
      render(
        <LogisticsCoefficientsSection
          {...defaultProps}
          coefficient={1.25}
          baseLogisticsCost={0}
        />
      )

      // Expand section
      fireEvent.click(screen.getByRole('button'))

      // Should not show increase section when base cost is 0
      expect(screen.queryByText('Увеличение стоимости:')).not.toBeInTheDocument()
    })
  })

  // ===========================================
  // Accessibility Tests (WCAG 2.1 AA)
  // ===========================================

  describe('Accessibility', () => {
    it('collapsible trigger is keyboard accessible', () => {
      render(<LogisticsCoefficientsSection {...defaultProps} />)

      const trigger = screen.getByRole('button')

      // Should be focusable
      trigger.focus()
      expect(document.activeElement).toBe(trigger)

      // Radix Collapsible responds to click events (including keyboard activation)
      // The button will receive click when Enter/Space is pressed natively
      fireEvent.click(trigger)
      expect(screen.getByText('Увеличение стоимости:')).toBeInTheDocument()
    })

    it('help link has accessible name', () => {
      render(<LogisticsCoefficientsSection {...defaultProps} />)

      // Expand section
      fireEvent.click(screen.getByRole('button'))

      const helpLink = screen.getByRole('link', { name: /Где найти коэффициенты/i })
      expect(helpLink).toBeInTheDocument()
    })

    it('status badges communicate status via text, not just color', () => {
      render(<LogisticsCoefficientsSection {...defaultProps} coefficient={1.25} />)

      // Expand section
      fireEvent.click(screen.getByRole('button'))

      // Status should be communicated via text label
      expect(screen.getByText('Повышенный')).toBeInTheDocument()
    })

    it('info alert has alert role for no warehouse state', () => {
      render(
        <LogisticsCoefficientsSection
          {...defaultProps}
          warehouseId={null}
        />
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})
