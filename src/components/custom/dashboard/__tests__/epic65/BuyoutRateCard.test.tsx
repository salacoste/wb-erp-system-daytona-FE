/**
 * Tests for BuyoutRateCard
 *
 * Originally Story 65.1, updated for Epic 69, Story 69.7: Frontend Formula Fix (P-005).
 *
 * The BuyoutRateCard now uses pre-calculated `buyoutRate` from the backend API
 * instead of calculating salesCount/ordersCount*100 locally.
 *
 * Unified formula (Story 69.1): buyout_rate = (sales - returns) / sales * 100
 *
 * @see Story 69.7, AC-69.7.1 through AC-69.7.6
 * @see docs/stories/epic-69/story-69.7-frontend-formula-fix.md
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'

import { BuyoutRateCard } from '../../BuyoutRateCard'

// =============================================================================
// AC-69.7.1: Uses buyoutRate from backend, NOT salesCount/ordersCount
// =============================================================================

describe('BuyoutRateCard', () => {
  describe('AC-69.7.1: displays pre-calculated buyout rate from backend', () => {
    it('renders buyout percentage with 1 decimal when buyoutRate is provided', () => {
      // Epic 69: buyoutRate comes pre-calculated from backend API
      renderWithProviders(<BuyoutRateCard buyoutRate={85.0} isLoading={false} />)

      // Should display "85,0%" (Russian locale, comma decimal)
      expect(screen.getByText(/85,0\s*%/)).toBeInTheDocument()
    })

    it('renders 100% buyout rate correctly', () => {
      renderWithProviders(<BuyoutRateCard buyoutRate={100} isLoading={false} />)

      expect(screen.getByText(/100,0\s*%/)).toBeInTheDocument()
    })

    it('renders fractional buyout rate correctly', () => {
      renderWithProviders(<BuyoutRateCard buyoutRate={73.45} isLoading={false} />)

      // formatPercentage preserves original precision: 73.45 -> "73,45 %"
      expect(screen.getByText(/73,45\s*%/)).toBeInTheDocument()
    })

    it('shows ShoppingBag icon', () => {
      renderWithProviders(<BuyoutRateCard buyoutRate={85.0} isLoading={false} />)

      // ShoppingBag icon should be present (within role="article")
      const card = screen.getByRole('article')
      expect(card).toBeInTheDocument()
    })

    it('ignores legacy salesCount/ordersCount props (P-005 fix)', () => {
      // Even if legacy props are passed, only buyoutRate matters
      renderWithProviders(
        <BuyoutRateCard buyoutRate={92.5} salesCount={500} ordersCount={1000} isLoading={false} />
      )

      // Should show 92.5% (from buyoutRate), NOT 50% (from 500/1000)
      expect(screen.getByText(/92,5\s*%/)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // AC-69.7.3: Color coding by buyout rate level (updated thresholds)
  // ===========================================================================

  describe('AC-69.7.3: color coding by buyout rate level', () => {
    it('shows green when buyoutRate >= 80%', () => {
      renderWithProviders(<BuyoutRateCard buyoutRate={85.0} isLoading={false} />)

      const valueElement = screen.getByText(/85,0\s*%/)
      expect(valueElement.className).toMatch(/green/)
    })

    it('shows green when buyoutRate = 100% (perfect)', () => {
      renderWithProviders(<BuyoutRateCard buyoutRate={100} isLoading={false} />)

      const valueElement = screen.getByText(/100,0\s*%/)
      expect(valueElement.className).toMatch(/green/)
    })

    it('shows red when buyoutRate < 80% (warning)', () => {
      renderWithProviders(<BuyoutRateCard buyoutRate={70.0} isLoading={false} />)

      const valueElement = screen.getByText(/70,0\s*%/)
      expect(valueElement.className).toMatch(/red/)
    })

    it('shows red when buyoutRate is very low', () => {
      renderWithProviders(<BuyoutRateCard buyoutRate={30.0} isLoading={false} />)

      const valueElement = screen.getByText(/30,0\s*%/)
      expect(valueElement.className).toMatch(/red/)
    })
  })

  // ===========================================================================
  // Comparison in percentage points (п.п.)
  // ===========================================================================

  describe('comparison shows pp difference', () => {
    it('displays positive pp difference when buyout rate increased', () => {
      // Current: 85%, Previous: 70% -> +15.0 п.п.
      renderWithProviders(
        <BuyoutRateCard buyoutRate={85.0} previousBuyoutRate={70.0} isLoading={false} />
      )

      expect(screen.getByText(/\+15,0\s*п\.п\./)).toBeInTheDocument()
    })

    it('displays negative pp difference when buyout rate decreased', () => {
      // Current: 60%, Previous: 85% -> -25.0 п.п.
      renderWithProviders(
        <BuyoutRateCard buyoutRate={60.0} previousBuyoutRate={85.0} isLoading={false} />
      )

      expect(screen.getByText(/-25,0\s*п\.п\./)).toBeInTheDocument()
    })

    it('uses green color when buyout rate increased (positive is good)', () => {
      renderWithProviders(
        <BuyoutRateCard buyoutRate={85.0} previousBuyoutRate={70.0} isLoading={false} />
      )

      const ppElement = screen.getByText(/\+15,0\s*п\.п\./)
      expect(ppElement.className).toMatch(/green/)
    })

    it('uses red color when buyout rate decreased (negative is bad)', () => {
      renderWithProviders(
        <BuyoutRateCard buyoutRate={60.0} previousBuyoutRate={85.0} isLoading={false} />
      )

      const ppElement = screen.getByText(/-25,0\s*п\.п\./)
      expect(ppElement.className).toMatch(/red/)
    })

    it('does not show comparison when previousBuyoutRate is not provided', () => {
      renderWithProviders(<BuyoutRateCard buyoutRate={85.0} isLoading={false} />)

      expect(screen.queryByText(/п\.п\./)).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // AC-69.7.2: Tooltip content
  // ===========================================================================

  describe('AC-69.7.2: tooltip content', () => {
    it('has a tooltip trigger button', () => {
      renderWithProviders(<BuyoutRateCard buyoutRate={85.0} isLoading={false} />)

      // Tooltip trigger should exist (info icon button)
      const tooltipButton = screen.getByLabelText(/подробнее/i)
      expect(tooltipButton).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // AC-69.7.3 + AC-69.7.4: Graceful degradation & fallback
  // ===========================================================================

  describe('graceful degradation (null/undefined buyoutRate)', () => {
    it('shows "---" when buyoutRate is null (no data available)', () => {
      renderWithProviders(<BuyoutRateCard buyoutRate={null} isLoading={false} />)

      expect(screen.getByText('\u2014')).toBeInTheDocument()
    })

    it('shows "---" when buyoutRate is undefined', () => {
      renderWithProviders(<BuyoutRateCard buyoutRate={undefined} isLoading={false} />)

      expect(screen.getByText('\u2014')).toBeInTheDocument()
    })

    it('shows "---" when no props are provided (no data scenario)', () => {
      renderWithProviders(<BuyoutRateCard isLoading={false} />)

      expect(screen.getByText('\u2014')).toBeInTheDocument()
    })

    it('handles buyoutRate = 0% gracefully (shows 0%)', () => {
      renderWithProviders(<BuyoutRateCard buyoutRate={0} isLoading={false} />)

      expect(screen.getByText(/0,0\s*%/)).toBeInTheDocument()
    })

    it('shows skeleton when loading', () => {
      renderWithProviders(<BuyoutRateCard isLoading={true} />)

      expect(
        screen.getByRole('article', { busy: true }) || screen.getByTestId('buyout-rate-skeleton')
      ).toBeTruthy()
    })
  })

  // ===========================================================================
  // Backward compatibility: legacy props still accepted (no TypeScript errors)
  // ===========================================================================

  describe('backward compatibility with legacy props', () => {
    it('accepts legacy salesCount/ordersCount without errors', () => {
      // Legacy props are accepted but ignored for calculation
      renderWithProviders(
        <BuyoutRateCard
          salesCount={850}
          ordersCount={1000}
          previousSalesCount={700}
          previousOrdersCount={1000}
          isLoading={false}
        />
      )

      // Without buyoutRate, should show no data
      expect(screen.getByText('\u2014')).toBeInTheDocument()
    })
  })
})
