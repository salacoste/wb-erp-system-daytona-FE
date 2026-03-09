'use client'

/**
 * Waterfall Data Hook
 * Story 5.3: Cost Breakdown Visualization
 *
 * Computes portfolio-level or single-SKU waterfall chart data.
 * Extracted from UnitEconomicsWaterfall.tsx (Epic 74 - file size compliance).
 */

import { useMemo } from 'react'
import type { UnitEconomicsItem, UnitEconomicsSummary } from '@/types/unit-economics'
import {
  transformToWaterfallData,
  WATERFALL_COLORS,
  type WaterfallChartDataPoint,
} from './waterfall-chart-utils'

interface UseWaterfallDataParams {
  data: UnitEconomicsItem[]
  summary: UnitEconomicsSummary
  selectedSku?: string
}

interface UseWaterfallDataResult {
  selectedItem: UnitEconomicsItem | null
  waterfallData: WaterfallChartDataPoint[]
  legendItems: Array<{ name: string; color: string }>
}

/** Aggregate portfolio costs as weighted average percentages */
function aggregatePortfolioCosts(
  data: UnitEconomicsItem[],
  summary: UnitEconomicsSummary
): { costsPct: Record<string, number>; costsRub: Record<string, number> } {
  const totalRevenue = summary.total_revenue

  const costsPct: Record<string, number> = {
    cogs: summary.avg_cogs_pct,
    commission: 0,
    logistics_delivery: 0,
    logistics_return: 0,
    storage: 0,
    paid_acceptance: 0,
    penalties: 0,
    other_deductions: 0,
    advertising: 0,
  }

  if (data.length > 0 && totalRevenue > 0) {
    let totalCogs = 0
    let totalCommission = 0
    let totalLogisticsDelivery = 0
    let totalLogisticsReturn = 0
    let totalStorage = 0
    let totalPaidAcceptance = 0
    let totalPenalties = 0
    let totalOther = 0
    let totalAdvertising = 0

    for (const item of data) {
      const weight = item.revenue / totalRevenue
      totalCogs += item.costs_pct.cogs * weight
      totalCommission += item.costs_pct.commission * weight
      totalLogisticsDelivery += item.costs_pct.logistics_delivery * weight
      totalLogisticsReturn += item.costs_pct.logistics_return * weight
      totalStorage += item.costs_pct.storage * weight
      totalPaidAcceptance += item.costs_pct.paid_acceptance * weight
      totalPenalties += item.costs_pct.penalties * weight
      totalOther += item.costs_pct.other_deductions * weight
      totalAdvertising += item.costs_pct.advertising * weight
    }

    costsPct.cogs = totalCogs
    costsPct.commission = totalCommission
    costsPct.logistics_delivery = totalLogisticsDelivery
    costsPct.logistics_return = totalLogisticsReturn
    costsPct.storage = totalStorage
    costsPct.paid_acceptance = totalPaidAcceptance
    costsPct.penalties = totalPenalties
    costsPct.other_deductions = totalOther
    costsPct.advertising = totalAdvertising
  }

  // Calculate absolute values from percentages
  const costsRub: Record<string, number> = {}
  for (const key of Object.keys(costsPct)) {
    costsRub[key] = totalRevenue * (costsPct[key] / 100)
  }

  return { costsPct, costsRub }
}

/**
 * Hook that computes waterfall chart data from unit economics items.
 * Returns selected item, chart data points, and legend items.
 */
export function useWaterfallData({
  data,
  summary,
  selectedSku,
}: UseWaterfallDataParams): UseWaterfallDataResult {
  const selectedItem = useMemo(() => {
    if (selectedSku) {
      return data.find(item => item.sku_id === selectedSku) ?? null
    }
    return null
  }, [data, selectedSku])

  const waterfallData = useMemo(() => {
    if (selectedItem) {
      return transformToWaterfallData(
        selectedItem.revenue,
        selectedItem.costs_pct as unknown as Record<string, number>,
        selectedItem.costs_rub as unknown as Record<string, number>
      )
    }

    const { costsPct, costsRub } = aggregatePortfolioCosts(data, summary)
    return transformToWaterfallData(summary.total_revenue, costsPct, costsRub)
  }, [data, summary, selectedItem])

  const legendItems = useMemo(() => {
    const items = waterfallData
      .filter(d => !d.isRevenue && !d.isProfit && d.percentage > 0.5)
      .map(d => ({ name: d.name, color: d.fill }))

    const lastPoint = waterfallData[waterfallData.length - 1]
    return [
      { name: 'Выручка', color: WATERFALL_COLORS.revenue },
      ...items,
      { name: lastPoint?.name || 'Прибыль', color: lastPoint?.fill || WATERFALL_COLORS.profit },
    ]
  }, [waterfallData])

  return { selectedItem, waterfallData, legendItems }
}
