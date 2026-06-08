/**
 * Supply Planning Analytics Types
 * Epic 6 - Supply Planning & Stockout Prevention
 * Backend: Epic 28 - Supply Planning Analytics API
 * Reference: docs/epics/epic-28-supply-planning-analytics.md
 *
 * Barrel re-export — split into domain files for file size compliance.
 * All existing imports from '@/types/supply-planning' continue to work unchanged.
 */

// Enums & query params
export type {
  StockoutRisk,
  ReorderStatus,
  VelocityTrend,
  SupplyPlanningViewBy,
  SupplyPlanningShowOnly,
  SupplyPlanningQueryParams,
} from './core'

// Response interfaces
export type {
  WarehouseStock,
  SupplyPlanningItem,
  SupplyPlanningSummary,
  SupplyPlanningMeta,
  SupplyPlanningResponse,
} from './responses'

// Re-exports from supply-planning-config.ts (backward compatibility)
export type {
  RiskStatusConfig,
  ReorderStatusConfig,
  RiskDistributionData,
} from '../supply-planning-config'
