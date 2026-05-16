/**
 * AI Forecast API — boundary normalizer + fetcher
 * Endpoint: GET /v1/ai/forecast
 * Story 108.1-FE: Extended from Epic 103-FE with new optional prediction fields.
 */

import { apiClient } from '../../api-client'
import type {
  AiForecastParams,
  AiForecastResponse,
  AiForecastPrediction,
} from '@/types/ai/forecast'

interface RawForecastPrediction {
  forecastDate: string
  horizonDays?: number
  predictedUnits: number
  predictedRevenue?: number | null
  confidence?: number | null
  nmId?: number
  vendorCode?: string
  naiveBaseline?: number | null
  aiVsNaive?: string | null
  forecastId?: string
}

interface RawRollbackNotice {
  previousVersion: number
  rollbackDate: string
  reason: string
}

interface RawAiForecastResponse {
  predictions?: RawForecastPrediction[] | null
  modelVersion: number
  engine: string
  cached: boolean
  generatedAt: string
  explanation?: string | null
  rollbackNotice?: RawRollbackNotice | string | null
}

function normalizePrediction(p: RawForecastPrediction): AiForecastPrediction {
  return {
    date: p.forecastDate,
    horizonDays: p.horizonDays ?? 0,
    predictedSales: p.predictedUnits,
    predictedRevenue: p.predictedRevenue ?? null,
    confidence: p.confidence ?? null,
    nmId: p.nmId,
    vendorCode: p.vendorCode,
    naiveBaseline: p.naiveBaseline ?? null,
    aiVsNaive: p.aiVsNaive ?? null,
    forecastId: p.forecastId,
  }
}

export function normalizeAiForecastResponse(raw: RawAiForecastResponse): AiForecastResponse {
  // rollbackNotice may be a string (legacy) or structured object
  const rollback =
    raw.rollbackNotice == null
      ? null
      : typeof raw.rollbackNotice === 'string'
        ? null
        : {
            previousVersion: raw.rollbackNotice.previousVersion,
            rollbackDate: raw.rollbackNotice.rollbackDate,
            reason: raw.rollbackNotice.reason,
          }

  return {
    predictions: (raw.predictions ?? []).map(normalizePrediction),
    modelVersion: raw.modelVersion,
    engine: raw.engine as AiForecastResponse['engine'],
    cached: raw.cached,
    generatedAt: raw.generatedAt,
    explanation: raw.explanation ?? null,
    rollbackNotice: rollback,
  }
}

export async function getAiForecast(params: AiForecastParams): Promise<AiForecastResponse> {
  const queryParams = new URLSearchParams()
  if (params.modelType) queryParams.set('modelType', params.modelType)
  if (params.nmId != null) queryParams.set('nmId', String(params.nmId))
  if (params.level) queryParams.set('level', params.level)
  if (params.horizonDays != null) queryParams.set('horizonDays', String(params.horizonDays))
  if (params.format) queryParams.set('format', params.format)

  const raw = await apiClient.get<RawAiForecastResponse>(
    `/v1/ai/forecast?${queryParams.toString()}`
  )
  return normalizeAiForecastResponse(raw)
}
