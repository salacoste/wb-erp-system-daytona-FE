/**
 * Waterfall Chart Utilities
 * Story 5.3: Cost Breakdown Visualization
 *
 * Pure data transformation for the waterfall chart.
 * Extracted from UnitEconomicsWaterfall.tsx (Epic 74 - file size compliance).
 */

import { logger } from '@/lib/logger'
import { WATERFALL_COLORS, COST_CATEGORIES, COST_CATEGORY_BY_KEY } from './waterfall-chart-config'

// Re-export config for backward compatibility
export { WATERFALL_COLORS } from './waterfall-chart-config'

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

/**
 * Transform revenue + cost data into waterfall chart data points.
 * Revenue bar starts at 100%, each cost deducts from the running total,
 * and the final bar shows remaining profit/loss.
 *
 * @param revenue - Total revenue (RUB) for the period.
 * @param costsPct - Cost percentages by category key.
 * @param costsRub - Cost absolute values (RUB) by category key.
 * @param categoryOrder - Optional ordered list of category keys driving bar
 *   sequence. When absent or empty, falls back to the hardcoded `COST_CATEGORIES`
 *   order with a `console.warn` (per CLAUDE.md `### Defensive Frontend Principle`,
 *   making backend regressions visible to dev-tools watchers without breaking UX).
 *   Story 96.3-FE.
 */
export function transformToWaterfallData(
  revenue: number,
  costsPct: Record<string, number>,
  costsRub: Record<string, number>,
  categoryOrder?: string[]
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

  // Resolve effective ordering: backend-driven if provided + non-empty, else fallback.
  // Defensive: backend may rename or omit the field on regression — preserve UX,
  // surface in dev tools via console.warn (per CLAUDE.md ### Defensive Frontend Principle).
  let effectiveOrder: string[]
  if (categoryOrder && categoryOrder.length > 0) {
    effectiveOrder = categoryOrder
  } else {
    effectiveOrder = COST_CATEGORIES.map(c => c.key)
    logger.warn(
      '[unit-economics] meta.cost_category_order missing — using hardcoded fallback order. Backend response may be malformed.'
    )
  }

  // Cost categories (deductions) — iterate in effectiveOrder, look up label+color by key.
  for (const key of effectiveOrder) {
    const cat = COST_CATEGORY_BY_KEY[key]
    if (!cat) {
      // Backend introduced a category the frontend doesn't know how to render — skip.
      continue
    }

    const pct = costsPct[key] ?? 0
    const rub = costsRub[key] ?? 0

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

  // Profit/Loss bar (from 0 to remaining).
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

/**
 * F-44: compute the YAxis domain so the chart never clips a bar.
 *
 * The bars are stacked as a transparent `start` series + a visible `value` series, so each
 * bar's vertical extent is [start, start + value]. A hardcoded [0, 100] domain is WRONG when
 * COGS exceeds revenue (live: 14/32 SKUs at week 2026-W22 had cogs_pct > 100 %, e.g. 133 %):
 * the COGS bar's `start` goes negative (100 − 133 = −33) and a deep loss bar can exceed 100,
 * so the clipped chart UNDERSTATES the loss — a Defensive-Frontend / data-correctness defect.
 *
 * Returns a domain that always includes 0..100 and is widened outward to a tidy 20%-grid bound.
 */
export function computeWaterfallYDomain(data: WaterfallChartDataPoint[]): [number, number] {
  let min = 0
  let max = 100
  for (const p of data) {
    min = Math.min(min, p.start)
    max = Math.max(max, p.start + p.value, p.value)
  }
  // Round outward to a 20 % grid so the percentage axis ticks stay readable.
  const niceMin = Math.floor(min / 20) * 20
  const niceMax = Math.ceil(max / 20) * 20
  return [niceMin, niceMax]
}
