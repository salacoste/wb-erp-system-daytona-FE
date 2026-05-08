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
  delivery_to_warehouse: '#06B6D4', // Cyan - seller delivery cost
  profit: '#4CAF50', // Green - positive outcome
  loss: '#F44336', // Red - negative outcome
}

/**
 * Cost categories configuration for waterfall chart bars.
 * Indexed by `key` for runtime lookup of label + color when ordering is
 * driven externally (e.g., by `meta.cost_category_order` from backend).
 *
 * The array order below is the FALLBACK order — used only when the backend
 * does not provide `cost_category_order` in the response meta. Real ordering
 * for production cabinets comes from the backend (per request-backend/173 § F4)
 * via `transformToWaterfallData(..., categoryOrder)`. Story 96.3-FE.
 */
const COST_CATEGORIES = [
  { key: 'cogs', label: 'COGS', color: WATERFALL_COLORS.cogs },
  { key: 'commission', label: 'Комиссия', color: WATERFALL_COLORS.commission },
  { key: 'logistics_delivery', label: 'Доставка', color: WATERFALL_COLORS.logistics_delivery },
  { key: 'logistics_return', label: 'Возвраты', color: WATERFALL_COLORS.logistics_return },
  { key: 'storage', label: 'Хранение', color: WATERFALL_COLORS.storage },
  {
    key: 'delivery_to_warehouse',
    label: 'Доставка на склад',
    color: WATERFALL_COLORS.delivery_to_warehouse,
  },
  { key: 'paid_acceptance', label: 'Приёмка', color: WATERFALL_COLORS.paid_acceptance },
  { key: 'penalties', label: 'Штрафы', color: WATERFALL_COLORS.penalties },
  { key: 'other_deductions', label: 'Прочее', color: WATERFALL_COLORS.other_deductions },
  { key: 'advertising', label: 'Реклама', color: WATERFALL_COLORS.advertising },
]

/** Lookup table: category key → { label, color }. Built from COST_CATEGORIES. */
const COST_CATEGORY_BY_KEY: Record<string, { label: string; color: string }> = Object.fromEntries(
  COST_CATEGORIES.map(c => [c.key, { label: c.label, color: c.color }])
)

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
    console.warn(
      '[unit-economics] meta.cost_category_order missing — using hardcoded fallback order. Backend response may be malformed.'
    )
  }

  // Cost categories (deductions) — iterate in effectiveOrder, look up label+color by key.
  for (const key of effectiveOrder) {
    const cat = COST_CATEGORY_BY_KEY[key]
    if (!cat) {
      // Backend introduced a category the frontend doesn't know how to render — skip.
      // (Not a defect; backwards-compatible additive changes from backend should not break UX.)
      continue
    }

    const pct = costsPct[key] || 0
    const rub = costsRub[key] || 0

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
