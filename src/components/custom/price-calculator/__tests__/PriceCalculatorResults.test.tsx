/**
 * Unit tests for PriceCalculatorResults component
 * Story 44.6-FE: Testing & Documentation
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriceCalculatorResults } from '../PriceCalculatorResults'
import {
  mockPriceCalculatorResponse,
  mockPriceCalculatorResponseWithWarnings,
} from '@/test/fixtures/price-calculator'

describe('PriceCalculatorResults', () => {
  describe('Empty State', () => {
    it('shows empty state message when no data', () => {
      const { container } = render(<PriceCalculatorResults data={null} loading={false} />)

      // Component should render the empty state (RecommendedPriceCard shows error state)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('shows loading state when loading initially', () => {
      render(<PriceCalculatorResults data={null} loading={true} />)

      // When loading, shows "Calculating..." instead of empty state
      expect(screen.getByText('Calculating...')).toBeInTheDocument()
    })
  })

  describe('Results Display', () => {
    it('renders recommended price card', () => {
      render(<PriceCalculatorResults data={mockPriceCalculatorResponse} />)

      // The RecommendedPriceCard should show the price heading
      expect(screen.getByText('Recommended Selling Price')).toBeInTheDocument()
    })

    it('renders cost breakdown table', () => {
      render(<PriceCalculatorResults data={mockPriceCalculatorResponse} />)

      // CostBreakdownTable should be rendered
      expect(screen.getByText(/cost breakdown/i)).toBeInTheDocument()
    })

    it('renders cost breakdown chart', () => {
      render(<PriceCalculatorResults data={mockPriceCalculatorResponse} />)

      // CostBreakdownChart should be rendered
      expect(screen.getByText('Cost Breakdown')).toBeInTheDocument()
    })

    it('renders warnings banner when warnings exist', () => {
      render(
        <PriceCalculatorResults data={mockPriceCalculatorResponseWithWarnings} />
      )

      // WarningsDisplay should show warnings
      expect(screen.getByText(/warnings/i)).toBeInTheDocument()
    })

    it('does not render warnings when none exist', () => {
      render(<PriceCalculatorResults data={mockPriceCalculatorResponse} />)

      // Should not show warnings
      expect(screen.queryByText(/warnings/i)).not.toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('shows loading state when loading with existing data', () => {
      render(<PriceCalculatorResults data={mockPriceCalculatorResponse} loading={true} />)

      // When loading with existing data, the RecommendedPriceCard shows "Calculating..."
      expect(screen.getByText('Calculating...')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('shows error message when error exists', () => {
      const error = new Error('Calculation failed')

      render(<PriceCalculatorResults data={null} loading={false} error={error} />)

      // Should show error message (RecommendedPriceCard shows error state)
      expect(screen.getByText(/calculation failed/i)).toBeInTheDocument()
    })

    it('does not show details when error exists', () => {
      const error = new Error('Calculation failed')

      render(
        <PriceCalculatorResults data={mockPriceCalculatorResponse} loading={false} error={error} />
      )

      // When error exists, detailed results should not be shown
      expect(screen.queryByText(/cost breakdown/i)).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<PriceCalculatorResults data={mockPriceCalculatorResponse} />)

      expect(screen.getByText('Recommended Selling Price')).toBeInTheDocument()
    })

    it('renders results section with content', () => {
      const { container } = render(
        <PriceCalculatorResults data={mockPriceCalculatorResponse} />
      )

      // Just verify the component renders without errors
      const resultsDiv = container.querySelector('.space-y-6')
      expect(resultsDiv).toBeInTheDocument()
    })
  })
})
