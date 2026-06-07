/**
 * Forecast Accuracy API — fetcher + normalizer
 * Endpoint: GET /v1/ai/forecast-accuracy
 * Epic 123-FE Story 123.4
 */

import { apiClient } from '../../api-client'
import { toCount, toNullableNumber } from '../normalizer-helpers'
import type {
  ForecastAccuracyResponse,
  HorizonAccuracy,
  SkuAccuracy,
} from '@/types/ai/forecast-accuracy'

interface RawHorizonAccuracy {
  horizonDays?: unknown
  mape?: unknown
  mae?: unknown
  count?: unknown
}

interface RawSkuAccuracy {
  nmId?: unknown
  mape?: unknown
  mae?: unknown
  count?: unknown
}

interface RawForecastAccuracyResponse {
  totalValidated?: unknown
  avgMAPE?: unknown
  avgMAE?: unknown
  avgBias?: unknown
  byHorizon?: unknown[]
  bySKU?: unknown[]
}

function normalizeHorizonAccuracy(raw: unknown): HorizonAccuracy {
  const r = raw as RawHorizonAccuracy
  return {
    horizonDays: toCount(r.horizonDays),
    mape: toNullableNumber(r.mape),
    mae: toNullableNumber(r.mae),
    count: toCount(r.count),
  }
}

function normalizeSkuAccuracy(raw: unknown): SkuAccuracy {
  const r = raw as RawSkuAccuracy
  return {
    nmId: toCount(r.nmId),
    mape: toNullableNumber(r.mape),
    mae: toNullableNumber(r.mae),
    count: toCount(r.count),
  }
}

export function normalizeForecastAccuracyResponse(raw: unknown): ForecastAccuracyResponse {
  const r = raw as RawForecastAccuracyResponse
  return {
    totalValidated: toCount(r.totalValidated),
    avgMAPE: toNullableNumber(r.avgMAPE),
    avgMAE: toNullableNumber(r.avgMAE),
    avgBias: toNullableNumber(r.avgBias),
    byHorizon: (r.byHorizon ?? []).map(normalizeHorizonAccuracy),
    bySKU: (r.bySKU ?? []).map(normalizeSkuAccuracy),
  }
}

export async function getForecastAccuracy(): Promise<ForecastAccuracyResponse> {
  const raw = await apiClient.get<unknown>('/v1/ai/forecast-accuracy')
  return normalizeForecastAccuracyResponse(raw)
}
