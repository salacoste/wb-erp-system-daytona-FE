/**
 * Shared Test Fixtures for Epic 65 — Dashboard Metrics Parity
 * Wave 1-2: Frontend-calculable metrics + tooltips
 *
 * Provides typed mock data factories for:
 * - FinanceSummary (weekly financial data)
 * - FulfillmentSummaryResponse (FBO/FBS order data)
 * - AdvertisingSummary (ad spend data)
 * - PreviousPeriodData (comparison data)
 *
 * All factories produce realistic values matching actual TypeScript types.
 */

import type { FinanceSummary } from '@/types/finance-summary'
import type {
  FulfillmentSummaryResponse,
  FulfillmentMetrics,
  FulfillmentTotal,
} from '@/types/fulfillment'
import type { AdvertisingSummary } from '@/types/advertising-analytics'
import type { PreviousPeriodData } from '@/components/custom/dashboard/DashboardMetricsGrid'

// =============================================================================
// Finance Summary Fixtures
// =============================================================================

/**
 * Creates a FinanceSummary with realistic values for dashboard testing.
 * All optional fields have values by default; override with nulls for edge cases.
 */
export function createFinanceSummary(overrides: Partial<FinanceSummary> = {}): FinanceSummary {
  return {
    week: '2026-W06',
    // Sales / Returns
    sale_gross_total: 1_500_000,
    sale_gross: 1_500_000,
    sales_gross_total: 1_700_000,
    sales_gross: 1_700_000,
    returns_gross_total: 200_000,
    returns_gross: 200_000,
    wb_sales_gross_total: 1_700_000,
    wb_sales_gross: 1_700_000,
    wb_returns_gross_total: 200_000,
    wb_returns_gross: 200_000,
    // Payout
    payout_total: 950_000,
    to_pay_goods_total: 950_000,
    to_pay_goods: 950_000,
    // Commissions
    commission_sales_total: 120_000,
    commission_sales: 120_000,
    acquiring_fee_total: 25_000,
    acquiring_fee: 25_000,
    wb_commission_adj_total: -15_000,
    wb_commission_adj: -15_000,
    loyalty_fee_total: 8_000,
    loyalty_fee: 8_000,
    penalties_total: 3_000,
    total_commission_rub_total: 141_000,
    total_commission_rub: 141_000,
    // Logistics
    logistics_cost_total: 180_000,
    logistics_cost: 180_000,
    // Storage
    storage_cost_total: 45_000,
    storage_cost: 45_000,
    paid_acceptance_cost_total: 5_000,
    paid_acceptance_cost: 5_000,
    // WB Services
    wb_services_cost_total: 12_000,
    wb_services_cost: 12_000,
    // Other adjustments
    other_adjustments_net_total: -7_500,
    other_adjustments_net: -7_500,
    // COGS & Profit
    cogs_total: 600_000,
    cogs_coverage_pct: 95,
    products_with_cogs: 190,
    products_total: 200,
    gross_profit: 350_000,
    margin_pct: 23.3,
    ...overrides,
  }
}

/**
 * Creates a FinanceSummary with null COGS fields.
 * Simulates dashboard state when user hasn't filled COGS.
 */
export function createFinanceSummaryNoCogs(): FinanceSummary {
  return createFinanceSummary({
    cogs_total: null,
    cogs_coverage_pct: null,
    products_with_cogs: null,
    gross_profit: null,
    margin_pct: null,
  })
}

// =============================================================================
// Fulfillment Fixtures
// =============================================================================

/**
 * Creates realistic FulfillmentMetrics for a single channel (FBO or FBS).
 */
export function createFulfillmentMetrics(
  overrides: Partial<FulfillmentMetrics> = {}
): FulfillmentMetrics {
  return {
    ordersCount: 500,
    ordersRevenue: 2_500_000,
    salesCount: 420,
    salesRevenue: 2_100_000,
    forPayTotal: 1_800_000,
    returnsCount: 30,
    returnsRevenue: 150_000,
    returnRate: 6.0,
    avgOrderValue: 5_000,
    ...overrides,
  }
}

/**
 * Creates a FulfillmentTotal (aggregated, no salesCount/returnsCount).
 */
export function createFulfillmentTotal(
  overrides: Partial<FulfillmentTotal> = {}
): FulfillmentTotal {
  return {
    ordersCount: 1000,
    ordersRevenue: 5_000_000,
    fboShare: 60,
    fbsShare: 40,
    ...overrides,
  }
}

/**
 * Creates a full FulfillmentSummaryResponse with FBO + FBS + Total.
 */
export function createFulfillmentSummary(
  overrides: {
    fbo?: Partial<FulfillmentMetrics>
    fbs?: Partial<FulfillmentMetrics>
    total?: Partial<FulfillmentTotal>
  } = {}
): FulfillmentSummaryResponse {
  return {
    summary: {
      fbo: createFulfillmentMetrics({
        ordersCount: 600,
        ordersRevenue: 3_000_000,
        salesCount: 500,
        salesRevenue: 2_500_000,
        returnsCount: 35,
        returnsRevenue: 175_000,
        returnRate: 5.8,
        avgOrderValue: 5_000,
        forPayTotal: 2_200_000,
        ...overrides.fbo,
      }),
      fbs: createFulfillmentMetrics({
        ordersCount: 400,
        ordersRevenue: 2_000_000,
        salesCount: 350,
        salesRevenue: 1_750_000,
        returnsCount: 25,
        returnsRevenue: 125_000,
        returnRate: 6.3,
        avgOrderValue: 5_000,
        forPayTotal: 1_500_000,
        ...overrides.fbs,
      }),
      total: createFulfillmentTotal({
        ordersCount: 1000,
        ordersRevenue: 5_000_000,
        ...overrides.total,
      }),
    },
    period: { from: '2026-02-02', to: '2026-02-08' },
  }
}

