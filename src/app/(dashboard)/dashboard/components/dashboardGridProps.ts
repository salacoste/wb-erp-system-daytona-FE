/**
 * Build the shared DashboardMetricsGridProps from useDashboardData (TZ-5 extraction).
 *
 * Centralises the `d` → DashboardMetricsGridProps mapping so both the hero (T1) and the
 * detailed grid (T2) consume one source, and keeps DashboardContent.tsx under the line cap.
 *
 * @see docs/ux/IMPLEMENTATION-TZ.md (TZ-5)
 */

import type { DashboardMetricsGridProps } from '@/components/custom/dashboard/DashboardMetricsGridTypes'
import type { useDashboardData } from './useDashboardData'

type DashboardData = ReturnType<typeof useDashboardData>

export function buildDashboardGridProps(
  d: DashboardData,
  onAssignCogs: (() => void) | undefined
): DashboardMetricsGridProps {
  return {
    totalOrders: d.fSummary?.total.ordersCount,
    ordersRevenue: d.fSummary?.total.ordersRevenue,
    ordersRevenueDiscounted: d.fSummary?.total.ordersRevenueDiscounted,
    salesCount: d.salesCount,
    returnsCount: d.returnsCount,
    saleGross: d.summary?.sale_gross_total,
    wbSalesGross: d.summary?.wb_sales_gross_total,
    wbReturnsGross: d.summary?.wb_returns_gross_total,
    commissionSales: d.summary?.commission_sales_total,
    acquiringFee: d.summary?.acquiring_fee_total,
    loyaltyFee: d.summary?.loyalty_fee_total,
    penaltiesTotal: d.summary?.penalties_total,
    wbCommissionAdj: d.summary?.wb_commission_adj_total,
    logisticsCost: d.summary?.logistics_cost_total,
    logisticsBreakdown: d.logisticsBreakdown,
    payoutTotal: d.summary?.payout_total,
    storageCost: d.summary?.storage_cost_total,
    paidAcceptanceCost: d.summary?.paid_acceptance_cost_total,
    cogsTotal: d.summary?.cogs_total ?? undefined,
    cogsCoverage: d.cogsCoverage,
    productsWithCogs: d.inventoryWithCogs,
    totalProducts: d.totalProducts ?? 0,
    advertisingSpend: d.advertisingQuery.current?.summary?.total_spend,
    advertisingRoas: d.advertisingQuery.current?.summary?.overall_roas,
    wbPromotionCost: d.summary?.wb_promotion_cost_total ?? undefined,
    wbJamCost: d.summary?.wb_jam_cost_total ?? undefined,
    wbOtherServicesCost: d.summary?.wb_other_services_cost_total ?? undefined,
    grossProfit: d.summary?.gross_profit ?? undefined,
    marginPct: d.summary?.margin_pct ?? undefined,
    grossProfitAnalytical: d.summary?.gross_profit_analytical ?? undefined,
    operatingProfitAnalytical: d.summary?.operating_profit_analytical ?? undefined,
    operatingMarginPct: d.summary?.operating_margin_pct ?? undefined,
    grossMarginPct: d.summary?.gross_margin_pct ?? undefined,
    taxMetrics: d.effectiveTaxMetrics ?? null,
    previousPeriodData: d.previousPeriodData,
    isLoading: d.isLoading,
    error: d.error,
    onRetry: d.handleRetry,
    onAssignCogs,
  }
}
