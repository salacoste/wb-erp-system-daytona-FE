/**
 * AI Sales Forecast — frontend-canonical types
 * Endpoint: GET /v1/ai/forecast
 */

export type ForecastLevel = 'sku' | 'brand' | 'cabinet'

export interface AiForecastParams {
  nmId?: number
  level?: ForecastLevel
  horizonDays?: number
}

export const FORECAST_LEVELS: readonly ForecastLevel[] = ['sku', 'brand', 'cabinet'] as const

export function isForecastLevel(value: string): value is ForecastLevel {
  return (FORECAST_LEVELS as readonly string[]).includes(value)
}

export interface AiForecastPrediction {
  date: string
  predictedSales: number
  confidence: number
}

export interface AiForecastResponse {
  predictions: AiForecastPrediction[]
  modelVersion: number
  engine: string
  cached: boolean
  generatedAt: string
  explanation: string | null
  rollbackNotice: string | null
}

/** Confidence band classification */
export type ConfidenceBand = 'high' | 'medium' | 'low'

export function getConfidenceBand(confidence: number): ConfidenceBand {
  if (confidence >= 0.7) return 'high'
  if (confidence >= 0.4) return 'medium'
  return 'low'
}
