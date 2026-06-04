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
  predictedUnits: number | null
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

/**
 * Validation F-17: the backend confidence scale is INCONSISTENT — the DTO
 * (prediction.dto.ts) documents 0-100 (example 82.5), but the live engines emit
 * 0-1 (prophet ~0.80, BASELINE_FALLBACK_CONFIDENCE = 0.3). A blanket `/100`
 * collapsed real 0-1 values to ~0.8% (all forecasts showed "low" band + giant
 * confidence bands). Detect by magnitude — >1 is a percentage (0-100), ≤1 is a
 * probability (0-1) — so BOTH scales normalize to canonical 0-1. Clamp to [0,1].
 * The whole FE pipeline (ForecastTable `confidence*100`, getConfidenceBand,
 * chart `1−confidence` band) expects 0-1.
 *
 * Known ambiguity: a 0-100 value of exactly 1.0 (1%) is indistinguishable from a
 * 0-1 value of 1.0 (100%) and is treated as 100% — acceptable because live engines
 * emit 0-1 and the `>1` branch is effectively dead for them.
 * PENDING BACKEND: Request #180 — once the backend guarantees a single scale
 * (and fixes the stale 0-100 DTO doc), drop this heuristic for a plain clamp.
 */
function scaleConfidence(raw: unknown): number | null {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null
  const v = raw > 1 ? raw / 100 : raw
  return Math.min(1, Math.max(0, v))
}

function normalizePrediction(p: RawForecastPrediction): AiForecastPrediction {
  return {
    date: p.forecastDate,
    horizonDays: p.horizonDays ?? 0,
    // Epic 113 I1: backend now sends predictedUnits:null for revenue-target models
    // (e.g. daily_revenue_forecast — MlForecast.predictedUnits became nullable, the
    // non-units-target dimension is NULL). Preserve null (AP#8: never coerce to 0,
    // which would fabricate a "0 units/day" forecast). Consumers null-guard the render.
    predictedSales: p.predictedUnits ?? null,
    // Validation F-45 (updated Epic 113 I1): revenue-target models now emit REAL
    // predictedRevenue (no longer an always-0 placeholder for every row). The 0→null
    // mapping below is kept because (a) units-target models still send predictedRevenue:0
    // as a placeholder, and (b) the backend can't distinguish a placeholder-0 from a
    // genuine computed-0 — both render '—' (unknown) rather than a misleading "0 ₽"
    // (AP#8: 0 masks an uncomputed value; same as F-39 mape:0). NaN/Infinity also → null.
    // PENDING BACKEND: docs/request-backend/188-AI-FORECAST-REVENUE-NOT-COMPUTED.md —
    // ask the engine to emit null (not 0) when revenue is genuinely uncomputed, so the
    // remaining placeholder-0 ambiguity disappears.
    predictedRevenue:
      typeof p.predictedRevenue === 'number' &&
      Number.isFinite(p.predictedRevenue) &&
      p.predictedRevenue !== 0
        ? p.predictedRevenue
        : null,
    confidence: scaleConfidence(p.confidence),
    nmId: p.nmId,
    vendorCode: p.vendorCode,
    naiveBaseline: p.naiveBaseline ?? null,
    aiVsNaive: p.aiVsNaive ?? null,
    forecastId: p.forecastId,
  }
}

export function normalizeAiForecastResponse(raw: RawAiForecastResponse): AiForecastResponse {
  // rollbackNotice may be a string (legacy) or structured object.
  // Defensive Frontend Principle: preserve the string as reason rather than dropping data silently.
  const rollback =
    raw.rollbackNotice == null
      ? null
      : typeof raw.rollbackNotice === 'string'
        ? (console.warn(
            '[ai-forecast] Legacy string rollbackNotice received, expected structured object. Wrapping into reason field.'
          ),
          { previousVersion: 0, rollbackDate: '', reason: raw.rollbackNotice })
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
