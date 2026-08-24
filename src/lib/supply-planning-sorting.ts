/**
 * Supply Planning Sorting & Filtering Helpers
 * Extracted from supply-planning-utils.ts for file size compliance
 */

import type { StockoutRisk } from '@/types/supply-planning'

/**
 * Risk severity order for sorting (higher = more urgent)
 */
export function getStockoutRiskSeverity(risk: StockoutRisk): number {
  // unknown = 0 (Story 169.13): sorts LAST in risk-desc (least urgent) yet stays
  // distinguishable from healthy — it must never be silently treated as healthiest for
  // filterByMinRisk purposes. Known tiers keep their exact previous values/ordering.
  const severity: Record<StockoutRisk, number> = {
    out_of_stock: 5,
    critical: 4,
    warning: 3,
    low: 2,
    healthy: 1,
    unknown: 0,
  }
  return severity[risk]
}

/**
 * Sort items by stockout risk (most urgent first)
 */
export function sortByStockoutRisk<T extends { stockout_risk: StockoutRisk }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => getStockoutRiskSeverity(b.stockout_risk) - getStockoutRiskSeverity(a.stockout_risk)
  )
}

/**
 * Filter items by minimum risk level
 */
export function filterByMinRisk<T extends { stockout_risk: StockoutRisk }>(
  items: T[],
  minRisk: StockoutRisk
): T[] {
  const minSeverity = getStockoutRiskSeverity(minRisk)
  return items.filter(item => getStockoutRiskSeverity(item.stockout_risk) >= minSeverity)
}
