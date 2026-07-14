import type { FinanceSummary } from '@/types/finance-summary'

/** Metric configuration for rendering period comparison cards. */
export interface MetricConfig {
  key: 'revenue' | 'profit' | 'margin_pct' | 'orders' | 'logistics' | 'storage'
  title: string
  format: 'currency' | 'percentage' | 'number'
  invertDirection: boolean
}

export const WEEK_TOP_METRICS: MetricConfig[] = [
  { key: 'revenue', title: 'Выручка', format: 'currency', invertDirection: false },
  { key: 'profit', title: 'Прибыль', format: 'currency', invertDirection: false },
  { key: 'margin_pct', title: 'Маржа', format: 'percentage', invertDirection: false },
  { key: 'orders', title: 'Заказы', format: 'number', invertDirection: false },
]

export const MONTH_TOP_METRICS: MetricConfig[] = [
  { key: 'revenue', title: 'Выручка', format: 'currency', invertDirection: false },
  { key: 'profit', title: 'Прибыль', format: 'currency', invertDirection: false },
  { key: 'margin_pct', title: 'Маржа', format: 'percentage', invertDirection: false },
  { key: 'orders', title: 'Выкупы', format: 'number', invertDirection: false },
]

export const WEEK_EXPENSE_METRICS: MetricConfig[] = [
  { key: 'logistics', title: 'Логистика', format: 'currency', invertDirection: true },
  { key: 'storage', title: 'Хранение', format: 'currency', invertDirection: true },
]

export const MONTH_EXPENSE_METRICS: MetricConfig[] = [
  { key: 'logistics', title: 'Логистика', format: 'currency', invertDirection: true },
  { key: 'storage', title: 'Хранение и приёмка', format: 'currency', invertDirection: true },
]

export function getPreviousMonth(month: string): string {
  const [yearRaw, monthRaw] = month.split('-')
  const year = Number(yearRaw)
  const monthIndex = Number(monthRaw)

  if (!year || !monthIndex) return ''

  const date = new Date(Date.UTC(year, monthIndex - 2, 1))
  const y = date.getUTCFullYear()
  const m = `${date.getUTCMonth() + 1}`.padStart(2, '0')
  return `${y}-${m}`
}

export function formatMonthLabel(month: string): string {
  const [yearRaw, monthRaw] = month.split('-')
  const year = Number(yearRaw)
  const monthIndex = Number(monthRaw)

  if (!year || !monthIndex) return month

  return new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, monthIndex - 1, 1)))
}

export function getSummaryValue(
  summary: FinanceSummary | null | undefined,
  key: MetricConfig['key']
): number | null {
  if (!summary) return null

  switch (key) {
    case 'revenue':
      return summary.sale_gross_total ?? summary.sale_gross ?? summary.wb_sales_gross_total ?? null
    case 'profit': {
      // BD-5: when COGS is unassigned (cogs_total === 0), profit is degenerate
      // (operating_profit_analytical collapses to revenue_net). Return null → «—»
      // rather than mislead the seller that revenue == profit.
      if ((summary.cogs_total ?? 0) === 0) return null
      return summary.operating_profit_analytical ?? summary.gross_profit ?? null
    }
    case 'margin_pct': {
      // BD-5: with cogs_total === 0, margin is degenerate (100% — (rev−0)/rev).
      // Return null → «—» (don't show a fabricated 100 % margin).
      if ((summary.cogs_total ?? 0) === 0) return null
      return summary.operating_margin_pct ?? summary.margin_pct ?? null
    }
    case 'orders':
      return summary.product_transactions_total ?? summary.product_transactions ?? null
    case 'logistics':
      return summary.logistics_cost_total ?? summary.logistics_cost ?? null
    case 'storage': {
      const storage = summary.storage_cost_total ?? summary.storage_cost ?? null
      const acceptance = summary.paid_acceptance_cost_total ?? summary.paid_acceptance_cost ?? null
      return storage != null || acceptance != null ? (storage ?? 0) + (acceptance ?? 0) : null
    }
  }
}
