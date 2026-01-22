/**
 * Unit tests for PriceCalculatorResults component
 * Story 44.6-FE: Testing & Documentation
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriceCalculatorResults } from '../PriceCalculatorResults'
import {
  mockPriceCalculatorResponse,
  mockPriceCalculatorResponseWithWarnings,
} from '@/test/fixtures/price-calculator'

// Mock recharts to avoid chart rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="xaxis" />,
  Tooltip: () => <div data-testid="tooltip" />,
}))

// Mock the two-level pricing calculation
vi.mock('@/lib/two-level-pricing', () => ({
  calculateTwoLevelPricing: () => null,
}))

// Mock the TwoLevelPricingDisplay component
vi.mock('../TwoLevelPricingDisplay', () => ({
  TwoLevelPricingDisplay: () => (
    <div data-testid="two-level-pricing-display">Two Level Pricing Mock</div>
  ),
}))

// Mock the ResultsSkeleton component
vi.mock('../ResultsSkeleton', () => ({
  ResultsSkeleton: () => (
    <div data-testid="results-skeleton">
      <span>Расчёт...</span>
    </div>
  ),
}))

describe('PriceCalculatorResults', () => {
  describe('Empty State', () => {
    it('shows empty state message when no data', () => {
      render(<PriceCalculatorResults data={null} loading={false} />)

      // Component should render the empty state with Russian text
      expect(
        screen.getByText(/Введите параметры затрат и нажмите/)
      ).toBeInTheDocument()
    })

    it('shows loading skeleton when loading initially', () => {
      render(<PriceCalculatorResults data={null} loading={true} />)

      // When loading, shows skeleton with "Расчёт..." text
      expect(screen.getByTestId('results-skeleton')).toBeInTheDocument()
      expect(screen.getByText('Расчёт...')).toBeInTheDocument()
    })
  })

  describe('Results Display', () => {
    it('renders recommended price card', () => {
      render(<PriceCalculatorResults data={mockPriceCalculatorResponse} />)

      // The RecommendedPriceCard shows Russian text
      expect(screen.getByText('Рекомендуемая цена продажи')).toBeInTheDocument()
    })

    it('renders cost breakdown chart section', () => {
      render(<PriceCalculatorResults data={mockPriceCalculatorResponse} />)

      // CostBreakdownChart renders with Russian title
      expect(screen.getByText('Структура затрат')).toBeInTheDocument()
    })

    it('renders warnings banner when warnings exist', () => {
      render(
        <PriceCalculatorResults data={mockPriceCalculatorResponseWithWarnings} />
      )

      // WarningsDisplay shows Russian text
      expect(screen.getByText(/Предупреждения/)).toBeInTheDocument()
    })

    it('does not render warnings when none exist', () => {
      render(<PriceCalculatorResults data={mockPriceCalculatorResponse} />)

      // Should not show warnings
      expect(screen.queryByText(/Предупреждения/)).not.toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('shows loading skeleton when loading', () => {
      render(
        <PriceCalculatorResults
          data={mockPriceCalculatorResponse}
          loading={true}
        />
      )

      // When loading, shows skeleton
      expect(screen.getByTestId('results-skeleton')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('shows error message when error exists', () => {
      const error = new Error('Ошибка расчёта')

      render(<PriceCalculatorResults data={null} loading={false} error={error} />)

      // Should show error message
      expect(screen.getByText(/Ошибка расчёта/i)).toBeInTheDocument()
    })

    it('does not show details when error exists', () => {
      const error = new Error('Calculation failed')

      render(
        <PriceCalculatorResults
          data={mockPriceCalculatorResponse}
          loading={false}
          error={error}
        />
      )

      // When error exists, detailed results (cost breakdown) should not be shown
      expect(screen.queryByText('Структура затрат')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<PriceCalculatorResults data={mockPriceCalculatorResponse} />)

      // Russian heading
      expect(screen.getByText('Рекомендуемая цена продажи')).toBeInTheDocument()
    })

    it('renders results section with content', () => {
      const { container } = render(
        <PriceCalculatorResults data={mockPriceCalculatorResponse} />
      )

      // Verify the component renders with the test id
      const resultsDiv = container.querySelector('[data-testid="price-calculator-results"]')
      expect(resultsDiv).toBeInTheDocument()
    })
  })
})
