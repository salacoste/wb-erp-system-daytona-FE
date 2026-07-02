/**
 * FR-7 (#221): test fixtures for by-variant weekly analytics.
 * Minimal valid response + populated VariantAnalyticsItem samples.
 *
 * Values sourced from the live backend sample (W26, chrt 326996478).
 */

import type { VariantAnalyticsItem } from '@/types/variant-analytics'
import type { VariantAnalyticsResponse } from '@/hooks/useMarginAnalyticsByVariant'

/** Minimal valid response with no variant rows. */
export const variantEmptyResponse: VariantAnalyticsResponse = {
  data: [],
  meta: { count: 0, has_more: false, next_cursor: null },
}

/** Populated VariantAnalyticsItem (Синий · 42) — realistic W26 values. */
export const variantSampleItem: VariantAnalyticsItem = {
  chrt_id: 326996478,
  nm_id: 202867769,
  color_name: 'Синий',
  tech_size: '42',
  metadata_pending: false,
  has_revenue: true,
  revenue_net: 12829,
  total_units: 25,
  profit_allocated_rub: -82.78,
  margin_allocated_pct: -0.65,
  revenue_gross: 512,
  cogs: 211,
  total_expenses: 486,
  profit: 403.22,
  margin_pct: 65.65,
  operating_profit: -82.78,
  operating_margin_pct: -13.48,
}

/** Variant with null color + null allocated fields (covers ~10% null-color + null-money edges). */
export const variantNullColorItem: VariantAnalyticsItem = {
  chrt_id: 327000436,
  nm_id: 202870875,
  color_name: null,
  tech_size: '0',
  metadata_pending: false,
  has_revenue: false,
  revenue_net: 11701,
  total_units: 21,
  profit_allocated_rub: null,
  margin_allocated_pct: null,
  revenue_gross: 0,
  cogs: 0,
  total_expenses: 180,
  profit: 0,
  margin_pct: 0,
  operating_profit: -180,
  operating_margin_pct: 0,
}
