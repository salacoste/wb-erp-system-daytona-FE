/**
 * Unit Economics Utility Functions - Barrel re-export + analysis
 * Epic 5 / Epic 74 - Config & formatters extracted to ./unit-economics-config.ts
 */

import type {
  CostsPct,
  CostsRub,
  WaterfallDataPoint,
  UnitEconomicsItem,
  UnitEconomicsSummary,
  ProfitabilityStatus,
} from '@/types/unit-economics'

import { COST_CATEGORIES } from './unit-economics-config'

// Barrel re-exports — preserve consumer API
export {
  PROFITABILITY_STATUS_CONFIG,
  getProfitabilityConfig,
  getProfitabilityColor,
  getProfitabilityLabel,
  getProfitabilityBadgeClasses,
  getProfitabilityBgClass,
  getStatusFromMargin,
  COST_CATEGORIES,
  getCostCategoryConfig,
  formatPercentage,
  formatCurrency,
  formatCompactNumber,
  formatMargin,
} from './unit-economics-config'

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
    color: '#22C55E', // green
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
    color: profit >= 0 ? '#22C55E' : '#EF4444',
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

/** Get top margin killers (costs with highest % impact) */
export function getTopMarginKillers(
  costsPct: CostsPct,
  limit = 3
): Array<{ key: keyof CostsPct; label: string; pct: number; color: string }> {
  const costs = COST_CATEGORIES.filter(c => (costsPct[c.key] ?? 0) > 0)
    .map(c => ({
      key: c.key,
      label: c.label,
      pct: costsPct[c.key] ?? 0,
      color: c.color,
    }))
    .sort((a, b) => b.pct - a.pct)

  return costs.slice(0, limit)
}

/** Calculate summary health score (0-100): margin + profitable ratio + COGS coverage + delivery bonus (Story 77.5) */
export function calculateHealthScore(
  summary: UnitEconomicsSummary,
  deliveryCoverageRatio?: number
): number {
  let score = 0

  // Margin component (0-35 points)
  if (summary.avg_net_margin_pct >= 25) score += 35
  else if (summary.avg_net_margin_pct >= 15) score += 26
  else if (summary.avg_net_margin_pct >= 5) score += 18
  else if (summary.avg_net_margin_pct >= 0) score += 9

  // Profitable ratio component (0-35 points)
  const profitableRatio =
    summary.sku_count > 0 ? summary.profitable_sku_count / summary.sku_count : 0
  score += Math.round(profitableRatio * 35)

  // COGS coverage component (0-20 points)
  const cogsRatio = summary.sku_count > 0 ? 1 - summary.missing_cogs_count / summary.sku_count : 0
  score += Math.round(cogsRatio * 20)

  // Delivery coverage bonus (0-10 points) — reward confirmed shipment cost data
  if (deliveryCoverageRatio != null) {
    if (deliveryCoverageRatio > 0.8) score += 10
    else if (deliveryCoverageRatio > 0.5) score += 5
  }

  return Math.min(100, Math.max(0, score))
}

/** Get health score label and color */
export function getHealthScoreInfo(score: number): {
  label: string
  color: string
  bgColor: string
} {
  if (score >= 80) return { label: 'Отлично', color: '#22C55E', bgColor: '#DCFCE7' }
  if (score >= 60) return { label: 'Хорошо', color: '#84CC16', bgColor: '#ECFCCB' }
  if (score >= 40) return { label: 'Нормально', color: '#EAB308', bgColor: '#FEF9C3' }
  if (score >= 20) return { label: 'Слабо', color: '#F97316', bgColor: '#FFEDD5' }
  return { label: 'Критично', color: '#EF4444', bgColor: '#FEE2E2' }
}

/** Sort items by profitability (worst first for action prioritization) */
export function sortByProfitability(
  items: UnitEconomicsItem[],
  order: 'worst_first' | 'best_first' = 'worst_first'
): UnitEconomicsItem[] {
  const sorted = [...items].sort((a, b) => a.net_margin_pct - b.net_margin_pct)
  return order === 'best_first' ? sorted.reverse() : sorted
}

/** Filter loss-making products */
export function filterLossMaking(items: UnitEconomicsItem[]): UnitEconomicsItem[] {
  return items.filter(item => item.net_margin_pct < 0)
}

/** Filter products without COGS */
export function filterMissingCogs(items: UnitEconomicsItem[]): UnitEconomicsItem[] {
  return items.filter(item => !item.has_cogs)
}

/** Get items by profitability status */
export function filterByProfitabilityStatus(
  items: UnitEconomicsItem[],
  status: ProfitabilityStatus
): UnitEconomicsItem[] {
  return items.filter(item => item.profitability_status === status)
}
