/**
 * FinanceSummary numeric field list for multi-week aggregation.
 * Extracted from aggregation.ts for file size compliance.
 */

import type { FinanceSummary } from '@/types/finance-summary'

/**
 * Numeric fields to aggregate when merging multiple FinanceSummary objects.
 * Each field is summed across weeks; fields absent from all summaries are omitted.
 */
export const AGGREGATE_NUMERIC_FIELDS: (keyof FinanceSummary)[] = [
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
  // retail_price_total_combined = summary_total scope (default view); retail_price_total =
  // per-region scope. Both must be summed so SalesFunnelSection's "РРЦ" base survives multi-week
  // aggregation — omitting combined re-hides the funnel on aggregated summary_total views
  // (2026-06-04 fix; the trailing _total_total is a ghost field kept only as a dead no-op).
  'retail_price_total_combined',
  'retail_price_total',
  'retail_price_total_total',
  'cogs_total',
  // Request #155: Analytical profit/margin
  'revenue_net',
  'gross_profit_analytical',
  'operating_profit_analytical',
]
