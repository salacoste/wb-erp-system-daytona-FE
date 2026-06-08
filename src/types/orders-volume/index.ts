/**
 * Orders Volume Types for Dashboard Integration
 * Story 61.3-FE: Orders Volume API Integration
 * Epic 61-FE: Dashboard Data Integration
 *
 * Barrel re-export — split into domain files for file size compliance.
 * All existing imports from '@/types/orders-volume' continue to work unchanged.
 */

// Core: params, response, metrics
export type {
  OrdersVolumeParams,
  OrderStatusBreakdown,
  DailyOrderVolume,
  HourlyOrderVolume,
  OrdersVolumeResponse,
  OrdersVolumeMetrics,
} from './core'

// Status breakdown & seasonal patterns
export type {
  OrderStatusType,
  StatusBreakdownItem,
  StatusBreakdownData,
  MonthlyPattern,
  WeekdayPattern,
  SeasonalInsights,
  SeasonalPatternsResponse,
  SeasonalPatternsParams,
} from './seasonal'
