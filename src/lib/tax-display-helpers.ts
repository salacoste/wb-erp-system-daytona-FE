/**
 * Tax Display Helpers
 * Story 66.6-FE: Net Profit After Tax Display
 * Epic 66-FE: Tax & Accounting Frontend
 *
 * Cascading fallback logic for net profit display:
 *   net_profit_after_all_tax (VAT+income) -> net_profit_after_tax (income only) -> payoutTotal
 *
 * Margin uses revenue_excl_vat for VAT payers, sale_gross_total otherwise.
 *
 * @see docs/stories/epic-66/story-66.6-fe-net-profit-card.md
 */

import type { TaxMetrics } from '@/types/finance-summary'

export interface NetProfitResult {
  /** The resolved net profit value */
  value: number
  /** Display label: "Чистая прибыль" or "К перечислению" */
  label: string
  /** True when tax data is absent — value is pre-tax payout */
  isPreTax: boolean
}

/**
 * Resolve the best net-profit figure from available tax metrics.
 *
 * Priority:
 * 1. VAT payer with net_profit_after_all_tax -> full after-tax profit
 * 2. Income-tax only with net_profit_after_tax -> income-tax-adjusted profit
 * 3. Fallback to payoutTotal (pre-tax)
 */
export function getNetProfit(tax: TaxMetrics | null, payoutTotal: number): NetProfitResult {
  if (!tax) {
    return { value: payoutTotal, label: 'К перечислению', isPreTax: true }
  }

  if (tax.vat_payer && tax.net_profit_after_all_tax != null) {
    return { value: tax.net_profit_after_all_tax, label: 'Чистая прибыль', isPreTax: false }
  }

  if (tax.net_profit_after_tax != null) {
    return { value: tax.net_profit_after_tax, label: 'Чистая прибыль', isPreTax: false }
  }

  return { value: payoutTotal, label: 'К перечислению', isPreTax: true }
}

/**
 * Calculate after-tax margin percentage.
 *
 * Revenue base:
 * - VAT payer -> revenue_excl_vat (excludes НДС)
 * - Non-VAT   -> saleGrossTotal (net sales)
 *
 * Returns null when revenue is unavailable or zero.
 */
export function calculateAfterTaxMargin(
  netProfit: number,
  tax: TaxMetrics | null,
  saleGrossTotal: number | null
): number | null {
  const revenue = tax?.vat_payer ? tax.revenue_excl_vat : saleGrossTotal
  if (!revenue || revenue === 0) return null
  return (netProfit / revenue) * 100
}
