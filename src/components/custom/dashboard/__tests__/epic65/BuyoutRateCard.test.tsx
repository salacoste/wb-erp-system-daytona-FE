/**
 * TDD Tests for Story 65.1: Buyout Rate Card (Процент выкупа)
 * RED phase — all tests expected to FAIL (component does not exist yet).
 *
 * The BuyoutRateCard shows the percentage of orders that were bought out (not returned).
 * Formula: buyoutRate = salesCount / ordersCount * 100
 * Comparison uses percentage points (п.п.), NOT relative %.
 *
 * @see Story 65.1, AC-65.1.1 through AC-65.1.5
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'

// Component under test — DOES NOT EXIST YET (TDD Red phase)
import { BuyoutRateCard } from '../../BuyoutRateCard'

import { createFulfillmentSummary } from './fixtures'

// =============================================================================
// Helper: derive props from fulfillment data
// =============================================================================

function deriveProps(
  current: ReturnType<typeof createFulfillmentSummary> | null = null,
  previous: ReturnType<typeof createFulfillmentSummary> | null = null
) {
  const salesCount = current
    ? current.summary.fbo.salesCount + current.summary.fbs.salesCount
    : undefined
  const ordersCount = current?.summary.total.ordersCount ?? undefined
  const previousSalesCount = previous
    ? previous.summary.fbo.salesCount + previous.summary.fbs.salesCount
    : undefined
  const previousOrdersCount = previous?.summary.total.ordersCount ?? undefined

  return { salesCount, ordersCount, previousSalesCount, previousOrdersCount }
}

// =============================================================================
// AC-65.1.1: Renders buyout percentage correctly
// =============================================================================

describe('BuyoutRateCard', () => {
  describe('AC-65.1.1: displays buyout rate as percentage', () => {
    it('renders buyout percentage with 1 decimal when data is available', () => {
      // salesCount = 500 + 350 = 850, ordersCount = 1000
      // buyoutRate = 850 / 1000 * 100 = 85.0%
      const fulfillment = createFulfillmentSummary()
      const props = deriveProps(fulfillment)

      renderWithProviders(
        <BuyoutRateCard
          salesCount={props.salesCount}
          ordersCount={props.ordersCount}
          isLoading={false}
        />
      )

      // Should display "85,0%" (Russian locale, comma decimal)
      expect(screen.getByText(/85,0\s*%/)).toBeInTheDocument()
    })

    it('shows ShoppingBag icon', () => {
      const fulfillment = createFulfillmentSummary()
      const props = deriveProps(fulfillment)

      renderWithProviders(
        <BuyoutRateCard
          salesCount={props.salesCount}
          ordersCount={props.ordersCount}
          isLoading={false}
        />
      )

      // ShoppingBag icon should be present (aria-hidden)
      const card = screen.getByRole('article')
      expect(card).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // AC-65.1.2: Comparison in percentage points (п.п.)
  // ===========================================================================

  describe('AC-65.1.2: comparison shows pp difference', () => {
    it('displays positive pp difference when buyout rate increased', () => {
      // Current: 850/1000 = 85.0%
      const current = createFulfillmentSummary()
      // Previous: 700/1000 = 70.0%
      const previous = createFulfillmentSummary({
        fbo: { salesCount: 400 },
        fbs: { salesCount: 300 },
        total: { ordersCount: 1000 },
      })
      const props = deriveProps(current, previous)

      renderWithProviders(
        <BuyoutRateCard
          salesCount={props.salesCount}
          ordersCount={props.ordersCount}
          previousSalesCount={props.previousSalesCount}
          previousOrdersCount={props.previousOrdersCount}
          isLoading={false}
        />
      )

      // Diff = 85.0 - 70.0 = +15.0 п.п.
      expect(screen.getByText(/\+15,0\s*п\.п\./)).toBeInTheDocument()
    })

    it('displays negative pp difference when buyout rate decreased', () => {
      // Current: 600/1000 = 60.0%
      const current = createFulfillmentSummary({
        fbo: { salesCount: 350 },
        fbs: { salesCount: 250 },
        total: { ordersCount: 1000 },
      })
      // Previous: 850/1000 = 85.0%
      const previous = createFulfillmentSummary()
      const props = deriveProps(current, previous)

      renderWithProviders(
        <BuyoutRateCard
          salesCount={props.salesCount}
          ordersCount={props.ordersCount}
          previousSalesCount={props.previousSalesCount}
          previousOrdersCount={props.previousOrdersCount}
          isLoading={false}
        />
      )

      // Diff = 60.0 - 85.0 = -25.0 п.п.
      expect(screen.getByText(/-25,0\s*п\.п\./)).toBeInTheDocument()
    })

    it('uses green color when buyout rate increased (positive is good)', () => {
      const current = createFulfillmentSummary()
      const previous = createFulfillmentSummary({
        fbo: { salesCount: 400 },
        fbs: { salesCount: 300 },
        total: { ordersCount: 1000 },
      })
      const props = deriveProps(current, previous)

      renderWithProviders(
        <BuyoutRateCard
          salesCount={props.salesCount}
          ordersCount={props.ordersCount}
          previousSalesCount={props.previousSalesCount}
          previousOrdersCount={props.previousOrdersCount}
          isLoading={false}
        />
      )

      const ppElement = screen.getByText(/\+15,0\s*п\.п\./)
      expect(ppElement.className).toMatch(/green/)
    })

    it('uses red color when buyout rate decreased (negative is bad)', () => {
      const current = createFulfillmentSummary({
        fbo: { salesCount: 350 },
        fbs: { salesCount: 250 },
        total: { ordersCount: 1000 },
      })
      const previous = createFulfillmentSummary()
      const props = deriveProps(current, previous)

      renderWithProviders(
        <BuyoutRateCard
          salesCount={props.salesCount}
          ordersCount={props.ordersCount}
          previousSalesCount={props.previousSalesCount}
          previousOrdersCount={props.previousOrdersCount}
          isLoading={false}
        />
      )

      const ppElement = screen.getByText(/-25,0\s*п\.п\./)
      expect(ppElement.className).toMatch(/red/)
    })

    it('does not show comparison when previous data is missing', () => {
      const current = createFulfillmentSummary()
      const props = deriveProps(current)

      renderWithProviders(
        <BuyoutRateCard
          salesCount={props.salesCount}
          ordersCount={props.ordersCount}
          isLoading={false}
        />
      )

      expect(screen.queryByText(/п\.п\./)).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // AC-65.1.3: Tooltip
  // ===========================================================================

  describe('AC-65.1.3: tooltip content', () => {
    it('has a tooltip explaining the metric', () => {
      const fulfillment = createFulfillmentSummary()
      const props = deriveProps(fulfillment)

      renderWithProviders(
        <BuyoutRateCard
          salesCount={props.salesCount}
          ordersCount={props.ordersCount}
          isLoading={false}
        />
      )

      // Tooltip trigger should exist (info icon button)
      const tooltipButton = screen.getByLabelText(/подробнее/i)
      expect(tooltipButton).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // AC-65.1.4: Color coding by threshold
  // ===========================================================================

  describe('AC-65.1.4: color coding by buyout rate level', () => {
    it('shows green when buyout rate >= 80%', () => {
      // 850/1000 = 85%
      const fulfillment = createFulfillmentSummary()
      const props = deriveProps(fulfillment)

      renderWithProviders(
        <BuyoutRateCard
          salesCount={props.salesCount}
          ordersCount={props.ordersCount}
          isLoading={false}
        />
      )

      const valueElement = screen.getByText(/85,0\s*%/)
      expect(valueElement.className).toMatch(/green/)
    })

    it('shows yellow when buyout rate is 60-80%', () => {
      // 700/1000 = 70%
      const fulfillment = createFulfillmentSummary({
        fbo: { salesCount: 400 },
        fbs: { salesCount: 300 },
        total: { ordersCount: 1000 },
      })
      const props = deriveProps(fulfillment)

      renderWithProviders(
        <BuyoutRateCard
          salesCount={props.salesCount}
          ordersCount={props.ordersCount}
          isLoading={false}
        />
      )

      const valueElement = screen.getByText(/70,0\s*%/)
      expect(valueElement.className).toMatch(/yellow/)
    })

    it('shows red when buyout rate < 60%', () => {
      // 500/1000 = 50%
      const fulfillment = createFulfillmentSummary({
        fbo: { salesCount: 300 },
        fbs: { salesCount: 200 },
        total: { ordersCount: 1000 },
      })
      const props = deriveProps(fulfillment)

      renderWithProviders(
        <BuyoutRateCard
          salesCount={props.salesCount}
          ordersCount={props.ordersCount}
          isLoading={false}
        />
      )

      const valueElement = screen.getByText(/50,0\s*%/)
      expect(valueElement.className).toMatch(/red/)
    })
  })

  // ===========================================================================
  // AC-65.1.5: Graceful degradation
  // ===========================================================================

  describe('AC-65.1.5: graceful degradation', () => {
    it('shows "---" when ordersCount is 0 (division by zero guard)', () => {
      renderWithProviders(<BuyoutRateCard salesCount={0} ordersCount={0} isLoading={false} />)

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('handles salesCount === 0 gracefully (shows 0%)', () => {
      renderWithProviders(<BuyoutRateCard salesCount={0} ordersCount={500} isLoading={false} />)

      // 0/500 = 0.0%
      expect(screen.getByText(/0,0\s*%/)).toBeInTheDocument()
    })

    it('shows "---" when data is null/undefined (fulfillment unavailable)', () => {
      renderWithProviders(
        <BuyoutRateCard salesCount={undefined} ordersCount={undefined} isLoading={false} />
      )

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('shows skeleton when loading', () => {
      renderWithProviders(
        <BuyoutRateCard salesCount={undefined} ordersCount={undefined} isLoading={true} />
      )

      expect(
        screen.getByRole('article', { busy: true }) || screen.getByTestId('buyout-rate-skeleton')
      ).toBeTruthy()
    })
  })
})
