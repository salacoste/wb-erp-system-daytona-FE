/**
 * TDD Tests for Story 65.3: ROI Card (Return on Investment)
 * RED phase — all tests expected to FAIL (component does not exist yet).
 *
 * ROI = gross_profit / cogs_total * 100
 * Comparison uses percentage points (п.п.), NOT relative %.
 * Guards: grossProfit != null AND cogsTotal != null AND cogsTotal > 0
 *
 * @see Story 65.3, AC-65.3.1 through AC-65.3.5
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'

// Component under test — DOES NOT EXIST YET (TDD Red phase)
import { RoiCard } from '../../RoiCard'

// =============================================================================
// AC-65.3.1: Displays ROI as percentage with TrendingUp icon
// =============================================================================

describe('RoiCard', () => {
  describe('AC-65.3.1: displays ROI percentage', () => {
    it('renders ROI = gross_profit / cogs_total * 100 with 1 decimal', () => {
      // 350_000 / 600_000 * 100 = 58.3%
      renderWithProviders(<RoiCard grossProfit={350_000} cogsTotal={600_000} isLoading={false} />)

      expect(screen.getByText(/58,3\s*%/)).toBeInTheDocument()
    })

    it('renders high ROI correctly', () => {
      // 900_000 / 600_000 * 100 = 150.0%
      renderWithProviders(<RoiCard grossProfit={900_000} cogsTotal={600_000} isLoading={false} />)

      expect(screen.getByText(/150,0\s*%/)).toBeInTheDocument()
    })

    it('renders negative ROI when gross_profit is negative', () => {
      // -100_000 / 600_000 * 100 = -16.7%
      renderWithProviders(<RoiCard grossProfit={-100_000} cogsTotal={600_000} isLoading={false} />)

      expect(screen.getByText(/-16,7\s*%/)).toBeInTheDocument()
    })

    it('has an article role for accessibility', () => {
      renderWithProviders(<RoiCard grossProfit={350_000} cogsTotal={600_000} isLoading={false} />)

      expect(screen.getByRole('article')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // AC-65.3.2: Comparison in percentage points (п.п.)
  // ===========================================================================

  describe('AC-65.3.2: comparison in percentage points', () => {
    it('shows positive pp difference when ROI increased', () => {
      // Current: 350_000 / 600_000 * 100 = 58.3%
      // Previous: 320_000 / 580_000 * 100 = 55.2%
      // Diff = 58.3 - 55.2 = +3.2 п.п.
      renderWithProviders(
        <RoiCard
          grossProfit={350_000}
          cogsTotal={600_000}
          previousGrossProfit={320_000}
          previousCogsTotal={580_000}
          isLoading={false}
        />
      )

      expect(screen.getByText(/\+3,2\s*п\.п\./)).toBeInTheDocument()
    })

    it('shows negative pp difference when ROI decreased', () => {
      // Current: 320_000 / 580_000 * 100 = 55.2%
      // Previous: 350_000 / 600_000 * 100 = 58.3%
      // Diff = 55.2 - 58.3 = -3.2 п.п.
      renderWithProviders(
        <RoiCard
          grossProfit={320_000}
          cogsTotal={580_000}
          previousGrossProfit={350_000}
          previousCogsTotal={600_000}
          isLoading={false}
        />
      )

      expect(screen.getByText(/-3,2\s*п\.п\./)).toBeInTheDocument()
    })

    it('uses green for positive ROI increase', () => {
      renderWithProviders(
        <RoiCard
          grossProfit={350_000}
          cogsTotal={600_000}
          previousGrossProfit={320_000}
          previousCogsTotal={580_000}
          isLoading={false}
        />
      )

      const ppElement = screen.getByText(/\+3,2\s*п\.п\./)
      expect(ppElement.className).toMatch(/green/)
    })

    it('uses red for negative ROI decrease', () => {
      renderWithProviders(
        <RoiCard
          grossProfit={320_000}
          cogsTotal={580_000}
          previousGrossProfit={350_000}
          previousCogsTotal={600_000}
          isLoading={false}
        />
      )

      const ppElement = screen.getByText(/-3,2\s*п\.п\./)
      expect(ppElement.className).toMatch(/red/)
    })

    it('does not show comparison when previous data is missing', () => {
      renderWithProviders(<RoiCard grossProfit={350_000} cogsTotal={600_000} isLoading={false} />)

      expect(screen.queryByText(/п\.п\./)).not.toBeInTheDocument()
    })

    it('does not show comparison when previous cogsTotal is null', () => {
      renderWithProviders(
        <RoiCard
          grossProfit={350_000}
          cogsTotal={600_000}
          previousGrossProfit={320_000}
          previousCogsTotal={null}
          isLoading={false}
        />
      )

      expect(screen.queryByText(/п\.п\./)).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // AC-65.3.3: Color coding by ROI threshold
  // ===========================================================================

  describe('AC-65.3.3: value color coding', () => {
    it('shows green when ROI > 100%', () => {
      // 900_000 / 600_000 * 100 = 150.0%
      renderWithProviders(<RoiCard grossProfit={900_000} cogsTotal={600_000} isLoading={false} />)

      const valueElement = screen.getByText(/150,0\s*%/)
      expect(valueElement.className).toMatch(/green/)
    })

    it('shows yellow when ROI is 50-100%', () => {
      // 350_000 / 600_000 * 100 = 58.3%
      renderWithProviders(<RoiCard grossProfit={350_000} cogsTotal={600_000} isLoading={false} />)

      const valueElement = screen.getByText(/58,3\s*%/)
      expect(valueElement.className).toMatch(/yellow/)
    })

    it('shows red when ROI < 50%', () => {
      // 200_000 / 600_000 * 100 = 33.3%
      renderWithProviders(<RoiCard grossProfit={200_000} cogsTotal={600_000} isLoading={false} />)

      const valueElement = screen.getByText(/33,3\s*%/)
      expect(valueElement.className).toMatch(/red/)
    })
  })

  // ===========================================================================
  // AC-65.3.4: Graceful degradation with "Заполнить COGS" link
  // ===========================================================================

  describe('AC-65.3.4: graceful degradation', () => {
    it('shows "---" when grossProfit is null', () => {
      renderWithProviders(<RoiCard grossProfit={null} cogsTotal={600_000} isLoading={false} />)

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('shows "---" when cogsTotal is null', () => {
      renderWithProviders(<RoiCard grossProfit={350_000} cogsTotal={null} isLoading={false} />)

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('shows "---" when cogsTotal is 0 (division by zero)', () => {
      renderWithProviders(<RoiCard grossProfit={350_000} cogsTotal={0} isLoading={false} />)

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('shows "Заполнить COGS" link when data unavailable', () => {
      renderWithProviders(<RoiCard grossProfit={null} cogsTotal={null} isLoading={false} />)

      const cogsLink = screen.getByText(/Заполнить COGS/i)
      expect(cogsLink).toBeInTheDocument()
      // Should link to COGS route
      expect(cogsLink.closest('a')).toHaveAttribute('href', expect.stringContaining('cogs'))
    })

    it('shows skeleton when loading', () => {
      renderWithProviders(<RoiCard grossProfit={null} cogsTotal={null} isLoading={true} />)

      expect(
        screen.queryByTestId('roi-card-skeleton') || screen.queryByRole('article', { busy: true })
      ).toBeTruthy()
    })
  })

  // ===========================================================================
  // AC-65.3.5: Tooltip content
  // ===========================================================================

  describe('AC-65.3.5: tooltip', () => {
    it('has tooltip explaining ROI formula', () => {
      renderWithProviders(<RoiCard grossProfit={350_000} cogsTotal={600_000} isLoading={false} />)

      const tooltipButton = screen.getByLabelText(/подробнее/i)
      expect(tooltipButton).toBeInTheDocument()
    })
  })
})
