/**
 * Waterfall Chart Utilities
 * Story 5.3: Cost Breakdown Visualization
 *
 * Pure data transformation and constants for the waterfall chart.
 * Extracted from UnitEconomicsWaterfall.tsx (Epic 74 - file size compliance).
 */

export interface WaterfallChartDataPoint {
  name: string
  value: number
  start: number
  end: number
  fill: string
  isProfit: boolean
  isRevenue: boolean
  percentage: number
  absoluteValue: number
}

/** Color scheme from UX specs */
export const WATERFALL_COLORS = {
  revenue: '#2196F3', // Blue - starting point
  cogs: '#FF9800', // Orange - significant cost
  commission: '#9C27B0', // Purple - WB brand
  logistics_delivery: '#00BCD4', // Teal - movement
  logistics_return: '#4DD0E1', // Cyan - related to delivery
  storage: '#795548', // Brown - warehouse
  paid_acceptance: '#FFC107', // Amber - processing
  penalties: '#F44336', // Red - negative
  other_deductions: '#9E9E9E', // Gray - misc
  advertising: '#14B8A6', // Teal - marketing
  profit: '#4CAF50', // Green - positive outcome
  loss: '#F44336', // Red - negative outcome
}

/** Cost categories configuration for waterfall chart bars */
const COST_CATEGORIES = [
  { key: 'cogs', label: 'COGS', color: WATERFALL_COLORS.cogs },
  { key: 'commission', label: 'Комиссия', color: WATERFALL_COLORS.commission },
  { key: 'logistics_delivery', label: 'Доставка', color: WATERFALL_COLORS.logistics_delivery },
  { key: 'logistics_return', label: 'Возвраты', color: WATERFALL_COLORS.logistics_return },
  { key: 'storage', label: 'Хранение', color: WATERFALL_COLORS.storage },
  { key: 'paid_acceptance', label: 'Приёмка', color: WATERFALL_COLORS.paid_acceptance },
  { key: 'penalties', label: 'Штрафы', color: WATERFALL_COLORS.penalties },
  { key: 'other_deductions', label: 'Прочее', color: WATERFALL_COLORS.other_deductions },
  { key: 'advertising', label: 'Реклама', color: WATERFALL_COLORS.advertising },
]

/**
 * Transform revenue + cost data into waterfall chart data points.
 * Revenue bar starts at 100%, each cost deducts from the running total,
 * and the final bar shows remaining profit/loss.
 */
export function transformToWaterfallData(
  revenue: number,
  costsPct: Record<string, number>,
  costsRub: Record<string, number>
): WaterfallChartDataPoint[] {
  const dataPoints: WaterfallChartDataPoint[] = []
  let runningTotal = 100 // Start at 100%

  // Revenue bar (full height from 0)
  dataPoints.push({
    name: 'Выручка',
    value: 100,
    start: 0,
    end: 100,
    fill: WATERFALL_COLORS.revenue,
    isProfit: false,
    isRevenue: true,
    percentage: 100,
    absoluteValue: revenue,
  })

  // Cost categories (deductions)
  for (const cat of COST_CATEGORIES) {
    const pct = costsPct[cat.key] || 0
    const rub = costsRub[cat.key] || 0

    if (pct > 0.5) {
      // Only show if > 0.5%
      const newTotal = runningTotal - pct
      dataPoints.push({
        name: cat.label,
        value: pct,
        start: newTotal,
        end: runningTotal,
        fill: cat.color,
        isProfit: false,
        isRevenue: false,
        percentage: pct,
        absoluteValue: rub,
      })
      runningTotal = newTotal
    }
  }

  // Profit/Loss bar (from 0 to remaining)
  const profitPct = runningTotal
  const profitRub = revenue * (profitPct / 100)
  dataPoints.push({
    name: profitPct >= 0 ? 'Прибыль' : 'Убыток',
    value: Math.abs(profitPct),
    start: 0,
    end: Math.max(0, profitPct),
    fill: profitPct >= 0 ? WATERFALL_COLORS.profit : WATERFALL_COLORS.loss,
    isProfit: true,
    isRevenue: false,
    percentage: profitPct,
    absoluteValue: profitRub,
  })

  return dataPoints
}
