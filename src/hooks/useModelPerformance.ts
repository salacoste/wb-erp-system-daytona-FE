/**
 * TanStack Query hook for AI Model performance detail.
 * GET /v1/ai/models/:id/performance
 * Story 109.5-FE: cabinet-scoped queryKey per Story 97.5-FE cabinet-isolation discipline.
 * No polling — performance data is stable within a session.
 */

import { useQuery } from '@tanstack/react-query'
import { getModelPerformance } from '@/lib/api/ai/models'
import { useAuthStore } from '@/stores/authStore'
import type { ModelPerformanceResponse } from '@/types/ai/models'

export const modelPerformanceKeys = {
  // cabinetId scoping per CLAUDE.md Pattern 4 § Multi-tenant cabinet-isolation discipline (Story 97.5-FE).
  all: (cabinetId: string | null) => ['ai', 'model-performance', cabinetId] as const,
  byId: (cabinetId: string | null, modelId: string) =>
    [...modelPerformanceKeys.all(cabinetId), modelId] as const,
}

export function useModelPerformance(modelId: string, options: { enabled?: boolean } = {}) {
  const cabinetId = useAuthStore(s => s.cabinetId)
  return useQuery<ModelPerformanceResponse>({
    queryKey: modelPerformanceKeys.byId(cabinetId, modelId),
    queryFn: () => getModelPerformance(modelId),
    enabled: !!cabinetId && !!modelId && (options.enabled ?? true),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
  })
}
