/**
 * Expense Chart Configuration
 * Story 63.9-FE: Expense Structure Pie Chart
 * Epic 63-FE: Dashboard Main Page Enhancement
 *
 * Color palette and category labels for expense structure chart.
 * @see docs/stories/epic-63/story-63.9-fe-expense-structure-chart.md
 */

import type { CostsPct, CostsRub } from '@/types/unit-economics'

/**
 * Expense category configuration with colors and Russian labels
 * Colors match COST_CATEGORIES in unit-economics-utils.ts
 */
export const EXPENSE_COLORS: Record<keyof CostsPct, { color: string; label: string }> = {
  cogs: { color: '#6366F1', label: 'Себестоимость' },
  commission: { color: '#8B5CF6', label: 'Комиссия WB' },
  logistics_delivery: { color: '#EC4899', label: 'Доставка' },
  logistics_return: { color: '#F43F5E', label: 'Возвраты' },
  storage: { color: '#F97316', label: 'Хранение' },
  paid_acceptance: { color: '#EAB308', label: 'Приёмка' },
  penalties: { color: '#EF4444', label: 'Штрафы' },
  other_deductions: { color: '#6B7280', label: 'Прочие' },
  advertising: { color: '#14B8A6', label: 'Реклама' },
}

/**
 * Chart data item for pie chart segments
 * Index signature required for Recharts compatibility
 */
export interface ExpenseChartDataItem {
  /** Category key */
  key: keyof CostsPct
  /** Russian display name */
  name: string
  /** Absolute value in RUB */
  value: number
  /** Percentage of total costs */
  percentage: number
  /** Hex color */
  color: string
  /** Index signature for Recharts compatibility */
  [key: string]: string | number
}

/**
 * Transform API costs data to chart-ready format
 * Filters out zero values and sorts by value descending
 */
export function transformToChartData(
  costsRub: CostsRub,
  costsPct: CostsPct
): ExpenseChartDataItem[] {
  return (Object.entries(costsRub) as [keyof CostsRub, number][])
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      key: key as keyof CostsPct,
      name: EXPENSE_COLORS[key]?.label ?? key,
      value,
      percentage: costsPct[key] ?? 0,
      color: EXPENSE_COLORS[key]?.color ?? '#6B7280',
    }))
    .sort((a, b) => b.value - a.value)
}

/**
 * Calculate total expenses from chart data
 */
export function calculateTotalExpenses(data: ExpenseChartDataItem[]): number {
  return data.reduce((sum, item) => sum + item.value, 0)
}
