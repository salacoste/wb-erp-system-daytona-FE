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
  /** Confidence score 0-1 (frontend-canonical form; backend sends 0-100, normalized at boundary). null when backend omits */
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

/** Confidence band classification based on 0-1 canonical scale */
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

/**
 * Russian labels for each model type.
 * Extracted here (from ModelTypeSelector.tsx) in Story 109.3-FE so both
 * Forecast (109.1) and Models (109.3) features share a single source of truth.
 * Exported for direct unit testing (pure-function discipline, Epic 89-FE lesson).
 */
export const MODEL_TYPE_LABELS: Record<ModelType, string> = {
  sales_forecast: 'Прогноз продаж',
  daily_revenue_forecast: 'Прогноз выручки (день)',
  search_conversion_forecast: 'Конверсия в поиске',
  weekly_margin_forecast: 'Маржинальность (неделя)',
  funnel_stage_prediction: 'Конверсия воронки',
  demand_forecast: 'Прогноз спроса',
  stockout_risk: 'Риск out-of-stock',
}

/**
 * Management/admin model types the backend serves on /v1/ai/models that are NOT forecast-selectable,
 * so they are intentionally ABSENT from ModelType/MODEL_TYPES (which feed the forecast
 * ModelTypeSelector). Labels follow the same "_daily → (день)" convention as MODEL_TYPE_LABELS.
 * iter-64: live cabinet served 7/15 model rows of these types (return_prediction, anomaly_detection,
 * *_daily) — indexing MODEL_TYPE_LABELS directly rendered `undefined` in the "Тип" column.
 */
export const MANAGEMENT_MODEL_TYPE_LABELS: Record<string, string> = {
  return_prediction: 'Прогноз возвратов',
  return_prediction_daily: 'Прогноз возвратов (день)',
  anomaly_detection: 'Детекция аномалий',
  anomaly_detection_daily: 'Детекция аномалий (день)',
  sales_forecast_daily: 'Прогноз продаж (день)',
}

/**
 * CANONICAL Russian display label for ANY backend model type (forecast-selectable OR management).
 * The /analytics/models + /ai-admin/models tables receive management types the forecast ModelType
 * union doesn't cover; the prior `MODEL_TYPE_LABELS[modelType]` indexing rendered `undefined`.
 * Falls back to the RAW backend value for a genuinely unknown future type — honest, never
 * `undefined` (matches the established Story 112.1-FE admin contract; ai-admin re-exports this).
 * Exported for direct unit testing (pure-function discipline).
 */
export function getModelTypeLabel(modelType: string): string {
  return (
    MODEL_TYPE_LABELS[modelType as ModelType] ??
    MANAGEMENT_MODEL_TYPE_LABELS[modelType] ??
    modelType
  )
}
