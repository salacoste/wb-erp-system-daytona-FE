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
 *
 * Story 172.1: registered tokens, hue-faithful where a same-family token
 * exists (indigo/violet → chart-1/2, pink → chart-6, orange → chart-5,
 * cyan → chart-3, misc gray → muted-foreground). The two red-family costs
 * keep their negative reading via chart-negative / status-error, and the
 * amber acceptance fee maps to the warning tone (amber ≡ warning canon).
 */
export const EXPENSE_COLORS: Record<keyof CostsPct, { color: string; label: string }> = {
  cogs: { color: 'var(--color-chart-1)', label: 'Себестоимость' },
  commission: { color: 'var(--color-chart-2)', label: 'Комиссия WB' },
  logistics_delivery: { color: 'var(--color-chart-6)', label: 'Доставка' },
  logistics_return: { color: 'var(--color-status-error)', label: 'Возвраты' },
  storage: { color: 'var(--color-chart-5)', label: 'Хранение' },
  paid_acceptance: { color: 'var(--color-status-warning)', label: 'Приёмка' },
  penalties: { color: 'var(--color-chart-negative)', label: 'Штрафы' },
  other_deductions: { color: 'var(--color-muted-foreground)', label: 'Прочие' },
  advertising: { color: 'var(--color-chart-4)', label: 'Реклама' },
  delivery_to_warehouse: { color: 'var(--color-chart-3)', label: 'Доставка на склад' },
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
  /** Segment color (CSS-variable token string) */
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
      color: EXPENSE_COLORS[key]?.color ?? 'var(--color-muted-foreground)',
    }))
    .sort((a, b) => b.value - a.value)
}

/**
 * Calculate total expenses from chart data
 */
export function calculateTotalExpenses(data: ExpenseChartDataItem[]): number {
  return data.reduce((sum, item) => sum + item.value, 0)
}
