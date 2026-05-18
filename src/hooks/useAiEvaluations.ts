/**
 * TanStack Query hook for AI Model evaluations list.
 * GET /v1/ai/evaluations
 * Story 110.2-FE: cabinet-scoped queryKey per Story 97.5-FE cabinet-isolation discipline.
 * No polling — evaluation data is stable within a session.
 */

import { useQuery } from '@tanstack/react-query'
import { getEvaluations } from '@/lib/api/ai/evaluations'
import { useAuthStore } from '@/stores/authStore'
import type { AiEvaluationListResponse } from '@/types/ai/evaluations'

export const aiEvaluationsKeys = {
  // cabinetId scoping per CLAUDE.md Pattern 4 § Multi-tenant cabinet-isolation discipline (Story 97.5-FE).
  all: (cabinetId: string | null) => ['ai', 'evaluations', cabinetId] as const,
  byModel: (cabinetId: string | null, modelId: string) =>
    [...aiEvaluationsKeys.all(cabinetId), modelId] as const,
}

export function useAiEvaluations(modelId: string) {
  const cabinetId = useAuthStore(s => s.cabinetId)
  return useQuery<AiEvaluationListResponse>({
    queryKey: aiEvaluationsKeys.byModel(cabinetId, modelId),
    queryFn: () => getEvaluations({ modelId }),
    enabled: !!cabinetId && !!modelId,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
  })
}
