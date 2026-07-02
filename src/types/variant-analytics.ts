/**
 * FR-7 (#221): per-variant (color/size) weekly analytics row.
 * Backend: GET /v1/analytics/weekly/by-variant?week=YYYY-Www (single-week only).
 *
 * Field semantics (verified live W26):
 *  - Exact per-variant (orders_fbs): revenue_net, total_units.
 *  - ALLOCATED — approximate, "распределено по доле выручки варианта":
 *    profit_allocated_rub, margin_allocated_pct. Render with the allocated marker,
 *    never as exact (Defensive Frontend Principle).
 *  - Parent-nm context (identical across a card's variants; for display/Σ reference):
 *    revenue_gross, cogs, total_expenses, profit, margin_pct, operating_profit,
 *    operating_margin_pct.
 *
 * NOTE on tech_size: the live backend returns this as a STRING ("0", "65-135"),
 * not a number, so the FE canonical type is `string | null`. Coerced in the
 * normalizer (`mapVariantItem`) — preserved verbatim, never parsed to a number.
 */
export interface VariantAnalyticsItem {
  // identity
  chrt_id: number
  nm_id: number
  color_name: string | null
  /** WB returns size as a string ("0", "65-135", "42"); preserved verbatim. */
  tech_size: string | null
  metadata_pending: boolean
  has_revenue: boolean
  // exact (orders_fbs)
  revenue_net: number
  total_units: number
  // ALLOCATED — approximate, "распределено по доле выручки варианта".
  profit_allocated_rub: number | null
  margin_allocated_pct: number | null
  // parent-nm context (identical across a card's variants; display/Σ reference)
  revenue_gross: number | null
  cogs: number | null
  total_expenses: number | null
  profit: number | null
  margin_pct: number | null
  operating_profit: number | null
  operating_margin_pct: number | null
}
