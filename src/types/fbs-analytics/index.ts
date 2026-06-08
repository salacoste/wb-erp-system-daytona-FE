/**
 * FBS Historical Analytics Types
 * Story 51.1-FE: FBS Analytics Types & API Module
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 * Reference: test-api/15-analytics-fbs.http
 *
 * Barrel re-export — split into domain files for file size compliance.
 * All existing imports from '@/types/fbs-analytics' continue to work unchanged.
 */

// Core types: aggregation enums, trends, seasonal, compare
export type {
  AggregationType,
  SeasonalViewType,
  TrendMetric,
  TrendDataPoint,
  TrendsSummary,
  DataSourceInfo,
  TrendsPeriodInfo,
  TrendsResponse,
  MonthlyPattern,
  WeekdayPattern,
  QuarterlyPattern,
  SeasonalPatterns,
  SeasonalInsights,
  SeasonalResponse,
  PeriodMetrics,
  ComparisonMetrics,
  CompareResponse,
} from './core'

// Query params, backfill, and error types
export type {
  FbsTrendsParams,
  FbsSeasonalParams,
  FbsCompareParams,
  BackfillStatus,
  BackfillDataSource,
  StartBackfillRequest,
  StartBackfillResponse,
  BackfillCabinetStatus,
  BackfillStatusResponse,
  BackfillActionRequest,
  BackfillActionResponse,
  FbsAnalyticsErrorCode,
  FbsAnalyticsError,
} from './params'
