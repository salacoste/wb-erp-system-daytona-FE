/**
 * Financial Summary Aggregation
 * Story 3.5: Financial Summary View
 *
 * Helper functions for aggregating financial summaries.
 */

import type { FinanceSummary } from '../useDashboard'

/**
 * Aggregate multiple FinanceSummary objects into one
 * Sums all numeric fields
 */
export function aggregateFinanceSummaries(summaries: FinanceSummary[]): FinanceSummary | null {
  if (summaries.length === 0) return null

  // For single item, ALWAYS calculate margin_pct using Gross Margin formula
  // Story 61.13-FE: Override any margin_pct from API (which may use Net Margin)
  if (summaries.length === 1) {
    const summary = summaries[0]

    // Calculate margin_pct if conditions are met
    // ALWAYS recalculate - don't trust API's margin_pct (may use wrong formula)
    if (
      summary.cogs_coverage_pct === 100 &&
      summary.sale_gross_total &&
      summary.sale_gross_total > 0 &&
      summary.cogs_total != null
    ) {
      return {
        ...summary,
        gross_profit: summary.sale_gross_total - summary.cogs_total,
        margin_pct:
          ((summary.sale_gross_total - summary.cogs_total) / summary.sale_gross_total) * 100,
      }
    }

    // Return without margin_pct if conditions not met (incomplete COGS or zero revenue)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { margin_pct: _unused, ...summaryWithoutMargin } = summary
    return summaryWithoutMargin as FinanceSummary
  }

  // Define numeric fields to aggregate
  const numericFields: (keyof FinanceSummary)[] = [
    'sales_gross_total',
    'sales_gross',
    'returns_gross_total',
    'returns_gross',
    'sale_gross_total',
    'sale_gross',
    'to_pay_goods_total',
    'to_pay_goods',
    'total_commission_rub_total',
    'total_commission_rub',
    'payout_total',
    'logistics_cost_total',
    'logistics_cost',
    'storage_cost_total',
    'storage_cost',
    'paid_acceptance_cost_total',
    'paid_acceptance_cost',
    'penalties_total',
    'wb_commission_adj_total',
    'wb_commission_adj',
    'loyalty_fee_total',
    'loyalty_fee',
    'loyalty_points_withheld_total',
    'loyalty_points_withheld',
    'loyalty_compensation_total',
    'loyalty_compensation',
    'acquiring_fee_total',
    'acquiring_fee',
    'commission_sales_total',
    'commission_sales',
    'other_adjustments_net_total',
    'other_adjustments_net',
    'seller_delivery_revenue_total',
    'seller_delivery_revenue',
    'wb_services_cost_total',
    'wb_services_cost',
    'wb_promotion_cost_total',
    'wb_promotion_cost',
    'wb_jam_cost_total',
    'wb_jam_cost',
    'wb_other_services_cost_total',
    'wb_other_services_cost',
    'wb_sales_gross_total',
    'wb_sales_gross',
    'wb_returns_gross_total',
    'wb_returns_gross',
    'retail_price_total',
    'retail_price_total_total',
    'cogs_total',
  ]

  const result: Partial<FinanceSummary> = {
    week: summaries.map(s => s.week).join(', '),
  }

  // Sum all numeric fields
  for (const field of numericFields) {
    const sum = summaries.reduce((acc, summary) => {
      const value = summary[field]
      if (typeof value === 'number') {
        return acc + value
      }
      return acc
    }, 0)

    // Only set if at least one summary had this field
    if (summaries.some(s => typeof s[field] === 'number')) {
      ;(result as Record<string, number>)[field] = sum
    }
  }

  // For COGS coverage, use MAX across weeks (same products appear each week)
  const maxProductsTotal = Math.max(...summaries.map(s => s.products_total || 0))
  const maxProductsWithCogs = Math.max(...summaries.map(s => s.products_with_cogs || 0))

  if (maxProductsTotal > 0) {
    result.products_total = maxProductsTotal
    result.products_with_cogs = Math.min(maxProductsWithCogs, maxProductsTotal)
    result.cogs_coverage_pct = (result.products_with_cogs / maxProductsTotal) * 100
  }

  // Calculate gross_profit and margin_pct only if aggregated coverage is 100%
  /**
   * Story 61.2: Gross Profit Calculation Fix
   * gross_profit = revenue - COGS
   *
   * Where revenue = sale_gross_total (net sales after returns)
   * NOT payout_total (which already has logistics/storage/commissions deducted)
   *
   * Story 61.13-FE: Margin Calculation Consistency
   * margin_pct = (sale_gross_total - cogs_total) / sale_gross_total * 100
   *
   * This is Gross Margin formula, used consistently for both week and month periods.
   */
  if (result.cogs_coverage_pct === 100 && result.sale_gross_total && result.cogs_total != null) {
    result.gross_profit = result.sale_gross_total - result.cogs_total

    // Calculate margin_pct using Gross Margin formula
    // Only calculate if sale_gross_total > 0 to avoid division by zero
    if (result.sale_gross_total > 0) {
      result.margin_pct =
        ((result.sale_gross_total - result.cogs_total) / result.sale_gross_total) * 100
    }
  }

  return result as FinanceSummary
}
