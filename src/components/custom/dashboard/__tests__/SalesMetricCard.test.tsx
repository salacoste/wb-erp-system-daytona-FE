/**
 * TDD Tests for SalesMetricCard Component
 * Story 63.1-FE: Sales Metric Card (Vykypy)
 * Epic 63-FE: Dashboard Business Logic Completion
 *
 * Tests verify the component correctly displays wb_sales_gross (NOT sales_gross)
 * from finance-summary endpoint with proper formatting and comparison.
 *
 * @see docs/stories/epic-63/story-63.1-fe-sales-metric-card.md
 */

import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'

// Component to be implemented - tests should fail initially (TDD RED phase)
import { SalesMetricCard, type SalesMetricCardProps } from '../SalesMetricCard'

// =============================================================================
// Test Fixtures
// =============================================================================

const mockSalesData = {
  /** wb_sales_gross - seller revenue after WB commission - USE THIS */
  wbSalesGross: 131134.76,
  /** sales_gross - retail price - DO NOT USE for WB Dashboard matching */
  salesGross: 295808.0,
  /** Previous period wb_sales_gross for comparison */
  previousWbSalesGross: 115900.76,
  /** Returns amount */
  returnsGross: 809.0,
}

const defaultProps: SalesMetricCardProps = {
  salesGross: mockSalesData.wbSalesGross,
  previousSalesGross: mockSalesData.previousWbSalesGross,
  returnsGross: mockSalesData.returnsGross,
  isLoading: false,
  error: null,
}

// =============================================================================
// Rendering Tests
// =============================================================================

