/**
 * Unit Economics Analysis Functions — extracted from unit-economics-utils.ts
 * Health score, sorting, and filtering utilities for unit economics items.
 */

import type {
  CostsPct,
  UnitEconomicsItem,
  UnitEconomicsSummary,
  ProfitabilityStatus,
} from '@/types/unit-economics'
import { COST_CATEGORIES } from './unit-economics-config'

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
  // eslint-disable-next-line no-restricted-syntax -- AGGREGATION-REDUCE: null avg_net_margin_pct (no COGS / zero revenue) contributes 0 to the total
  const avgNetMarginPct = summary.avg_net_margin_pct ?? 0
  if (avgNetMarginPct >= 25) score += 35
  else if (avgNetMarginPct >= 15) score += 26
  else if (avgNetMarginPct >= 5) score += 18
  else if (avgNetMarginPct >= 0) score += 9

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
  // null margin sorts last — mirrors backend unit-economics.service.ts:656 (valA = a.net_margin_pct ?? -Infinity).
  const sorted = [...items].sort(
    (a, b) => (a.net_margin_pct ?? -Infinity) - (b.net_margin_pct ?? -Infinity)
  )
  return order === 'best_first' ? sorted.reverse() : sorted
}

/** Filter loss-making products */
export function filterLossMaking(items: UnitEconomicsItem[]): UnitEconomicsItem[] {
  // null margin is "unknown", not loss-making — excluded (rule 2 neutral branch).
  return items.filter(item => item.net_margin_pct != null && item.net_margin_pct < 0)
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
