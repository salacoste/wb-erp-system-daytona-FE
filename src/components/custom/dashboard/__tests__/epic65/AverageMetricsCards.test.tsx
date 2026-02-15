/**
 * TDD Tests for Story 65.2: Average Metrics Cards (Средние показатели)
 * RED phase — all tests expected to FAIL (components do not exist yet).
 *
 * 4 metric cards in an "Средние показатели" section:
 * 1. avgPriceBeforeDiscount = ordersRevenue / ordersCount
 * 2. avgSalePrice = sale_gross / salesCount
 * 3. avgLogisticsPerUnit = logistics_cost / salesCount
 * 4. avgProfitPerUnit = gross_profit / salesCount (only when COGS filled)
 *
 * @see Story 65.2, AC-65.2.1 through AC-65.2.5
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'

// Components under test — DO NOT EXIST YET (TDD Red phase)
import { AveragesSection } from '../../AveragesSection'
import { AverageMetricCard } from '../../AverageMetricCard'

import { createFinanceSummary, createFulfillmentSummary } from './fixtures'

// =============================================================================
// Shared test data
// =============================================================================

const defaultFinance = createFinanceSummary()
const defaultFulfillment = createFulfillmentSummary()

// Derived values matching DashboardContent aggregation
const salesCount =
  defaultFulfillment.summary.fbo.salesCount + defaultFulfillment.summary.fbs.salesCount // 500 + 350 = 850
const ordersCount = defaultFulfillment.summary.total.ordersCount // 1000
const ordersRevenue = defaultFulfillment.summary.total.ordersRevenue // 5_000_000
const saleGross = defaultFinance.sale_gross_total! // 1_500_000
const logisticsCost = defaultFinance.logistics_cost_total! // 180_000
const grossProfit = defaultFinance.gross_profit! // 350_000

// =============================================================================
// AC-65.2.1: Section renders 4 cards
// =============================================================================

describe('AveragesSection', () => {
  describe('AC-65.2.1: renders 4 mini-cards in a section', () => {
    it('renders the "Средние показатели" section heading', () => {
      renderWithProviders(
        <AveragesSection
          ordersRevenue={ordersRevenue}
          ordersCount={ordersCount}
          saleGross={saleGross}
          salesCount={salesCount}
          logisticsCost={logisticsCost}
          grossProfit={grossProfit}
          isLoading={false}
        />
      )

      expect(screen.getByText('Средние показатели')).toBeInTheDocument()
    })

    it('renders exactly 4 metric cards', () => {
      renderWithProviders(
        <AveragesSection
          ordersRevenue={ordersRevenue}
          ordersCount={ordersCount}
          saleGross={saleGross}
          salesCount={salesCount}
          logisticsCost={logisticsCost}
          grossProfit={grossProfit}
          isLoading={false}
        />
      )

      const cards = screen.getAllByRole('article')
      expect(cards.length).toBe(4)
    })
  })
})

// =============================================================================
// AC-65.2.2: Individual metric calculations + currency formatting
// =============================================================================

describe('AverageMetricCard — calculations', () => {
  describe('avgPriceBeforeDiscount = ordersRevenue / ordersCount', () => {
    it('calculates and displays correctly', () => {
      // 5_000_000 / 1000 = 5000.00 -> "5 000 ₽"
      renderWithProviders(
        <AverageMetricCard
          title="Средняя цена до скидок"
          value={ordersRevenue / ordersCount}
          isLoading={false}
        />
      )

      const card = screen.getByRole('article')
      // 5 000 in Russian locale with ₽
      expect(card.textContent).toMatch(/5\s*000/)
      expect(card.textContent).toMatch(/₽/)
    })
  })

  describe('avgSalePrice = sale_gross / salesCount', () => {
    it('calculates and displays correctly', () => {
      // 1_500_000 / 850 = 1764.71 -> ~"1 764,71 ₽"
      const avgSalePrice = saleGross / salesCount

      renderWithProviders(
        <AverageMetricCard title="Средняя цена продажи" value={avgSalePrice} isLoading={false} />
      )

      const card = screen.getByRole('article')
      expect(card.textContent).toMatch(/1\s*764/)
      expect(card.textContent).toMatch(/₽/)
    })
  })

  describe('avgLogisticsPerUnit = logistics_cost / salesCount', () => {
    it('calculates and displays correctly', () => {
      // 180_000 / 850 = 211.76 -> ~"211,76 ₽"
      const avgLogistics = logisticsCost / salesCount

      renderWithProviders(
        <AverageMetricCard
          title="Средняя стоимость логистики"
          value={avgLogistics}
          isLoading={false}
        />
      )

      const card = screen.getByRole('article')
      expect(card.textContent).toMatch(/211/)
      expect(card.textContent).toMatch(/₽/)
    })
  })

  describe('avgProfitPerUnit = gross_profit / salesCount (only when COGS filled)', () => {
    it('calculates and displays correctly when gross_profit is available', () => {
      // 350_000 / 850 = 411.76 -> ~"411,76 ₽"
      const avgProfit = grossProfit / salesCount

      renderWithProviders(
        <AverageMetricCard title="Средняя прибыль/шт" value={avgProfit} isLoading={false} />
      )

      const card = screen.getByRole('article')
      expect(card.textContent).toMatch(/411/)
      expect(card.textContent).toMatch(/₽/)
    })
  })
})

// =============================================================================
// AC-65.2.3: avgProfitPerUnit color coding
// =============================================================================

describe('AverageMetricCard — profit color coding', () => {
  describe('AC-65.2.3: avgProfitPerUnit color based on sign', () => {
    it('shows green when avgProfitPerUnit > 0', () => {
      renderWithProviders(
        <AverageMetricCard
          title="Средняя прибыль/шт"
          value={411.76}
          colorBySign={true}
          isLoading={false}
        />
      )

      const valueElement = screen.getByTestId('average-metric-value')
      expect(valueElement.className).toMatch(/green/)
    })

    it('shows red when avgProfitPerUnit < 0', () => {
      renderWithProviders(
        <AverageMetricCard
          title="Средняя прибыль/шт"
          value={-150}
          colorBySign={true}
          isLoading={false}
        />
      )

      const valueElement = screen.getByTestId('average-metric-value')
      expect(valueElement.className).toMatch(/red/)
    })
  })
})

// =============================================================================
// AC-65.2.4: Graceful degradation for gross_profit == null
// =============================================================================

describe('AveragesSection — COGS missing', () => {
  describe('AC-65.2.4: avgProfitPerUnit shows "---" when gross_profit is null', () => {
    it('shows "---" with hint "Заполните COGS" when gross_profit is null', () => {
      renderWithProviders(
        <AveragesSection
          ordersRevenue={ordersRevenue}
          ordersCount={ordersCount}
          saleGross={saleGross}
          salesCount={salesCount}
          logisticsCost={logisticsCost}
          grossProfit={null}
          isLoading={false}
        />
      )

      // The profit card should show dash
      expect(screen.getByText('—')).toBeInTheDocument()
      // And a hint to fill COGS
      expect(screen.getByText(/Заполните COGS/i)).toBeInTheDocument()
    })
  })
})

// =============================================================================
// AC-65.2.5: Division-by-zero guards
// =============================================================================

describe('AveragesSection — division by zero', () => {
  describe('AC-65.2.5: salesCount === 0 guards', () => {
    it('shows "---" for avgSalePrice, avgLogistics, avgProfit when salesCount === 0', () => {
      renderWithProviders(
        <AveragesSection
          ordersRevenue={ordersRevenue}
          ordersCount={ordersCount}
          saleGross={saleGross}
          salesCount={0}
          logisticsCost={logisticsCost}
          grossProfit={grossProfit}
          isLoading={false}
        />
      )

      // 3 cards should show "---" (avgSalePrice, avgLogistics, avgProfit)
      // Only avgPriceBeforeDiscount should still show a value (uses ordersCount)
      const dashes = screen.getAllByText('—')
      expect(dashes.length).toBeGreaterThanOrEqual(3)
    })

    it('avgPriceBeforeDiscount still shows value when salesCount === 0 (uses ordersCount)', () => {
      renderWithProviders(
        <AveragesSection
          ordersRevenue={ordersRevenue}
          ordersCount={ordersCount}
          saleGross={saleGross}
          salesCount={0}
          logisticsCost={logisticsCost}
          grossProfit={grossProfit}
          isLoading={false}
        />
      )

      // ordersRevenue / ordersCount = 5_000_000 / 1000 = 5000 -> should display
      const card = screen.getByText(/Средняя цена до скидок/i)
      expect(card).toBeInTheDocument()
      // Value area should show "5 000" not "---"
      expect(screen.getByText(/5\s*000/)).toBeInTheDocument()
    })

    it('avgPriceBeforeDiscount shows "---" when ordersCount === 0', () => {
      renderWithProviders(
        <AveragesSection
          ordersRevenue={0}
          ordersCount={0}
          saleGross={saleGross}
          salesCount={0}
          logisticsCost={logisticsCost}
          grossProfit={grossProfit}
          isLoading={false}
        />
      )

      // All 4 should show dashes
      const dashes = screen.getAllByText('—')
      expect(dashes.length).toBeGreaterThanOrEqual(4)
    })

    it('shows "---" for all metrics when salesCount is undefined', () => {
      renderWithProviders(
        <AveragesSection
          ordersRevenue={ordersRevenue}
          ordersCount={ordersCount}
          saleGross={saleGross}
          salesCount={undefined}
          logisticsCost={logisticsCost}
          grossProfit={grossProfit}
          isLoading={false}
        />
      )

      // At least 3 dashes for sale-based metrics
      const dashes = screen.getAllByText('—')
      expect(dashes.length).toBeGreaterThanOrEqual(3)
    })
  })
})

// =============================================================================
// Comparison with previous period
// =============================================================================

describe('AverageMetricCard — comparison', () => {
  describe('AC-65.2.2: comparison with previous period', () => {
    it('shows absolute and percentage difference when previous value provided', () => {
      // Current: 1764.71, Previous: 1600
      renderWithProviders(
        <AverageMetricCard
          title="Средняя цена продажи"
          value={1764.71}
          previousValue={1600}
          isLoading={false}
        />
      )

      // Should show some comparison indicator (absolute diff and %)
      const card = screen.getByRole('article')
      // +164.71 -> formatted, and +10.3%
      expect(card.textContent).toMatch(/\+/)
    })

    it('does not show comparison when previousValue is null', () => {
      renderWithProviders(
        <AverageMetricCard
          title="Средняя цена продажи"
          value={1764.71}
          previousValue={null}
          isLoading={false}
        />
      )

      expect(screen.queryByTestId('comparison-badge')).not.toBeInTheDocument()
    })
  })
})
