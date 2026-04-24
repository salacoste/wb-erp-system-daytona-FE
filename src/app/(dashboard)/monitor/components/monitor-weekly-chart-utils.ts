/**
 * Monitor Weekly Chart — pure utilities
 * Epic 92-FE Story 92.4: 7-day line chart helpers.
 *
 * Adapts DailyMetrics (useDailyMetrics hook) to chart-row shape.
 * H-3 fix: salesCount + returnsCount now carried through DailyMetrics aggregation.
 * Chart shows 3 integer-count lines (Продажи / Заказы / Возвраты) on a uniform scale.
 * L-1 fix: weekday labels capitalized via capitalize() helper.
 */

import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { DailyMetrics } from '@/types/daily-metrics'

export interface ChartRow {
  /** ISO date string for tooltip reference */
  date: string
  /** Pre-formatted Russian x-axis label, e.g. "Пн 20.04" (capitalized) */
  label: string
  /** Sales count (DailyMetrics.salesCount from finance.sales_count) — integer, NOT currency */
  sales: number
  /** Total orders: salesCount + returnsCount (derived) — integer count */
  orders: number
  /** Returns count (DailyMetrics.returnsCount from finance.returns_count) — integer */
  returns: number
}

export const LINE_COLORS = {
  sales: '#3B82F6', // blue
  orders: '#22C55E', // green
  returns: '#F59E0B', // amber
} as const

export const LINE_LABELS = {
  sales: 'Продажи', // count, not currency — no "(руб.)"
  orders: 'Заказы',
  returns: 'Возвраты',
} as const

/**
 * Capitalize first character of a string (for weekday labels).
 * date-fns EEEEEE with ru locale produces lowercase ("пн") — we want "Пн".
 */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Transforms DailyMetrics[] into chart-row shape.
 * Produces one row per day with a pre-formatted Russian x-axis label (capitalized).
 *
 * Field mapping (H-3 fix — all integer counts, uniform Y-axis scale):
 *   sales   → day.salesCount               (completed sales count)
 *   orders  → day.salesCount + day.returnsCount  (derived total transactions)
 *   returns → day.returnsCount             (returns count)
 */
export function transformDailyToChartRows(data: DailyMetrics[]): ChartRow[] {
  return data.map(day => ({
    date: day.date,
    label: capitalize(format(new Date(day.date), 'EEEEEE dd.MM', { locale: ru })),
    sales: day.salesCount,
    orders: day.salesCount + day.returnsCount,
    returns: day.returnsCount,
  }))
}
