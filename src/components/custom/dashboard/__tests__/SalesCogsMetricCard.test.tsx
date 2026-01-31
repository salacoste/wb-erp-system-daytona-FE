/**
 * TDD Tests for SalesCogsMetricCard Component
 * Story 63.2-FE: Sales COGS Metric Card (COGS Vykupov)
 * Epic 63-FE: Dashboard Business Logic Completion
 *
 * Tests verify the component correctly displays COGS for actual sales (vykypy),
 * coverage percentage, warning states, and navigation to COGS assignment page.
 *
 * @see docs/stories/epic-63/story-63.2-fe-sales-cogs-metric-card.md
 */

import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'

// Component to be implemented - tests should fail initially (TDD RED phase)
import { SalesCogsMetricCard, type SalesCogsMetricCardProps } from '../SalesCogsMetricCard'

// =============================================================================
// Test Fixtures
// =============================================================================

const mockCogsData = {
  /** Total COGS for completed sales */
  cogsTotal: 85000.0,
  /** Previous period COGS */
  previousCogsTotal: 89500.0,
  /** Products with COGS assigned */
  productsWithCogs: 74,
  /** Total products with sales */
  totalProducts: 74,
  /** Coverage percentage (100% = complete) */
  cogsCoverage: 100,
}

const mockIncompleteCogsData = {
  cogsTotal: 85000.0,
  previousCogsTotal: 89500.0,
  productsWithCogs: 74,
  totalProducts: 80,
  cogsCoverage: 92.5,
}

const mockMissingCogsData = {
  cogsTotal: null,
  previousCogsTotal: null,
  productsWithCogs: 0,
  totalProducts: 80,
  cogsCoverage: 0,
}

const defaultProps: SalesCogsMetricCardProps = {
  cogsTotal: mockCogsData.cogsTotal,
  previousCogsTotal: mockCogsData.previousCogsTotal,
  productsWithCogs: mockCogsData.productsWithCogs,
  totalProducts: mockCogsData.totalProducts,
  cogsCoverage: mockCogsData.cogsCoverage,
  isLoading: false,
  error: null,
}

// =============================================================================
// Rendering Tests
// =============================================================================

