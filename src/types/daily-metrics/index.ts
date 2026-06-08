/**
 * Daily Metrics Types
 *
 * TypeScript types for daily breakdown analytics (Story 61.9-FE).
 *
 * Barrel re-export — split into domain files for file size compliance.
 * All existing imports from '@/types/daily-metrics' continue to work unchanged.
 */

// Core: DailyMetrics interface + aggregation input
export type { DailyMetrics, AggregateDailyMetricsInput } from './core'

// API response types & hook params
export type {
  OrdersDailyData,
  FinanceDailyData,
  AdvertisingDailyData,
  OrdersCogsDailyData,
  UseDailyMetricsParams,
  UseDailyMetricsOptions,
} from './api-types'
