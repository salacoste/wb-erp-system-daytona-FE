/**
 * TanStack Query hook for forecast accuracy summary.
 * GET /v1/ai/forecast-accuracy
 * Epic 123-FE Story 123.4: cabinet-scoped queryKey per Story 97.5-FE.
 */

import { useQuery } from '@tanstack/react-query'
import { getForecastAccuracy } from '@/lib/api/ai/forecast-accuracy'
import { useAuthStore } from '@/stores/authStore'
import type { ForecastAccuracyResponse } from '@/types/ai/forecast-accuracy'

export const forecastAccuracyKeys = {
  all: (cabinetId: string | null) => ['ai', 'forecast-accuracy', cabinetId] as const,
}

export function useForecastAccuracy() {
  const cabinetId = useAuthStore(s => s.cabinetId)
  return useQuery<ForecastAccuracyResponse>({
    queryKey: forecastAccuracyKeys.all(cabinetId),
    queryFn: () => getForecastAccuracy(),
    enabled: !!cabinetId,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}
