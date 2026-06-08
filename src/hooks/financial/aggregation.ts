/**
 * Financial Summary Aggregation
 * Story 3.5: Financial Summary View
 *
 * Helper functions for aggregating financial summaries.
 */

import type { FinanceSummary, TaxMetrics } from '@/types/finance-summary'
import { AGGREGATE_NUMERIC_FIELDS } from './aggregation-fields'

/** Sum a nullable numeric field across items, treating null as 0 */
function sumNullable(items: TaxMetrics[], key: keyof TaxMetrics): number {
  return items.reduce((acc, t) => acc + ((t[key] as number | null) ?? 0), 0)
}

/** Aggregate multiple TaxMetrics into one. Returns null if no valid entries. */
export function aggregateTaxMetrics(taxMetrics: TaxMetrics[]): TaxMetrics | null {
  const valid = taxMetrics.filter((t): t is TaxMetrics => t != null)
  if (valid.length === 0) return null
  if (valid.length === 1) return valid[0]

  const first = valid[0]
  return {
    tax_amount: sumNullable(valid, 'tax_amount'),
    tax_base: sumNullable(valid, 'tax_base'),
    net_profit_after_tax: sumNullable(valid, 'net_profit_after_tax'),
    vat_output: sumNullable(valid, 'vat_output'),
    vat_payable: sumNullable(valid, 'vat_payable'),
    revenue_excl_vat: sumNullable(valid, 'revenue_excl_vat'),
    net_profit_after_all_tax: sumNullable(valid, 'net_profit_after_all_tax'),
    effective_tax_rate: first.effective_tax_rate,
    tax_system: first.tax_system,
    vat_payer: first.vat_payer,
    vat_rate: first.vat_rate,
    is_minimum_rule: valid.some(t => t.is_minimum_rule),
  }
}

/**
 * Aggregate multiple FinanceSummary objects into one
 * Sums all numeric fields
 */
export function aggregateFinanceSummaries(summaries: FinanceSummary[]): FinanceSummary | null {
  if (summaries.length === 0) return null

  // For single item, ALWAYS calculate margin_pct using Operating Margin formula
  // Validation fix: Use payout_total (actual seller earnings) instead of sale_gross_total (retail price)
  // sale_gross - COGS overstates profit by 3-5x because it ignores WB commissions/logistics/storage
  if (summaries.length === 1) {
    const summary = summaries[0]

    // Calculate using payout_total (actual seller earnings after all WB deductions)
    // ALWAYS recalculate - don't trust API's margin_pct
    if (
      summary.cogs_coverage_pct === 100 &&
      summary.payout_total != null &&
      summary.sale_gross_total &&
      summary.sale_gross_total > 0 &&
      summary.cogs_total != null
    ) {
      return {
        ...summary,
        gross_profit: summary.payout_total - summary.cogs_total,
        margin_pct: ((summary.payout_total - summary.cogs_total) / summary.sale_gross_total) * 100,
      }
    }

    // Return without margin_pct if conditions not met (incomplete COGS or zero revenue)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { margin_pct: _unused, ...summaryWithoutMargin } = summary
    return summaryWithoutMargin as FinanceSummary
  }

  // Numeric fields to aggregate (extracted constant)
  const numericFields = AGGREGATE_NUMERIC_FIELDS

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

  // Validation fix: Operating Margin = (payout_total - cogs_total) / sale_gross_total
  if (
    result.cogs_coverage_pct === 100 &&
    result.payout_total != null &&
    result.sale_gross_total &&
    result.cogs_total != null
  ) {
    result.gross_profit = result.payout_total - result.cogs_total

    // Calculate margin_pct using Operating Margin formula
    // Denominator is sale_gross_total (net sales) to show % of sales retained as profit
    if (result.sale_gross_total > 0) {
      result.margin_pct =
        ((result.payout_total - result.cogs_total) / result.sale_gross_total) * 100
    }
  }

  // Request #155: Recalculate weighted analytical margins from summed values
  const revenueNet = result.revenue_net as number | undefined
  const grossProfitA = result.gross_profit_analytical as number | undefined
  const operatingProfitA = result.operating_profit_analytical as number | undefined
  if (revenueNet && revenueNet > 0) {
    if (grossProfitA != null) {
      result.gross_margin_pct = (grossProfitA / revenueNet) * 100
    }
    if (operatingProfitA != null) {
      result.operating_margin_pct = (operatingProfitA / revenueNet) * 100
    }
  }

  // Epic 66-FE: Aggregate tax metrics across weeks
  const taxEntries = summaries.map(s => s.tax).filter((t): t is TaxMetrics => t != null)
  result.tax = taxEntries.length > 0 ? aggregateTaxMetrics(taxEntries) : null

  return result as FinanceSummary
}