// =============================================================================
// Advertising Fixtures
// =============================================================================

/**
 * Creates an AdvertisingSummary with realistic ad spend data.
 * Only includes fields relevant to dashboard metrics.
 */
export function createAdvertisingSummary(
  overrides: Partial<AdvertisingSummary> = {}
): AdvertisingSummary {
  return {
    total_spend: 75_000,
    total_sales: 1_500_000,
    total_revenue: 450_000,
    total_profit: 150_000,
    overall_roas: 6.0,
    overall_roi: 2.0,
    avg_ctr: 3.5,
    avg_cpc: 12.5,
    total_views: 500_000,
    total_clicks: 17_500,
    total_orders: 2_500,
    active_campaigns: 8,
    ...overrides,
  } as AdvertisingSummary
}

// =============================================================================
// Previous Period Data Fixtures
// =============================================================================

/**
 * Creates PreviousPeriodData for comparison testing.
 * Values are intentionally different from "current" to verify comparison logic.
 */
export function createPreviousPeriodData(
  overrides: Partial<PreviousPeriodData> = {}
): PreviousPeriodData {
  return {
    ordersAmount: 4_800_000,
    ordersCount: 950,
    saleGross: 1_400_000,
    wbCommissionsTotal: 135_000,
    logisticsCost: 170_000,
    payoutTotal: 900_000,
    storageAcceptanceTotal: 48_000,
    cogsTotal: 580_000,
    advertisingSpend: 70_000,
    grossProfit: 320_000,
    marginPct: 22.0,
    // Legacy fields
    ordersCogs: null,
    salesAmount: 1_600_000,
    salesCogs: 580_000,
    storageCost: 43_000,
    theoreticalProfit: null,
    ...overrides,
  }
}

// =============================================================================
// Derived Data Helpers (mimic DashboardContent aggregation)
// =============================================================================

/**
 * Aggregates salesCount from FBO + FBS (since FulfillmentTotal lacks it).
 * @see Story 65.1, 65.2: salesCount = fbo.salesCount + fbs.salesCount
 */
export function aggregateSalesCount(
  fulfillment: FulfillmentSummaryResponse | null | undefined
): number | undefined {
  if (!fulfillment) return undefined
  return fulfillment.summary.fbo.salesCount + fulfillment.summary.fbs.salesCount
}

/**
 * Aggregates returnsCount from FBO + FBS.
 * @see Story 65.5: returnsCount = fbo.returnsCount + fbs.returnsCount
 */
export function aggregateReturnsCount(
  fulfillment: FulfillmentSummaryResponse | null | undefined
): number | undefined {
  if (!fulfillment) return undefined
  return fulfillment.summary.fbo.returnsCount + fulfillment.summary.fbs.returnsCount
}

// =============================================================================
// Edge Case Data Factories
// =============================================================================

/** All zeros fulfillment (no orders placed) */
export const EMPTY_FULFILLMENT = createFulfillmentSummary({
  fbo: {
    ordersCount: 0,
    salesCount: 0,
    returnsCount: 0,
    ordersRevenue: 0,
    salesRevenue: 0,
    returnsRevenue: 0,
  },
  fbs: {
    ordersCount: 0,
    salesCount: 0,
    returnsCount: 0,
    ordersRevenue: 0,
    salesRevenue: 0,
    returnsRevenue: 0,
  },
  total: { ordersCount: 0, ordersRevenue: 0 },
})

/** Finance summary where everything is null (fresh account) */
export const NULL_FINANCE_SUMMARY = createFinanceSummary({
  sale_gross_total: undefined,
  sale_gross: undefined,
  logistics_cost_total: undefined,
  logistics_cost: undefined,
  wb_returns_gross_total: undefined,
  wb_returns_gross: undefined,
  commission_sales_total: undefined,
  commission_sales: undefined,
  acquiring_fee_total: undefined,
  acquiring_fee: undefined,
  wb_commission_adj_total: undefined,
  wb_commission_adj: undefined,
  loyalty_fee_total: undefined,
  loyalty_fee: undefined,
  wb_services_cost_total: undefined,
  wb_services_cost: undefined,
  other_adjustments_net_total: undefined,
  other_adjustments_net: undefined,
  cogs_total: null,
  gross_profit: null,
  margin_pct: null,
})

/** Previous period with all nulls (first period, nothing to compare) */
export const NULL_PREVIOUS_PERIOD: PreviousPeriodData = {
  ordersAmount: null,
  ordersCount: null,
  saleGross: null,
  wbCommissionsTotal: null,
  logisticsCost: null,
  payoutTotal: null,
  storageAcceptanceTotal: null,
  cogsTotal: null,
  advertisingSpend: null,
  grossProfit: null,
  marginPct: null,
  ordersCogs: null,
  salesAmount: null,
  salesCogs: null,
  storageCost: null,
  theoreticalProfit: null,
}
