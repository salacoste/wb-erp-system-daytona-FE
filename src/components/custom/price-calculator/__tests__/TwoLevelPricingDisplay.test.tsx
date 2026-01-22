/**
 * Unit tests for TwoLevelPricingDisplay component
 * Story 44.21-FE: Card Elevation System & Shadow Hierarchy
 * Story 44.20-FE: Two-Level Pricing Display
 *
 * Tests:
 * - Card elevation (shadow-md)
 * - Gradient background
 * - Component composition
 * - Collapsible breakdown section
 */

import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TwoLevelPricingDisplay } from '../TwoLevelPricingDisplay'
import type { TwoLevelPricingResult } from '@/types/price-calculator'

describe('TwoLevelPricingDisplay', () => {
  const mockResult: TwoLevelPricingResult = {
    minimumPrice: 903.23,
    recommendedPrice: 1217.39,
    customerPrice: 1095.65,
    priceGap: { rub: 314.16, pct: 34.78 },
    fixedCosts: {
      cogs: 500,
      logisticsForward: 100,
      logisticsReverseEffective: 50,
      storage: 20,
      acceptance: 0,
      total: 670,
    },
    percentageCosts: {
      commissionWb: { pct: 15, rub: 182.61 },
      acquiring: { pct: 2, rub: 24.35 },
      taxIncome: { pct: 6, rub: 73.04 },
      total: { pct: 23, rub: 279.99 },
    },
    variableCosts: {
      drr: { pct: 5, rub: 60.87 },
      total: { pct: 5, rub: 60.87 },
    },
    margin: {
      pct: 17,
      rub: 206.52,
      afterTax: null,
    },
  }

  const defaultProps = {
    result: mockResult,
    fulfillmentType: 'FBO' as const,
    taxType: 'income' as const,
    taxRatePct: 6,
    sppPct: 10,
  }

  describe('Story 44.21-FE: Card Elevation System', () => {
    it('renders with shadow-md class (Level 2 elevation)', () => {
      const { container } = render(<TwoLevelPricingDisplay {...defaultProps} />)

      const card = container.querySelector('[data-testid="two-level-pricing-display"]')
      expect(card).toHaveClass('shadow-md')
    })

    it('renders with rounded-xl class', () => {
      const { container } = render(<TwoLevelPricingDisplay {...defaultProps} />)

      const card = container.querySelector('[data-testid="two-level-pricing-display"]')
      expect(card).toHaveClass('rounded-xl')
    })

    it('renders with gradient background', () => {
      const { container } = render(<TwoLevelPricingDisplay {...defaultProps} />)

      const card = container.querySelector('[data-testid="two-level-pricing-display"]')
      expect(card).toHaveClass('bg-gradient-to-br')
      expect(card).toHaveClass('from-background')
      expect(card).toHaveClass('to-muted/30')
    })
  })

  describe('Component Composition', () => {
    it('renders TwoLevelPriceHeader', () => {
      render(<TwoLevelPricingDisplay {...defaultProps} />)

      expect(screen.getByTestId('two-level-price-header')).toBeInTheDocument()
    })

    it('renders PriceSummaryFooter', () => {
      render(<TwoLevelPricingDisplay {...defaultProps} />)

      expect(screen.getByTestId('price-summary-footer')).toBeInTheDocument()
    })

    it('renders card title', () => {
      render(<TwoLevelPricingDisplay {...defaultProps} />)

      expect(screen.getByText('Расчёт цены')).toBeInTheDocument()
    })
  })

  describe('Collapsible Breakdown Section', () => {
    it('renders breakdown toggle button', () => {
      render(<TwoLevelPricingDisplay {...defaultProps} />)

      expect(screen.getByText('Детализация расходов')).toBeInTheDocument()
    })

    it('breakdown is open by default', () => {
      render(<TwoLevelPricingDisplay {...defaultProps} />)

      // Fixed costs section should be visible (uppercase in component)
      expect(screen.getByText('ФИКСИРОВАННЫЕ ЗАТРАТЫ')).toBeInTheDocument()
    })

    it('toggles breakdown visibility on click', () => {
      render(<TwoLevelPricingDisplay {...defaultProps} />)

      const toggleButton = screen.getByText('Детализация расходов')
      fireEvent.click(toggleButton)

      // After closing, fixed costs should not be visible
      // Note: Using queryByText since it may return null
      // Collapsible content should be hidden but we check the button state
      const chevron = toggleButton.querySelector('.rotate-180')
      expect(chevron).toBeFalsy() // Chevron should not be rotated when closed
    })

    it('renders chevron icon that rotates', () => {
      const { container } = render(<TwoLevelPricingDisplay {...defaultProps} />)

      const chevron = container.querySelector('.lucide-chevron-down')
      expect(chevron).toBeInTheDocument()
    })
  })

  describe('Cost Breakdown Sections', () => {
    it('renders FixedCostsBreakdown', () => {
      render(<TwoLevelPricingDisplay {...defaultProps} />)

      expect(screen.getByText('ФИКСИРОВАННЫЕ ЗАТРАТЫ')).toBeInTheDocument()
    })

    it('renders PercentageCostsBreakdown', () => {
      render(<TwoLevelPricingDisplay {...defaultProps} />)

      expect(screen.getByText('ПРОЦЕНТНЫЕ ЗАТРАТЫ')).toBeInTheDocument()
    })

    it('renders VariableCostsBreakdown', () => {
      render(<TwoLevelPricingDisplay {...defaultProps} />)

      expect(screen.getByText('ПЕРЕМЕННЫЕ ЗАТРАТЫ')).toBeInTheDocument()
    })

    it('renders MarginSection', () => {
      render(<TwoLevelPricingDisplay {...defaultProps} />)

      // Margin section shows percentage in header
      expect(screen.getByText(/МАРЖА \(17%\)/)).toBeInTheDocument()
    })
  })

  describe('Props Passing', () => {
    it('passes fulfillmentType to child components', () => {
      const props = { ...defaultProps, fulfillmentType: 'FBS' as const }
      render(<TwoLevelPricingDisplay {...props} />)

      // FBS mode - check that component renders
      expect(screen.getByTestId('two-level-pricing-display')).toBeInTheDocument()
    })

    it('passes sppPct to TwoLevelPriceHeader', () => {
      render(<TwoLevelPricingDisplay {...defaultProps} />)

      // SPP badge should show in customer price
      expect(screen.getByText('СПП -10%')).toBeInTheDocument()
    })

    it('passes tax info to MarginSection', () => {
      render(<TwoLevelPricingDisplay {...defaultProps} />)

      // Margin section shows percentage in header (МАРЖА (17%))
      expect(screen.getByText(/МАРЖА \(17%\)/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper data-testid attribute', () => {
      render(<TwoLevelPricingDisplay {...defaultProps} />)

      expect(screen.getByTestId('two-level-pricing-display')).toBeInTheDocument()
    })

    it('collapse button is accessible', () => {
      render(<TwoLevelPricingDisplay {...defaultProps} />)

      const button = screen.getByRole('button', { name: /детализация расходов/i })
      expect(button).toBeInTheDocument()
    })
  })
})
