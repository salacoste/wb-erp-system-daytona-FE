/**
 * TanStack Query hook for AI Sales Forecast
 * GET /v1/ai/forecast
 */

import { useQuery } from '@tanstack/react-query'
import { getAiForecast } from '@/lib/api/ai-forecast-api'
import { useAuthStore } from '@/stores/authStore'
import type { AiForecastParams } from '@/types/ai-forecast'

export const aiForecastKeys = {
  // cabinetId scoping per CLAUDE.md Pattern 4 § Multi-tenant cabinet-isolation discipline (Story 97.5-FE).
  all: (cabinetId: string | null) => ['ai', 'forecast', cabinetId] as const,
  forecast: (cabinetId: string | null, params: AiForecastParams) =>
    [
      ...aiForecastKeys.all(cabinetId),
      params.level ?? 'sku',
      params.nmId,
      params.horizonDays,
      params.modelType ?? 'sales_forecast',
    ] as const,
}

export function useAiForecast(params: AiForecastParams, enabled = true) {
  const cabinetId = useAuthStore(s => s.cabinetId)
  return useQuery({
    queryKey: aiForecastKeys.forecast(cabinetId, params),
    queryFn: () => getAiForecast(params),
    enabled: enabled && !!cabinetId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  })
}