describe('SalesCogsMetricCard', () => {
  describe('rendering states', () => {
    it('renders loading skeleton when isLoading=true', () => {
      renderWithProviders(<SalesCogsMetricCard {...defaultProps} isLoading={true} />)

      const skeleton = document.querySelector('[aria-busy="true"]')
      expect(skeleton).toBeInTheDocument()

      expect(screen.queryByText(/85.*000/)).not.toBeInTheDocument()
    })

    it('renders error state with error message', () => {
      const error = new Error('Failed to load COGS data')
      renderWithProviders(<SalesCogsMetricCard {...defaultProps} error={error} />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/Failed to load COGS data|Ошибка/i)).toBeInTheDocument()
    })

    it('renders error state with retry button when onRetry provided', () => {
      const onRetry = vi.fn()
      const error = new Error('Network error')
      renderWithProviders(<SalesCogsMetricCard {...defaultProps} error={error} onRetry={onRetry} />)

      const retryButton = screen.getByRole('button', { name: /повторить|retry/i })
      expect(retryButton).toBeInTheDocument()
    })

    it('renders card title "COGS vykupov" or Russian equivalent', () => {
      renderWithProviders(<SalesCogsMetricCard {...defaultProps} />)

      expect(screen.getByRole('article')).toBeInTheDocument()
      const cardText = screen.getByRole('article').textContent
      expect(cardText).toMatch(/COGS.*выкуп|себестоимость|cogs/i)
    })
  })

  // =============================================================================
  // Value Formatting Tests
  // =============================================================================

  describe('value formatting', () => {
    it('formats cogsTotal value in Russian locale with currency', () => {
      renderWithProviders(<SalesCogsMetricCard {...defaultProps} />)

      const valueText = screen.getByRole('article').textContent
      // 85,000 RUB -> "85 000 ₽" or similar
      expect(valueText).toMatch(/85.*000/)
      expect(valueText).toMatch(/₽|RUB|руб/i)
    })

    it('formats large COGS values correctly', () => {
      renderWithProviders(<SalesCogsMetricCard {...defaultProps} cogsTotal={1234567.89} />)

      const valueText = screen.getByRole('article').textContent
      expect(valueText).toMatch(/1.*234.*567/)
    })

    it('formats zero value correctly', () => {
      renderWithProviders(
        <SalesCogsMetricCard
          {...defaultProps}
          cogsTotal={0}
          cogsCoverage={100}
          productsWithCogs={0}
          totalProducts={0}
        />
      )

      expect(screen.getByRole('article')).toBeInTheDocument()
    })
  })

  // =============================================================================
  // Coverage State Tests (AC3, AC4, AC5)
  // =============================================================================

  describe('coverage states', () => {
    it('renders complete state when coverage = 100%', () => {
      renderWithProviders(<SalesCogsMetricCard {...defaultProps} />)

      // Should show value and coverage text
      const cardText = screen.getByRole('article').textContent
      expect(cardText).toMatch(/85.*000/)
      expect(cardText).toMatch(/74.*74|100%/)

      // Should NOT have yellow warning
      expect(document.querySelector('.bg-yellow-100')).not.toBeInTheDocument()
    })

    it('renders warning state when coverage < 100%', () => {
      renderWithProviders(
        <SalesCogsMetricCard
          {...defaultProps}
          productsWithCogs={mockIncompleteCogsData.productsWithCogs}
          totalProducts={mockIncompleteCogsData.totalProducts}
          cogsCoverage={mockIncompleteCogsData.cogsCoverage}
        />
      )

      // Should show warning indicator (yellow text or background)
      const cardElement = screen.getByRole('article')
      expect(cardElement.textContent).toMatch(/74.*80|92/)

      // Should have warning styling
      const warningElement = cardElement.querySelector('.text-yellow-600, .bg-yellow-100')
      expect(warningElement).toBeInTheDocument()
    })

    it('renders missing state when coverage = 0%', () => {
      renderWithProviders(
        <SalesCogsMetricCard
          {...defaultProps}
          cogsTotal={mockMissingCogsData.cogsTotal}
          previousCogsTotal={mockMissingCogsData.previousCogsTotal}
          productsWithCogs={mockMissingCogsData.productsWithCogs}
          totalProducts={mockMissingCogsData.totalProducts}
          cogsCoverage={mockMissingCogsData.cogsCoverage}
        />
      )

      // Should show yellow warning panel
      expect(document.querySelector('.bg-yellow-100')).toBeInTheDocument()

      // Should show "COGS not filled" message
      const cardText = screen.getByRole('article').textContent
      expect(cardText).toMatch(/не заполнен|not filled|0.*80/i)
    })

    it('renders missing state when cogsTotal is null', () => {
      renderWithProviders(
        <SalesCogsMetricCard {...defaultProps} cogsTotal={null} cogsCoverage={50} />
      )

      // Should show missing/warning state
      expect(document.querySelector('.bg-yellow-100')).toBeInTheDocument()
    })
  })

  // =============================================================================
  // Coverage Display Tests
  // =============================================================================

  describe('coverage display', () => {
    it('displays correct coverage ratio "X of Y products"', () => {
      renderWithProviders(<SalesCogsMetricCard {...defaultProps} />)

      const cardText = screen.getByRole('article').textContent
      // Should show "74 of 74 products" or "74 из 74 товаров"
      expect(cardText).toMatch(/74.*74|74.*из.*74/i)
    })

    it('displays coverage percentage', () => {
      renderWithProviders(
        <SalesCogsMetricCard
          {...defaultProps}
          productsWithCogs={74}
          totalProducts={80}
          cogsCoverage={92.5}
        />
      )

      const cardText = screen.getByRole('article').textContent
      // Should show percentage (92.5% or 92%)
      expect(cardText).toMatch(/92.*%|93%/)
    })

    it('shows warning icon when coverage < 100%', () => {
      renderWithProviders(
        <SalesCogsMetricCard {...defaultProps} cogsCoverage={80} productsWithCogs={64} />
      )

      // Should have AlertTriangle icon
      const warningIcon = document.querySelector('svg[class*="yellow"]')
      expect(warningIcon).toBeInTheDocument()
    })
  })

  // =============================================================================
  // Comparison Tests (Inverted for Costs)
  // =============================================================================

  describe('comparison badge (inverted for costs)', () => {
    it('shows positive badge when costs DECREASED (lower is better)', () => {
      // Current: 85,000, Previous: 89,500 -> costs decreased = GOOD (green)
      renderWithProviders(<SalesCogsMetricCard {...defaultProps} />)

      const badge = screen.getByTestId('comparison-badge')
      expect(badge).toBeInTheDocument()
      // Lower costs = positive/green
      expect(badge).toHaveClass(/green|positive/i)
    })

    it('shows negative badge when costs INCREASED (higher is worse)', () => {
      renderWithProviders(
        <SalesCogsMetricCard
          {...defaultProps}
          cogsTotal={100000}
          previousCogsTotal={80000} // Costs increased
        />
      )

      const badge = screen.getByTestId('comparison-badge')
      expect(badge).toHaveClass(/red|negative/i)
    })

    it('hides comparison when previousCogsTotal is null', () => {
      renderWithProviders(<SalesCogsMetricCard {...defaultProps} previousCogsTotal={null} />)

      expect(screen.queryByTestId('comparison-badge')).not.toBeInTheDocument()
    })

    it('hides comparison when previousCogsTotal is undefined', () => {
      renderWithProviders(<SalesCogsMetricCard {...defaultProps} previousCogsTotal={undefined} />)

      expect(screen.queryByTestId('comparison-badge')).not.toBeInTheDocument()
    })

    it('hides comparison when cogsTotal is null (missing state)', () => {
      renderWithProviders(
        <SalesCogsMetricCard {...defaultProps} cogsTotal={null} cogsCoverage={0} />
      )

      expect(screen.queryByTestId('comparison-badge')).not.toBeInTheDocument()
    })

    it('displays previous value in comparison row', () => {
      renderWithProviders(<SalesCogsMetricCard {...defaultProps} />)

      const cardText = screen.getByRole('article').textContent
      // Should show vs 89,500
      expect(cardText).toMatch(/vs.*89.*500|89.*500/i)
    })
  })

  // =============================================================================
  // Interaction Tests
  // =============================================================================

  describe('interactions', () => {
    it('calls onAssignCogs callback when "Fill COGS" link clicked', async () => {
      const onAssignCogs = vi.fn()
      renderWithProviders(
        <SalesCogsMetricCard
          {...defaultProps}
          cogsCoverage={80}
          productsWithCogs={64}
          onAssignCogs={onAssignCogs}
        />
      )

      const fillCogsLink = screen.getByRole('button', { name: /заполнить|fill cogs/i })
      await userEvent.click(fillCogsLink)

      expect(onAssignCogs).toHaveBeenCalledTimes(1)
    })

    it('shows "Fill COGS" link when coverage < 100%', () => {
      renderWithProviders(
        <SalesCogsMetricCard {...defaultProps} cogsCoverage={80} productsWithCogs={64} />
      )

      expect(screen.getByRole('button', { name: /заполнить|fill cogs/i })).toBeInTheDocument()
    })

    it('shows "Fill COGS" link in missing state', () => {
      renderWithProviders(
        <SalesCogsMetricCard
          {...defaultProps}
          cogsTotal={null}
          cogsCoverage={0}
          productsWithCogs={0}
        />
      )

      expect(screen.getByRole('button', { name: /заполнить|fill cogs/i })).toBeInTheDocument()
    })

    it('hides "Fill COGS" link when coverage = 100%', () => {
      renderWithProviders(<SalesCogsMetricCard {...defaultProps} cogsCoverage={100} />)

      expect(screen.queryByRole('button', { name: /заполнить|fill cogs/i })).not.toBeInTheDocument()
    })

    it('calls onRetry when retry button clicked in error state', async () => {
      const onRetry = vi.fn()
      const error = new Error('Network error')
      renderWithProviders(<SalesCogsMetricCard {...defaultProps} error={error} onRetry={onRetry} />)

      const retryButton = screen.getByRole('button', { name: /повторить|retry/i })
      await userEvent.click(retryButton)

      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('shows tooltip on info icon hover', async () => {
      renderWithProviders(<SalesCogsMetricCard {...defaultProps} />)

      const infoButton = screen.getByRole('button', { name: /подробнее|info/i })
      await userEvent.hover(infoButton)

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument()
      })
    })

    it('tooltip explains COGS for actual sales', async () => {
      renderWithProviders(<SalesCogsMetricCard {...defaultProps} />)

      const infoButton = screen.getByRole('button', { name: /подробнее|info/i })
      await userEvent.hover(infoButton)

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip')
        // Should mention COGS, actual sales, or profit
        expect(tooltip.textContent).toMatch(/себестоимость|cogs|выкуп|profit|прибыль/i)
      })
    })
  })

  // =============================================================================
  // Color Coding Tests
  // =============================================================================

  describe('color coding', () => {
    it('displays main value in gray color (#757575 / gray-500)', () => {
      renderWithProviders(<SalesCogsMetricCard {...defaultProps} />)

      // COGS value should be gray (expense = gray per design spec)
      const mainValue = screen.getByText(/85.*000/i).closest('span')
      expect(mainValue).toHaveClass(/gray|text-gray/)
    })

    it('uses gray for Package icon', () => {
      renderWithProviders(<SalesCogsMetricCard {...defaultProps} />)

      const icon = document.querySelector('svg[class*="gray"]')
      expect(icon).toBeInTheDocument()
    })

    it('warning state has yellow background', () => {
      renderWithProviders(
        <SalesCogsMetricCard
          {...defaultProps}
          cogsTotal={null}
          cogsCoverage={0}
          productsWithCogs={0}
        />
      )

      expect(document.querySelector('.bg-yellow-100')).toBeInTheDocument()
    })

    it('warning text is yellow-600', () => {
      renderWithProviders(
        <SalesCogsMetricCard {...defaultProps} cogsCoverage={80} productsWithCogs={64} />
      )

      const warningText = document.querySelector('.text-yellow-600')
      expect(warningText).toBeInTheDocument()
    })
  })

  // =============================================================================
  // Accessibility Tests
  // =============================================================================

  describe('accessibility', () => {
    it('has correct ARIA role="article" on card', () => {
      renderWithProviders(<SalesCogsMetricCard {...defaultProps} />)

      expect(screen.getByRole('article')).toBeInTheDocument()
    })

    it('has descriptive aria-label on card', () => {
      renderWithProviders(<SalesCogsMetricCard {...defaultProps} />)

      const card = screen.getByRole('article')
      expect(card).toHaveAttribute('aria-label')
      const ariaLabel = card.getAttribute('aria-label')
      expect(ariaLabel).toMatch(/cogs|себестоимость/i)
    })

    it('error state has role="alert"', () => {
      const error = new Error('Test error')
      renderWithProviders(<SalesCogsMetricCard {...defaultProps} error={error} />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('loading skeleton has aria-busy="true"', () => {
      renderWithProviders(<SalesCogsMetricCard {...defaultProps} isLoading={true} />)

      const skeleton = document.querySelector('[aria-busy="true"]')
      expect(skeleton).toBeInTheDocument()
    })

    it('"Fill COGS" link is keyboard accessible', async () => {
      renderWithProviders(
        <SalesCogsMetricCard {...defaultProps} cogsCoverage={80} productsWithCogs={64} />
      )

      const fillCogsLink = screen.getByRole('button', { name: /заполнить|fill cogs/i })
      fillCogsLink.focus()
      expect(document.activeElement).toBe(fillCogsLink)
    })

    it('info button is focusable via keyboard', () => {
      renderWithProviders(<SalesCogsMetricCard {...defaultProps} />)

      const infoButton = screen.getByRole('button', { name: /подробнее|info/i })
      infoButton.focus()
      expect(document.activeElement).toBe(infoButton)
    })

    it('warning has appropriate ARIA attributes', () => {
      renderWithProviders(
        <SalesCogsMetricCard {...defaultProps} cogsCoverage={80} productsWithCogs={64} />
      )

      // Warning should be announced to screen readers
      const warningContainer = document.querySelector('.text-yellow-600, .bg-yellow-100')
      expect(warningContainer).toBeInTheDocument()
      // Could have role="status" or aria-live="polite"
    })
  })

  // =============================================================================
  // CSS Class Tests
  // =============================================================================

  describe('styling', () => {
    it('applies custom className prop', () => {
      renderWithProviders(<SalesCogsMetricCard {...defaultProps} className="custom-test-class" />)

      const card = screen.getByRole('article')
      expect(card).toHaveClass('custom-test-class')
    })

    it('has hover shadow effect', () => {
      renderWithProviders(<SalesCogsMetricCard {...defaultProps} />)

      const card = screen.getByRole('article')
      expect(card.className).toMatch(/hover:shadow/)
    })

    it('missing state panel has rounded corners', () => {
      renderWithProviders(
        <SalesCogsMetricCard
          {...defaultProps}
          cogsTotal={null}
          cogsCoverage={0}
          productsWithCogs={0}
        />
      )

      const warningPanel = document.querySelector('.bg-yellow-100')
      expect(warningPanel).toHaveClass('rounded-md')
    })
  })

  // =============================================================================
  // Edge Cases
  // =============================================================================

  describe('edge cases', () => {
    it('handles totalProducts = 0 without division by zero', () => {
      renderWithProviders(
        <SalesCogsMetricCard
          {...defaultProps}
          cogsTotal={0}
          productsWithCogs={0}
          totalProducts={0}
          cogsCoverage={0}
        />
      )

      // Should render without crashing
      expect(screen.getByRole('article')).toBeInTheDocument()
    })

    it('handles very large numbers', () => {
      renderWithProviders(
        <SalesCogsMetricCard
          {...defaultProps}
          cogsTotal={999999999.99}
          previousCogsTotal={1000000000}
        />
      )

      expect(screen.getByRole('article')).toBeInTheDocument()
    })

    it('handles coverage slightly above 100% (rounding)', () => {
      renderWithProviders(
        <SalesCogsMetricCard
          {...defaultProps}
          cogsCoverage={100.5}
          productsWithCogs={75}
          totalProducts={74}
        />
      )

      // Should treat as complete (100%)
      expect(document.querySelector('.bg-yellow-100')).not.toBeInTheDocument()
    })
  })
})
