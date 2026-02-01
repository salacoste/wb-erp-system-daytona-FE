/**
 * Hook for calculating previous period comparison data
 * Epic 62-FE: Dashboard UI/UX Presentation
 *
 * Extracts previous period data from multiple data sources
 * for dashboard comparison badges.
 */

import { useMemo } from 'react'
import { calculateTheoreticalProfit } from '@/lib/theoretical-profit'
import type { PreviousPeriodData } from '@/components/custom/dashboard'
import type { FulfillmentSummaryResponse } from '@/types/fulfillment'

interface FinancialSummaryData {
  cogs_total?: number | null
}

interface UsePreviousPeriodDataParams {
  fulfillmentPrevious: FulfillmentSummaryResponse | undefined
  advertisingPrevious: { summary?: { total_spend?: number } } | undefined
  ordersCogsTotal: number | null | undefined
  prevSummaryRus: FinancialSummaryData | null | undefined
  prevSummaryTotal: FinancialSummaryData | null | undefined
  prevSalesAmount: number | null | undefined
  prevLogisticsCost: number | null | undefined
  prevStorageCost: number | null | undefined
}

/**
 * Calculate previous period data for dashboard comparison
 */
export function usePreviousPeriodData(
  params: UsePreviousPeriodDataParams
): PreviousPeriodData | undefined {
  const {
    fulfillmentPrevious,
    advertisingPrevious,
    ordersCogsTotal,
    prevSummaryRus,
    prevSummaryTotal,
    prevSalesAmount,
    prevLogisticsCost,
    prevStorageCost,
  } = params

  return useMemo<PreviousPeriodData | undefined>(() => {
    const hasPrevFinancial = prevSummaryRus || prevSummaryTotal
    if (!advertisingPrevious && !ordersCogsTotal && !hasPrevFinancial) {
      return undefined
    }

    const prevOrdersAmount = fulfillmentPrevious?.summary.total.ordersRevenue ?? null
    const prevOrdersCogs = ordersCogsTotal ?? null
    const prevAdvertisingSpend = advertisingPrevious?.summary?.total_spend ?? null
    const prevCogsTotal = prevSummaryRus?.cogs_total ?? prevSummaryTotal?.cogs_total ?? null

    const prevTheoreticalProfit =
      prevSalesAmount != null &&
      prevCogsTotal != null &&
      prevAdvertisingSpend != null &&
      prevLogisticsCost != null &&
      prevStorageCost != null
        ? calculateTheoreticalProfit({
            salesAmount: prevSalesAmount,
            cogs: prevCogsTotal,
            advertisingSpend: prevAdvertisingSpend,
            logisticsCost: prevLogisticsCost,
            storageCost: prevStorageCost,
          })
        : null

    return {
      ordersAmount: prevOrdersAmount,
      ordersCogs: prevOrdersCogs,
      salesAmount: prevSalesAmount ?? null,
      salesCogs: prevSummaryRus?.cogs_total ?? prevSummaryTotal?.cogs_total ?? null,
      advertisingSpend: prevAdvertisingSpend,
      logisticsCost: prevLogisticsCost ?? null,
      storageCost: prevStorageCost ?? null,
      theoreticalProfit: prevTheoreticalProfit?.value ?? null,
    }
  }, [
    fulfillmentPrevious,
    advertisingPrevious,
    ordersCogsTotal,
    prevSummaryRus,
    prevSummaryTotal,
    prevSalesAmount,
    prevLogisticsCost,
    prevStorageCost,
  ])
}
