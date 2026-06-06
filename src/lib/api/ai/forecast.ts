/**
 * AI Forecast API — fetcher
 * Endpoint: GET /v1/ai/forecast
 * Story 108.1-FE: Extended from Epic 103-FE with new optional prediction fields.
 */

import { apiClient } from '../../api-client'
import { normalizeAiForecastResponse } from './ai-forecast-normalizer'
import type { AiForecastParams, AiForecastResponse } from '@/types/ai/forecast'

export { normalizeAiForecastResponse } from './ai-forecast-normalizer'

export async function getAiForecast(params: AiForecastParams): Promise<AiForecastResponse> {
  const queryParams = new URLSearchParams()
  if (params.modelType) queryParams.set('modelType', params.modelType)
  if (params.nmId != null) queryParams.set('nmId', String(params.nmId))
  if (params.level) queryParams.set('level', params.level)
  if (params.horizonDays != null) queryParams.set('horizonDays', String(params.horizonDays))
  if (params.format) queryParams.set('format', params.format)

  const raw = await apiClient.get<unknown>(`/v1/ai/forecast?${queryParams.toString()}`)
  return normalizeAiForecastResponse(raw)
}
