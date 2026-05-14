/**
 * AI Forecast API — boundary normalizer + API client
 * Endpoint: GET /v1/ai/forecast
 */

import { apiClient } from '../api-client'
import type { AiForecastParams, AiForecastResponse } from '@/types/ai-forecast'

/** Raw backend shape — forecastDate/predictedUnits mapped to frontend date/predictedSales */
interface RawForecastPrediction {
  forecastDate: string
  predictedUnits: number
  confidence: number
}

interface RawAiForecastResponse {
  predictions: RawForecastPrediction[]
  modelVersion: number
  engine: string
  cached: boolean
  generatedAt: string
  explanation?: string | null
  rollbackNotice?: string | null
}

export function normalizeAiForecastResponse(raw: RawAiForecastResponse): AiForecastResponse {
  return {
    predictions: raw.predictions.map(p => ({
      date: p.forecastDate,
      predictedSales: p.predictedUnits,
      confidence: p.confidence,
    })),
    modelVersion: raw.modelVersion,
    engine: raw.engine,
    cached: raw.cached,
    generatedAt: raw.generatedAt,
    explanation: raw.explanation ?? null,
    rollbackNotice: raw.rollbackNotice ?? null,
  }
}

export async function getAiForecast(params: AiForecastParams): Promise<AiForecastResponse> {
  const queryParams = new URLSearchParams()
  if (params.nmId != null) queryParams.set('nmId', String(params.nmId))
  if (params.level) queryParams.set('level', params.level)
  if (params.horizonDays != null) queryParams.set('horizonDays', String(params.horizonDays))

  const raw = await apiClient.get<RawAiForecastResponse>(
    `/v1/ai/forecast?${queryParams.toString()}`
  )
  return normalizeAiForecastResponse(raw)
}
