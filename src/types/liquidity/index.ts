/**
 * Liquidity Analysis Types
 * Epic 7 - Liquidity Analysis (Ликвидность товаров)
 * Backend: Request #55 - Liquidity API Endpoint
 * Reference: docs/stories/7.1.liquidity-api-integration.md
 *
 * Barrel re-export — split into domain files for file size compliance.
 * All existing imports from '@/types/liquidity' continue to work unchanged.
 */

// Core: enums, query params, item, liquidation scenario
export type {
  LiquidityCategory,
  ActionType,
  BenchmarkStatus,
  TrendInsightType,
  LiquidityQueryParams,
  LiquidityTrendsQueryParams,
  LiquidationScenario,
  LiquidityItem,
} from './core'

// Distribution, benchmarks, trends, UI helpers
export type {
  LiquidityDistributionItem,
  LiquidityDistribution,
  LiquidityBenchmarks,
  TrendDistribution,
  TrendDataPoint,
  TrendInsight,
  LiquidityTrendsMeta,
  LiquidityTrendsResponse,
  LiquidityCategoryConfig,
  ActionTypeConfig,
  BenchmarkStatusConfig,
  DistributionChartData,
  TrendChartData,
} from './distribution'

// Summary & meta
export type { LiquiditySummary, LiquidityMeta, LiquidityResponse } from './summary'
