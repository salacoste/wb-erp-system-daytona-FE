/**
 * Unit Economics Analytics Types — barrel re-export.
 *
 * All existing imports from '@/types/unit-economics' continue to work unchanged.
 * Split into domain files for 200-line ESLint cap compliance.
 */

// Core: enums, query params, cost breakdowns
export type {
  ProfitabilityStatus,
  UnitEconomicsViewBy,
  UnitEconomicsSortBy,
  UnitEconomicsQueryParams,
  CostsPct,
  CostsRub,
} from './core'

// Responses: item, summary
export type { UnitEconomicsItem, UnitEconomicsSummary } from './responses'

// Re-exports from unit-economics-cost-categories.ts (backward compatibility)
export type {
  ProfitabilityStatusConfig,
  CostCategoryConfig,
  WaterfallDataPoint,
  UnitEconomicsMeta,
  UnitEconomicsResponse,
} from './unit-economics-cost-categories'
