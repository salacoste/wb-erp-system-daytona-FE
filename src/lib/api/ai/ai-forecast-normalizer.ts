/**
 * AI Forecast boundary normalizer — Story 108.1-FE
 * Endpoint: GET /v1/ai/forecast
 * Extended from Epic 103-FE with new optional prediction fields.
 */

import { toNullableNumber } from '../normalizer-helpers'
import { logger } from '@/lib/logger'
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
 * Request #180 RESOLVED (2026-06-06): backend now guarantees 0-1 confidence scale.
 * DTO documents 0-1 range; engines clamp to [0,1]. The magnitude-detection heuristic
 * (raw > 1 → divide by 100) is no longer needed. Plain clamp is sufficient.
 */
function scaleConfidence(raw: unknown): number | null {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null
  return Math.min(1, Math.max(0, raw))
}

function normalizePrediction(p: RawForecastPrediction): AiForecastPrediction {
  return {
    date: p.forecastDate,
    horizonDays: p.horizonDays ?? 0,
    // Epic 113 I1: backend now sends predictedUnits:null for revenue-target models.
    // Preserve null (AP#8: never coerce to 0).
    predictedSales: p.predictedUnits ?? null,
    // Request #188 RESOLVED (2026-06-06): revenue-target models now emit real predictedRevenue.
    // The 0→null mapping is retained because units-target models still send predictedRevenue:0
    // as placeholder (non-target dimension). NaN/Infinity also → null (AP#8).
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
        ? (logger.warn(
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
