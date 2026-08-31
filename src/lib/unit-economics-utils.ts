/**
 * Unit Economics Utility Functions - Barrel re-export + analysis
 * Epic 5 / Epic 74 - Config & formatters extracted to ./unit-economics-config.ts
 * Analysis functions extracted to ./unit-economics-analysis.ts
 */

import type { CostsPct, CostsRub, WaterfallDataPoint } from '@/types/unit-economics'

import { COST_CATEGORIES } from './unit-economics-config'

// Barrel re-exports — preserve consumer API
export {
  PROFITABILITY_STATUS_CONFIG,
  getProfitabilityConfig,
  getProfitabilityLabel,
  getProfitabilityBadgeClasses,
  getStatusFromMargin,
  COST_CATEGORIES,
  getCostCategoryConfig,
  formatPercentage,
  formatCurrency,
  formatCompactNumber,
  formatMargin,
} from './unit-economics-config'

// Barrel re-exports from analysis module
export {
  getTopMarginKillers,
  calculateHealthScore,
  sortByProfitability,
  filterLossMaking,
  filterMissingCogs,
  filterByProfitabilityStatus,
} from './unit-economics-analysis'

/** Transform item costs to waterfall chart data: Revenue -> Costs -> Profit */
export function transformToWaterfallData(
  revenue: number,
  costsPct: CostsPct,
  costsRub: CostsRub
): WaterfallDataPoint[] {
  const dataPoints: WaterfallDataPoint[] = []
  let runningTotal = revenue

  // Start with revenue
  dataPoints.push({
    name: 'Выручка',
    value: revenue,
    runningTotal: revenue,
    color: 'var(--color-chart-positive)', // money-in bar (168.11 token)
    isProfit: false,
  })

  // Add each cost category (as negative)
  for (const category of COST_CATEGORIES) {
    const value = costsRub[category.key] ?? 0
    if (value > 0) {
      runningTotal -= value
      dataPoints.push({
        name: category.label,
        value: -value,
        runningTotal,
        color: category.color,
        isProfit: false,
      })
    }
  }

  // End with profit (what remains)
  const profit = runningTotal
  dataPoints.push({
    name: 'Прибыль',
    value: profit,
    runningTotal: profit,
    color: profit >= 0 ? 'var(--color-chart-positive)' : 'var(--color-chart-negative)',
    isProfit: true,
  })

  return dataPoints
}

/** Calculate WB fees total % (commission + logistics + storage + acceptance) */
export function calculateWbFeesPct(costsPct: CostsPct): number {
  return (
    costsPct.commission +
    costsPct.logistics_delivery +
    costsPct.logistics_return +
    costsPct.storage +
    costsPct.paid_acceptance
  )
}

/** Calculate WB fees total in RUB */
export function calculateWbFeesRub(costsRub: CostsRub): number {
  return (
    costsRub.commission +
    costsRub.logistics_delivery +
    costsRub.logistics_return +
    costsRub.storage +
    costsRub.paid_acceptance
  )
}
