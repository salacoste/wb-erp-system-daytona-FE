/**
 * Barrel re-export for margin analytics hooks
 * Epic 74: Split into individual files for file size compliance (<=200 lines)
 *
 * Original: useMarginAnalytics.ts (698 lines)
 * Split into:
 *   - margin-analytics-query-keys.ts (types, helpers, query config)
 *   - useMarginAnalyticsBySku.ts (SKU hook)
 *   - useMarginAnalyticsByBrand.ts (Brand hook)
 *   - useMarginAnalyticsByCategory.ts (Category hook)
 *   - useCabinetLevelExpenses.ts (Cabinet expenses hook)
 */

// Types, interfaces, helpers
export type {
  MarginAnalyticsFilters,
  SortField,
  SortOrder,
  CabinetLevelExpenses,
} from './margin-analytics-query-keys'
export { getCurrentIsoWeek, formatWeekDisplay } from './margin-analytics-query-keys'

// Hooks
export { useMarginAnalyticsBySku } from './useMarginAnalyticsBySku'
export { useMarginAnalyticsByBrand } from './useMarginAnalyticsByBrand'
export { useMarginAnalyticsByCategory } from './useMarginAnalyticsByCategory'
export { useCabinetLevelExpenses } from './useCabinetLevelExpenses'
// FR-7 (#221): by-variant (color/size) — single-week only.
export { useMarginAnalyticsByVariant } from './useMarginAnalyticsByVariant'
export type {
  VariantAnalyticsFilters,
  VariantAnalyticsResponse,
} from './useMarginAnalyticsByVariant'
export type { VariantAnalyticsItem } from '@/types/variant-analytics'
