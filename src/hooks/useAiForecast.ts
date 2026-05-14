/**
 * TanStack Query hook for AI Sales Forecast
 * GET /v1/ai/forecast
 */

import { useQuery } from '@tanstack/react-query'
import { getAiForecast } from '@/lib/api/ai-forecast-api'
import type { AiForecastParams } from '@/types/ai-forecast'

export const aiForecastKeys = {
  all: ['ai', 'forecast'] as const,
  forecast: (params: AiForecastParams) =>
    [...aiForecastKeys.all, params.level ?? 'sku', params.nmId, params.horizonDays] as const,
}

export function useAiForecast(params: AiForecastParams, enabled = true) {
  return useQuery({
    queryKey: aiForecastKeys.forecast(params),
    queryFn: () => getAiForecast(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  })
}
