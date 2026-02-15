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
  prevSummaryRus: FinanceSummary | null | undefined
  prevSummaryTotal: FinanceSummary | null | undefined
  fulfillmentPrevious: FulfillmentSummaryResponse | undefined
  advertisingPrevious: { summary?: { total_spend?: number } } | undefined
}

/**
 * Calculate previous period data for P&L dashboard comparison
 */
export function usePreviousPeriodData(
  params: UsePreviousPeriodDataParams
): PreviousPeriodData | undefined {
  const {
    prevSummaryRus: s,
    prevSummaryTotal: st,
    fulfillmentPrevious,
    advertisingPrevious,
  } = params

  return useMemo<PreviousPeriodData | undefined>(() => {
    if (!s && !st && !fulfillmentPrevious && !advertisingPrevious) {
      return undefined
    }

    const prevAdvertisingSpend = advertisingPrevious?.summary?.total_spend ?? null
    const prevLogisticsCost = s?.logistics_cost ?? st?.logistics_cost_total ?? null
    const prevStorageCost = s?.storage_cost ?? st?.storage_cost_total ?? null
    const prevPaidAcceptance = s?.paid_acceptance_cost ?? st?.paid_acceptance_cost_total ?? null
    const prevCogsTotal = s?.cogs_total ?? st?.cogs_total ?? null

    // WB Commissions: sum of 6 commission/fee fields
    const commissionFields = [
      s?.commission_sales ?? st?.commission_sales_total,
      s?.acquiring_fee ?? st?.acquiring_fee_total,
      s?.loyalty_fee ?? st?.loyalty_fee_total,
      s?.penalties_total ?? st?.penalties_total,
      s?.wb_commission_adj ?? st?.wb_commission_adj_total,
      s?.wb_services_cost ?? st?.wb_services_cost_total,
    ]
    const hasAnyCommission = commissionFields.some(v => v != null)
    const wbCommissionsTotal: number | null = hasAnyCommission
      ? commissionFields.reduce<number>((sum, v) => sum + (v ?? 0), 0)
      : null

    // Storage + Acceptance combined
    const storageAcceptanceTotal =
      prevStorageCost != null || prevPaidAcceptance != null
        ? (prevStorageCost ?? 0) + (prevPaidAcceptance ?? 0)
        : null

    return {
      ordersAmount: fulfillmentPrevious?.summary.total.ordersRevenue ?? null,
      ordersCount: fulfillmentPrevious?.summary.total.ordersCount ?? null,
      saleGross: s?.sale_gross ?? st?.sale_gross_total ?? null,
      wbCommissionsTotal,
      logisticsCost: prevLogisticsCost,
      payoutTotal: s?.payout_total ?? st?.payout_total ?? null,
      storageAcceptanceTotal,
      cogsTotal: prevCogsTotal,
      advertisingSpend: prevAdvertisingSpend,
      grossProfit: s?.gross_profit ?? st?.gross_profit ?? null,
      marginPct: s?.margin_pct ?? st?.margin_pct ?? null,
      // Legacy fields for backward compatibility
      ordersCogs: null,
      salesAmount: s?.wb_sales_gross ?? st?.wb_sales_gross_total ?? null,
      salesCogs: prevCogsTotal,
      storageCost: prevStorageCost,
      theoreticalProfit: null,
    }
  }, [s, st, fulfillmentPrevious, advertisingPrevious])
}
