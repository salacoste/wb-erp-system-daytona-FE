/**
 * Liquidity table sort helpers — Epic 7.
 *
 * The backend `GET /v1/analytics/liquidity` accepts only `LiquiditySortByEnum`
 * (frozen_capital | turnover_days | current_stock | product_name) under `@IsEnum`
 * validation. The table UI offers three sortable columns — turnover_days, stock_value,
 * velocity_per_day — and the last two are NOT in that enum, so sending them as `sort_by`
 * 400s and blanks the whole page (verified vs backend liquidity-query.dto.ts).
 *
 * Fix: map the UI column to a valid enum for the request (so the backend chooses a sensible
 * ≤200-item page) and sort the returned rows CLIENT-SIDE by the exact column the user picked.
 * stock_value == frozen_capital (COGS-based inventory value); velocity has no backend sort, so
 * we request a turnover-ordered page and order velocity in the browser.
 */

import type { LiquidityItem, LiquidityQueryParams } from '@/types/liquidity'

/** Columns the liquidity table lets the user sort by (distinct from the backend enum). */
export type LiquidityUiSortField = 'turnover_days' | 'stock_value' | 'velocity_per_day'

type LiquidityApiSortField = NonNullable<LiquidityQueryParams['sort_by']>

/**
 * Map a UI sort column to a backend-accepted `sort_by`, never emitting a value the
 * `@IsEnum` validator rejects.
 * - `stock_value` → `frozen_capital` (same metric: COGS-based value of stock on hand; note it is
 *   0 when COGS is unknown, so a stock_value sort clusters no-COGS items together)
 * - `velocity_per_day` → `turnover_days` (no backend velocity sort; pick a sensible page, then
 *   sort velocity client-side via {@link sortLiquidityItems})
 * - `turnover_days` → `turnover_days`
 */
export function mapLiquiditySortToApi(field: LiquidityUiSortField): LiquidityApiSortField {
  switch (field) {
    case 'stock_value':
      return 'frozen_capital'
    case 'velocity_per_day':
      return 'turnover_days'
    case 'turnover_days':
    default:
      return 'turnover_days'
  }
}

/**
 * Client-side sort of the returned liquidity page by a UI column. Operates on the ≤200 items the
 * backend returned (the page is not paginated) and is the only way velocity_per_day can be ordered.
 * Returns a new array; NaN/missing keys sort as 0 so they don't scatter unpredictably.
 */
export function sortLiquidityItems(
  items: LiquidityItem[],
  field: LiquidityUiSortField,
  order: 'asc' | 'desc'
): LiquidityItem[] {
  const dir = order === 'asc' ? 1 : -1
  const key = (item: LiquidityItem): number => {
    const v = item[field]
    return typeof v === 'number' && Number.isFinite(v) ? v : 0
  }
  return [...items].sort((a, b) => (key(a) - key(b)) * dir)
}
