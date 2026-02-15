/**
 * TDD Tests for PenaltiesCard & CompensationsCard (RED phase)
 * Story 65.12: Penalties & Compensations Split
 *
 * Tests separate display of penalties (fines) and compensations (corrections),
 * sign-based classification, currency formatting, and period comparison.
 *
 * Backend dependency: Request #142 — Extended finance-summary with
 * penalties_amount and corrections_amount fields.
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-3.md
 * @see docs/epics/epic-65-dashboard-metrics-parity/backend-gap-analysis.md
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'

// Components that DO NOT EXIST yet (TDD RED phase)
import { PenaltiesCard } from '@/components/custom/dashboard/PenaltiesCard'
import { CompensationsCard } from '@/components/custom/dashboard/CompensationsCard'

// Mock factories
import { createFinanceSummaryMock } from './mocks/api-mocks'

// =============================================================================
// PenaltiesCard Tests — Story 65.12
// =============================================================================

describe('PenaltiesCard', () => {
  const currentData = createFinanceSummaryMock()

  /**
   * AC-65.12.1: Card "Штрафы" shows currency with red indication
   */
  describe('penalties display', () => {
    it('renders penalties_amount formatted as currency', () => {
      renderWithProviders(
        <PenaltiesCard
          value={currentData.penalties_amount!}
          previousValue={null}
          revenueTotal={currentData.sales_gross_total}
          isLoading={false}
        />
      )

      // 1 200 ₽
      expect(screen.getByText(/1\s?200/)).toBeInTheDocument()
      expect(screen.getByText(/₽/)).toBeInTheDocument()
    })

    it('displays card title as "Штрафы"', () => {
      renderWithProviders(
        <PenaltiesCard value={1200} previousValue={null} revenueTotal={null} isLoading={false} />
      )

      expect(screen.getByText('Штрафы')).toBeInTheDocument()
    })
  })

  /**
   * AC-65.12.6: % от выр. = value / sales_gross_total * 100
   */
  describe('revenue percentage', () => {
    it('shows percentage of revenue', () => {
      renderWithProviders(
        <PenaltiesCard value={1200} previousValue={null} revenueTotal={153220} isLoading={false} />
      )

      // 1200 / 153220 * 100 = ~0.78%
      expect(screen.getByText(/0[,.]8/)).toBeInTheDocument()
      expect(screen.getByText(/от выручки/)).toBeInTheDocument()
    })
  })

  /**
   * AC-65.12.3: Comparison with previous period
   * AC-65.12.4: Penalties growth = bad (inverted comparison)
   */
  describe('period comparison', () => {
    it('shows comparison with previous period', () => {
      renderWithProviders(
        <PenaltiesCard value={1200} previousValue={900} revenueTotal={153220} isLoading={false} />
      )

      // Increase from 900 to 1200 = +33.3%
      expect(screen.getByText(/33/)).toBeInTheDocument()
    })

    it('uses inverted comparison: increase in penalties = negative (red)', () => {
      renderWithProviders(
        <PenaltiesCard value={1200} previousValue={900} revenueTotal={null} isLoading={false} />
      )

      // Growth in penalties is bad — should show negative direction
      const indicator = screen.getByTestId('trend-indicator')
      expect(indicator).toHaveClass('text-red-500')
    })

    it('uses inverted comparison: decrease in penalties = positive (green)', () => {
      renderWithProviders(
        <PenaltiesCard value={600} previousValue={900} revenueTotal={null} isLoading={false} />
      )

      // Decrease in penalties is good — should show positive direction
      const indicator = screen.getByTestId('trend-indicator')
      expect(indicator).toHaveClass('text-green-500')
    })
  })

  describe('edge cases', () => {
    it('handles zero penalties', () => {
      renderWithProviders(
        <PenaltiesCard value={0} previousValue={null} revenueTotal={null} isLoading={false} />
      )

      const valueEl = screen.getByTestId('metric-value')
      expect(valueEl.textContent).toMatch(/0/)
      expect(valueEl.textContent).not.toBe('—')
    })

    it('shows "—" when value is null', () => {
      renderWithProviders(
        <PenaltiesCard value={null} previousValue={null} revenueTotal={null} isLoading={false} />
      )

      expect(screen.getByTestId('metric-value')).toHaveTextContent('—')
    })

    it('shows skeleton while loading', () => {
      const { container } = renderWithProviders(
        <PenaltiesCard value={null} previousValue={null} revenueTotal={null} isLoading={true} />
      )

      expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    })
  })
})

// =============================================================================
// CompensationsCard Tests — Story 65.12
// =============================================================================

describe('CompensationsCard', () => {
  /**
   * AC-65.12.2: Card "Компенсации" shows currency with green indication
   */
  describe('compensations display', () => {
    it('renders corrections_amount formatted as currency', () => {
      renderWithProviders(
        <CompensationsCard value={850} previousValue={null} revenueTotal={null} isLoading={false} />
      )

      expect(screen.getByText(/850/)).toBeInTheDocument()
      expect(screen.getByText(/₽/)).toBeInTheDocument()
    })

    it('displays card title as "Компенсации"', () => {
      renderWithProviders(
        <CompensationsCard value={850} previousValue={null} revenueTotal={null} isLoading={false} />
      )

      expect(screen.getByText('Компенсации')).toBeInTheDocument()
    })
  })

  /**
   * AC-65.12.6: % от выр. = value / sales_gross_total * 100
   */
  describe('revenue percentage', () => {
    it('shows percentage of revenue for compensations', () => {
      renderWithProviders(
        <CompensationsCard
          value={850}
          previousValue={null}
          revenueTotal={153220}
          isLoading={false}
        />
      )

      // 850 / 153220 * 100 = ~0.55%
      expect(screen.getByText(/0[,.]6/)).toBeInTheDocument()
      expect(screen.getByText(/от выручки/)).toBeInTheDocument()
    })
  })

  /**
   * AC-65.12.5: Compensations growth = good (direct comparison)
   */
  describe('period comparison', () => {
    it('uses direct comparison: increase in compensations = positive (green)', () => {
      renderWithProviders(
        <CompensationsCard value={850} previousValue={600} revenueTotal={null} isLoading={false} />
      )

      // Growth in compensations is good — should show positive direction
      const indicator = screen.getByTestId('trend-indicator')
      expect(indicator).toHaveClass('text-green-500')
    })

    it('uses direct comparison: decrease in compensations = negative (red)', () => {
      renderWithProviders(
        <CompensationsCard value={400} previousValue={600} revenueTotal={null} isLoading={false} />
      )

      // Decrease in compensations is bad — should show negative direction
      const indicator = screen.getByTestId('trend-indicator')
      expect(indicator).toHaveClass('text-red-500')
    })
  })

  describe('edge cases', () => {
    it('handles empty corrections array (no compensations)', () => {
      renderWithProviders(
        <CompensationsCard value={0} previousValue={null} revenueTotal={null} isLoading={false} />
      )

      const valueEl = screen.getByTestId('metric-value')
      expect(valueEl.textContent).toMatch(/0/)
    })

    it('shows "—" when value is null', () => {
      renderWithProviders(
        <CompensationsCard
          value={null}
          previousValue={null}
          revenueTotal={null}
          isLoading={false}
        />
      )

      expect(screen.getByTestId('metric-value')).toHaveTextContent('—')
    })

    it('hides comparison when previousValue is null', () => {
      renderWithProviders(
        <CompensationsCard value={850} previousValue={null} revenueTotal={null} isLoading={false} />
      )

      expect(screen.queryByTestId('trend-indicator')).not.toBeInTheDocument()
    })
  })
})
