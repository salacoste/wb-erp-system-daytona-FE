/**
 * Hook for calculating previous period comparison data
 * Dashboard Restructuring: P&L Narrative
 *
 * Extracts previous period data from finance-summary, fulfillment,
 * and advertising for dashboard comparison badges.
 */

import { useMemo } from 'react'
import type { PreviousPeriodData } from '@/components/custom/dashboard'
import type { FulfillmentSummaryResponse } from '@/types/fulfillment'
import type { FinanceSummary } from '@/types/finance-summary'

interface UsePreviousPeriodDataParams {
  // Story 70.1-FE: Single summary source (no field-level mixing)
  prevSummary: FinanceSummary | null | undefined
  fulfillmentPrevious: FulfillmentSummaryResponse | undefined
  advertisingPrevious: { summary?: { total_spend?: number } } | undefined
}

/**
 * Calculate previous period data for P&L dashboard comparison
 * Story 70.1-FE: Uses single summary_total source to avoid RUS/EAEU mixing
 */
export function usePreviousPeriodData(
  params: UsePreviousPeriodDataParams
): PreviousPeriodData | undefined {
  const { prevSummary: s, fulfillmentPrevious, advertisingPrevious } = params

  return useMemo<PreviousPeriodData | undefined>(() => {
    if (!s && !fulfillmentPrevious && !advertisingPrevious) {
      return undefined
    }

    const prevAdvertisingSpend = advertisingPrevious?.summary?.total_spend ?? null
    const prevLogisticsCost = s?.logistics_cost_total ?? null
    const prevStorageCost = s?.storage_cost_total ?? null
    const prevPaidAcceptance = s?.paid_acceptance_cost_total ?? null
    const prevCogsTotal = s?.cogs_total ?? null
    const prevWbPromotionCost = s?.wb_promotion_cost_total ?? null

    // WB Commissions: sum of 6 commission/fee fields, minus wb_promotion_cost
    // (promotions shown separately in AdvertisingCard)
    const commissionFields = [
      s?.commission_sales_total,
      s?.acquiring_fee_total,
      s?.loyalty_fee_total,
      s?.penalties_total,
      s?.wb_commission_adj_total,
      s?.wb_services_cost_total,
    ]
    const hasAnyCommission = commissionFields.some(v => v != null)
    let wbCommissionsTotal: number | null = hasAnyCommission
      ? commissionFields.reduce<number>((sum, v) => sum + (v ?? 0), 0)
      : null
    // Subtract promotion cost to avoid double-counting with AdvertisingCard
    if (wbCommissionsTotal != null && prevWbPromotionCost != null) {
      wbCommissionsTotal -= prevWbPromotionCost
    }

    // Storage + Acceptance combined
    const storageAcceptanceTotal =
      prevStorageCost != null || prevPaidAcceptance != null
        ? (prevStorageCost ?? 0) + (prevPaidAcceptance ?? 0)
        : null

    return {
      ordersAmount: fulfillmentPrevious?.summary.total.ordersRevenue ?? null,
      ordersCount: fulfillmentPrevious?.summary.total.ordersCount ?? null,
      saleGross: s?.sale_gross_total ?? null,
      wbCommissionsTotal,
      logisticsCost: prevLogisticsCost,
      payoutTotal: s?.payout_total ?? null,
      storageAcceptanceTotal,
      cogsTotal: prevCogsTotal,
      advertisingSpend: prevAdvertisingSpend,
      wbPromotionCost: prevWbPromotionCost,
      grossProfit: s?.gross_profit ?? null,
      marginPct: s?.margin_pct ?? null,
      // Request #155: Analytical profit/margin
      grossProfitAnalytical: s?.gross_profit_analytical ?? null,
      operatingProfitAnalytical: s?.operating_profit_analytical ?? null,
      grossMarginPct: s?.gross_margin_pct ?? null,
      operatingMarginPct: s?.operating_margin_pct ?? null,
      // Epic 66-FE: Tax metrics for comparison
      taxMetrics: s?.tax ?? null,
      // Legacy fields for backward compatibility
      ordersCogs: null,
      salesAmount: s?.wb_sales_gross_total ?? null,
      salesCogs: prevCogsTotal,
      storageCost: prevStorageCost,
      theoreticalProfit: null,
    }
  }, [s, fulfillmentPrevious, advertisingPrevious])
}
