/**
 * TanStack Query hook for AI Model list
 * GET /v1/ai/models
 * Story 109.3-FE: cabinet-scoped queryKey per Story 97.5-FE discipline.
 */

import { useQuery } from '@tanstack/react-query'
import { getAiModels } from '@/lib/api/ai/models'
import { useAuthStore } from '@/stores/authStore'

export const aiModelsKeys = {
  // cabinetId scoping per CLAUDE.md Pattern 4 § Multi-tenant cabinet-isolation discipline (Story 97.5-FE).
  all: (cabinetId: string | null) => ['ai', 'models', cabinetId] as const,
  list: (cabinetId: string | null) => [...aiModelsKeys.all(cabinetId)] as const,
}

export function useAiModels() {
  const cabinetId = useAuthStore(s => s.cabinetId)
  return useQuery({
    queryKey: aiModelsKeys.list(cabinetId),
    queryFn: () => getAiModels(),
    enabled: !!cabinetId,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
  })
}
