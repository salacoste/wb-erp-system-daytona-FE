/**
 * AI Forecast boundary normalizer — Story 108.1-FE
 * Endpoint: GET /v1/ai/forecast
 * Extended from Epic 103-FE with new optional prediction fields.
 */

import { toNullableNumber } from '../normalizer-helpers'
import type { AiForecastResponse, AiForecastPrediction } from '@/types/ai/forecast'

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
 * documents 0-100 (example 82.5), but the live engines emit 0-1. Detect by
 * magnitude — >1 is a percentage (0-100), ≤1 is a probability (0-1) — so
 * BOTH scales normalize to canonical 0-1. Clamp to [0,1].
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
    // Epic 113 I1: backend now sends predictedUnits:null for revenue-target models.
    // Preserve null (AP#8: never coerce to 0).
    predictedSales: p.predictedUnits ?? null,
    // Validation F-45 (updated Epic 113 I1): revenue-target models now emit REAL
    // predictedRevenue. The 0→null mapping is kept because units-target models still
    // send predictedRevenue:0 as a placeholder, and the backend can't distinguish
    // placeholder-0 from genuine computed-0. NaN/Infinity also → null.
    predictedRevenue:
      typeof p.predictedRevenue === 'number' &&
      Number.isFinite(p.predictedRevenue) &&
      p.predictedRevenue !== 0
        ? p.predictedRevenue
        : null,
    confidence: scaleConfidence(p.confidence),
    nmId: p.nmId,
    vendorCode: p.vendorCode,
    naiveBaseline: toNullableNumber(p.naiveBaseline),
    aiVsNaive: p.aiVsNaive ?? null,
    forecastId: p.forecastId,
  }
}

export function normalizeAiForecastResponse(raw: unknown): AiForecastResponse {
  const r = raw as RawAiForecastResponse
  // rollbackNotice may be a string (legacy) or structured object.
  // Defensive Frontend Principle: preserve the string as reason rather than dropping data silently.
  const rollback =
    r.rollbackNotice == null
      ? null
      : typeof r.rollbackNotice === 'string'
        ? (console.warn(
            '[ai-forecast] Legacy string rollbackNotice received, expected structured object. Wrapping into reason field.'
          ),
          { previousVersion: 0, rollbackDate: '', reason: r.rollbackNotice })
        : {
            previousVersion: r.rollbackNotice.previousVersion,
            rollbackDate: r.rollbackNotice.rollbackDate,
            reason: r.rollbackNotice.reason,
          }

  return {
    predictions: (r.predictions ?? []).map(normalizePrediction),
    modelVersion: r.modelVersion,
    engine: r.engine as AiForecastResponse['engine'],
    cached: r.cached,
    generatedAt: r.generatedAt,
    explanation: r.explanation ?? null,
    rollbackNotice: rollback,
  }
}