describe('SalesMetricCard', () => {
  describe('rendering states', () => {
    it('renders loading skeleton when isLoading=true', () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} isLoading={true} />)

      // Skeleton should be visible
      const skeleton = document.querySelector('[aria-busy="true"]')
      expect(skeleton).toBeInTheDocument()

      // Main value should NOT be displayed
      expect(screen.queryByText(/131.*134/)).not.toBeInTheDocument()
    })

    it('renders error state with error message', () => {
      const error = new Error('Failed to load sales data')
      renderWithProviders(<SalesMetricCard {...defaultProps} error={error} />)

      // Error message should be visible
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/Failed to load sales data|Ошибка/i)).toBeInTheDocument()
    })

    it('renders error state with retry button when onRetry provided', () => {
      const onRetry = vi.fn()
      const error = new Error('Network error')
      renderWithProviders(<SalesMetricCard {...defaultProps} error={error} onRetry={onRetry} />)

      // Retry button should be visible
      const retryButton = screen.getByRole('button', { name: /повторить|retry/i })
      expect(retryButton).toBeInTheDocument()
    })

    it('renders empty state when salesGross is null', () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} salesGross={null} />)

      // Should show dash or "no data" indicator
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('renders empty state when salesGross is undefined', () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} salesGross={undefined} />)

      // Should show dash or "no data" indicator
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('renders loaded state with value when data is available', () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} />)

      // Card should be present as article
      expect(screen.getByRole('article')).toBeInTheDocument()

      // Title "Выкупы" or "Vykypy" should be visible
      expect(screen.getByText(/выкуп|sales/i)).toBeInTheDocument()
    })
  })

  // =============================================================================
  // Value Formatting Tests
  // =============================================================================

  describe('value formatting', () => {
    it('formats salesGross value in Russian locale with currency', () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} />)

      // Should display formatted value (Russian uses space as thousands separator)
      // 131,134.76 RUB -> "131 134,76 ₽" or similar
      const valueText = screen.getByRole('article').textContent
      expect(valueText).toMatch(/131.*134/)
      expect(valueText).toMatch(/₽|RUB|руб/i)
    })

    it('formats large values correctly (millions)', () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} salesGross={1234567.89} />)

      const valueText = screen.getByRole('article').textContent
      // Should show 1 234 567,89 ₽
      expect(valueText).toMatch(/1.*234.*567/)
    })

    it('formats zero value correctly', () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} salesGross={0} />)

      const valueText = screen.getByRole('article').textContent
      expect(valueText).toMatch(/0.*₽|0|—/i)
    })

    it('handles negative values (edge case)', () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} salesGross={-1000} />)

      // Should still render without crashing
      expect(screen.getByRole('article')).toBeInTheDocument()
    })
  })

  // =============================================================================
  // Critical: wb_sales_gross vs sales_gross Distinction
  // =============================================================================

  describe('critical: uses wb_sales_gross not sales_gross', () => {
    it('displays wb_sales_gross value (131,134.76), not sales_gross (295,808)', () => {
      // This test ensures we use the correct API field
      renderWithProviders(
        <SalesMetricCard
          {...defaultProps}
          salesGross={mockSalesData.wbSalesGross} // 131,134.76 - CORRECT
        />
      )

      const valueText = screen.getByRole('article').textContent

      // Should contain 131,134 (wb_sales_gross)
      expect(valueText).toMatch(/131.*134/)

      // Should NOT contain 295,808 (sales_gross - retail price)
      expect(valueText).not.toMatch(/295.*808/)
    })
  })

  // =============================================================================
  // Comparison Badge Tests
  // =============================================================================

  describe('comparison badge', () => {
    it('shows positive badge when sales increased', () => {
      // Current: 131,134.76, Previous: 115,900.76 -> +13.15%
      renderWithProviders(<SalesMetricCard {...defaultProps} />)

      // Should show positive indicator (green badge)
      const badge = screen.getByTestId('comparison-badge')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass(/green|positive/i)

      // Percentage should be shown
      const badgeText = badge.textContent
      expect(badgeText).toMatch(/\+/)
    })

    it('shows negative badge when sales decreased', () => {
      renderWithProviders(
        <SalesMetricCard
          {...defaultProps}
          salesGross={100000}
          previousSalesGross={150000} // Decrease
        />
      )

      const badge = screen.getByTestId('comparison-badge')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass(/red|negative/i)

      const badgeText = badge.textContent
      expect(badgeText).toMatch(/-/)
    })

    it('shows neutral badge when change is minimal', () => {
      renderWithProviders(
        <SalesMetricCard
          {...defaultProps}
          salesGross={100000}
          previousSalesGross={100050} // Very small change (0.05%)
        />
      )

      const badge = screen.getByTestId('comparison-badge')
      expect(badge).toHaveClass(/gray|neutral/i)
    })

    it('hides comparison when previousSalesGross is null', () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} previousSalesGross={null} />)

      expect(screen.queryByTestId('comparison-badge')).not.toBeInTheDocument()
    })

    it('hides comparison when previousSalesGross is undefined', () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} previousSalesGross={undefined} />)

      expect(screen.queryByTestId('comparison-badge')).not.toBeInTheDocument()
    })

    it('hides comparison when previousSalesGross is zero', () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} previousSalesGross={0} />)

      // Division by zero edge case - should not show comparison
      expect(screen.queryByTestId('comparison-badge')).not.toBeInTheDocument()
    })

    it('displays absolute difference value', () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} />)

      // Should show vs previous value
      const cardText = screen.getByRole('article').textContent
      expect(cardText).toMatch(/vs.*115.*900|115.*900/i)
    })
  })

  // =============================================================================
  // Trend Indicator Tests
  // =============================================================================

  describe('trend indicator', () => {
    it('shows upward trend arrow when sales increased', () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} />)

      const trendIndicator = screen.getByTestId('trend-indicator')
      expect(trendIndicator).toBeInTheDocument()
      // Should have green color for positive trend
      expect(trendIndicator).toHaveClass(/green/)
    })

    it('shows downward trend arrow when sales decreased', () => {
      renderWithProviders(
        <SalesMetricCard {...defaultProps} salesGross={90000} previousSalesGross={100000} />
      )

      const trendIndicator = screen.getByTestId('trend-indicator')
      expect(trendIndicator).toHaveClass(/red/)
    })
  })

  // =============================================================================
  // Color Coding Tests
  // =============================================================================

  describe('color coding', () => {
    it('displays main value in green color (#22C55E)', () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} />)

      // Main value should be styled green (revenue = green per design spec)
      const mainValue = screen.getByText(/131.*134/i).closest('span')
      expect(mainValue).toHaveClass(/green|text-green/)
    })

    it('uses green for icon', () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} />)

      // Shopping bag icon should be green
      const icon = document.querySelector('svg[class*="green"]')
      expect(icon).toBeInTheDocument()
    })
  })

  // =============================================================================
  // Interaction Tests
  // =============================================================================

  describe('interactions', () => {
    it('calls onRetry when retry button is clicked', async () => {
      const onRetry = vi.fn()
      const error = new Error('Network error')
      renderWithProviders(<SalesMetricCard {...defaultProps} error={error} onRetry={onRetry} />)

      const retryButton = screen.getByRole('button', { name: /повторить|retry/i })
      await userEvent.click(retryButton)

      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('shows tooltip on info icon hover', async () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} />)

      // Find info button
      const infoButton = screen.getByRole('button', { name: /подробнее|info/i })
      expect(infoButton).toBeInTheDocument()

      // Hover to trigger tooltip
      await userEvent.hover(infoButton)

      // Wait for tooltip to appear
      await waitFor(() => {
        // Tooltip should explain wb_sales_gross vs sales_gross
        expect(screen.getByRole('tooltip')).toBeInTheDocument()
      })
    })

    it('tooltip explains wb_sales_gross vs orders distinction', async () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} />)

      const infoButton = screen.getByRole('button', { name: /подробнее|info/i })
      await userEvent.hover(infoButton)

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip')
        // Should mention revenue, commission, or actual sales
        expect(tooltip.textContent).toMatch(/выручк|комисс|выкуп|revenue|commission|actual/i)
      })
    })
  })

  // =============================================================================
  // Accessibility Tests
  // =============================================================================

  describe('accessibility', () => {
    it('has correct ARIA role="article" on card', () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} />)

      expect(screen.getByRole('article')).toBeInTheDocument()
    })

    it('has descriptive aria-label on card', () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} />)

      const card = screen.getByRole('article')
      expect(card).toHaveAttribute('aria-label')
      // Should include metric name and value
      const ariaLabel = card.getAttribute('aria-label')
      expect(ariaLabel).toMatch(/выкуп|sales/i)
    })

    it('has aria-label on info button', () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} />)

      const infoButton = screen.getByRole('button', { name: /подробнее|info/i })
      expect(infoButton).toBeInTheDocument()
    })

    it('error state has role="alert"', () => {
      const error = new Error('Test error')
      renderWithProviders(<SalesMetricCard {...defaultProps} error={error} />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('loading skeleton has aria-busy="true"', () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} isLoading={true} />)

      const skeleton = document.querySelector('[aria-busy="true"]')
      expect(skeleton).toBeInTheDocument()
    })

    it('is keyboard navigable - info button is focusable', async () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} />)

      const infoButton = screen.getByRole('button', { name: /подробнее|info/i })

      // Should be able to focus via keyboard
      infoButton.focus()
      expect(document.activeElement).toBe(infoButton)
    })

    it('card has focus-visible ring styles', () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} />)

      const card = screen.getByRole('article')
      // Check for focus-within or focus-visible classes
      expect(card.className).toMatch(/focus/)
    })
  })

  // =============================================================================
  // Net Sales Subtitle Tests
  // =============================================================================

  describe('net sales subtitle', () => {
    it('displays net sales after returns when returnsGross is provided', () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} />)

      // Net sales = wb_sales_gross - wb_returns_gross = 131,134.76 - 809 = 130,325.76
      const cardText = screen.getByRole('article').textContent
      // Should show net sales or returns info in subtitle
      expect(cardText).toMatch(/130.*325|возврат|return|net/i)
    })

    it('hides net sales line when returnsGross is null', () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} returnsGross={null} />)

      // Net sales subtitle should not appear
      const cardText = screen.getByRole('article').textContent
      expect(cardText).not.toMatch(/возврат|net sales after returns/i)
    })
  })

  // =============================================================================
  // CSS Class Tests
  // =============================================================================

  describe('styling', () => {
    it('applies custom className prop', () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} className="custom-test-class" />)

      const card = screen.getByRole('article')
      expect(card).toHaveClass('custom-test-class')
    })

    it('has minimum height of 120px', () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} />)

      const card = screen.getByRole('article')
      expect(card).toHaveClass('min-h-[120px]')
    })

    it('has hover shadow effect', () => {
      renderWithProviders(<SalesMetricCard {...defaultProps} />)

      const card = screen.getByRole('article')
      expect(card.className).toMatch(/hover:shadow/)
    })
  })
})
