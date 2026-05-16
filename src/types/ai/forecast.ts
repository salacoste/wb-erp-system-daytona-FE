/**
 * AI Forecast types — frontend-canonical shapes
 * Endpoint: GET /v1/ai/forecast
 * Extended from Epic 103-FE with new optional fields from backend guide 2026-05-16.
 */

export type ForecastLevel = 'sku' | 'brand' | 'cabinet'

export interface AiForecastParams {
  modelType?: ModelType
  nmId?: number
  level?: ForecastLevel
  horizonDays?: number
  format?: 'json' | 'csv'
}

export const FORECAST_LEVELS: readonly ForecastLevel[] = ['sku', 'brand', 'cabinet'] as const

export function isForecastLevel(value: string): value is ForecastLevel {
  return (FORECAST_LEVELS as readonly string[]).includes(value)
}

/** Individual prediction row — frontend-canonical shape */
export interface AiForecastPrediction {
  /** Frontend alias for backend forecastDate */
  date: string
  horizonDays: number
  /** Frontend alias for backend predictedUnits */
  predictedSales: number
  /** Revenue prediction — null when backend doesn't provide (non-revenue models) */
  predictedRevenue: number | null
  /** Confidence score 0-100 — null when backend omits */
  confidence: number | null
  nmId?: number
  vendorCode?: string
  /** Simple average baseline for comparison — null when backend omits */
  naiveBaseline: number | null
  /** Human-readable delta string e.g. "+12.3%" — null when backend omits */
  aiVsNaive: string | null
  /** Forecast UUID used for feedback submission — undefined for cached results */
  forecastId?: string
}

export interface RollbackNotice {
  previousVersion: number
  rollbackDate: string
  reason: string
}

export interface AiForecastResponse {
  predictions: AiForecastPrediction[]
  modelVersion: number
  engine: 'prophet' | 'mindsdb'
  cached: boolean
  generatedAt: string
  /** Human-readable forecast summary — null when not provided */
  explanation: string | null
  /** Present only when model was rolled back — null otherwise */
  rollbackNotice: RollbackNotice | null
}

/** Confidence band classification based on 0-100 scale */
export type ConfidenceBand = 'high' | 'medium' | 'low'

export function getConfidenceBand(confidence: number): ConfidenceBand {
  if (confidence >= 0.7) return 'high'
  if (confidence >= 0.4) return 'medium'
  return 'low'
}

/**
 * Available ML model types — 7 variants per backend guide.
 * Source: docs/AI-FRONTEND-INTEGRATION-GUIDE.md § Forecast Endpoint
 */
export type ModelType =
  | 'sales_forecast'
  | 'daily_revenue_forecast'
  | 'search_conversion_forecast'
  | 'weekly_margin_forecast'
  | 'funnel_stage_prediction'
  | 'demand_forecast'
  | 'stockout_risk'

export const MODEL_TYPES: readonly ModelType[] = [
  'sales_forecast',
  'daily_revenue_forecast',
  'search_conversion_forecast',
  'weekly_margin_forecast',
  'funnel_stage_prediction',
  'demand_forecast',
  'stockout_risk',
] as const

export function isModelType(value: string): value is ModelType {
  return (MODEL_TYPES as readonly string[]).includes(value)
}
