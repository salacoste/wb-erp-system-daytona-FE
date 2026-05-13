/**
 * Expenses - Expense Mapping & Transformation Helpers
 * Extracted from useExpenses.ts for file size compliance (Epic 74)
 */

import type { FinanceSummary } from './useDashboard'

export interface ExpenseItem {
  category: string
  amount: number
  percentage?: number
}

export interface ExpenseBreakdown {
  expenses: ExpenseItem[]
  total: number
  revenueShare?: number
  previousTotal?: number
}

/**
 * Extract expense categories from FinanceSummary
 * Supports both _total suffix (from summary_total) and legacy format
 *
 * 2025-12-13: Fixed expense display to match PnLWaterfall/Dashboard structure
 * Request #56: WB Services Breakdown
 * See: docs/WB-DASHBOARD-METRICS.md, PnLWaterfall.tsx
 */
export function buildExpenseItems(summary: FinanceSummary): ExpenseItem[] {
  const wbServicesTotal = summary.wb_services_cost_total ?? summary.wb_services_cost ?? 0
  const otherAdjustmentsTotal =
    summary.other_adjustments_net_total ?? summary.other_adjustments_net ?? 0
  const otherAdjustmentsRemaining = Math.max(0, otherAdjustmentsTotal - wbServicesTotal)

  return [
    {
      category: 'Комиссия WB',
      amount: summary.total_commission_rub_total ?? summary.total_commission_rub ?? 0,
    },
    {
      category: 'Логистика',
      amount: summary.logistics_cost_total ?? summary.logistics_cost ?? 0,
    },
    {
      category: 'Хранение',
      amount: summary.storage_cost_total ?? summary.storage_cost ?? 0,
    },
    {
      category: 'Платная приёмка',
      amount: summary.paid_acceptance_cost_total ?? summary.paid_acceptance_cost ?? 0,
    },
    {
      category: 'Штрафы',
      amount: summary.penalties_total ?? 0,
    },
    {
      category: 'Корректировка ВВ',
      amount: summary.wb_commission_adj_total ?? summary.wb_commission_adj ?? 0,
    },
    {
      category: 'WB.Продвижение',
      amount: summary.wb_promotion_cost_total ?? summary.wb_promotion_cost ?? 0,
    },
    {
      category: 'Джем',
      amount: summary.wb_jam_cost_total ?? summary.wb_jam_cost ?? 0,
    },
    {
      category: 'Прочие сервисы WB',
      amount: summary.wb_other_services_cost_total ?? summary.wb_other_services_cost ?? 0,
    },
    {
      category: 'Прочие корректировки',
      amount: otherAdjustmentsRemaining,
    },
    {
      category: 'Комиссия лояльности',
      amount: summary.loyalty_fee_total ?? summary.loyalty_fee ?? 0,
    },
    {
      category: 'Удержание баллов',
      amount: summary.loyalty_points_withheld_total ?? summary.loyalty_points_withheld ?? 0,
    },
    {
      category: 'Эквайринг',
      amount: summary.acquiring_fee_total ?? summary.acquiring_fee ?? 0,
    },
  ]
    .filter(expense => expense.amount > 0)
    .sort((a, b) => b.amount - a.amount)
}

/**
 * Add percentage to expense items based on total
 */
export function addPercentages(expenses: ExpenseItem[]): ExpenseItem[] {
  const total = expenses.reduce((sum, item) => sum + item.amount, 0)
  return expenses.map(item => ({
    ...item,
    percentage: total > 0 ? (item.amount / total) * 100 : 0,
  }))
}

/**
 * Build complete expense breakdown from summary
 */
export function buildExpenseBreakdown(
  summary: FinanceSummary,
  previousSummary?: FinanceSummary | null
): ExpenseBreakdown {
  const expenses = buildExpenseItems(summary)
  const total = expenses.reduce((sum, item) => sum + item.amount, 0)
  const expensesWithPercentage = addPercentages(expenses)

  const saleGross = summary.sale_gross_total ?? summary.sale_gross ?? 0
  const revenueShare = saleGross > 0 ? (total / saleGross) * 100 : undefined

  const previousTotal = previousSummary
    ? buildExpenseItems(previousSummary).reduce((sum, item) => sum + item.amount, 0)
    : undefined

  return { expenses: expensesWithPercentage, total, revenueShare, previousTotal }
}
