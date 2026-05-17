/**
 * TanStack Query hook for AI Model list
 * GET /v1/ai/models
 * Story 109.3-FE: cabinet-scoped queryKey per Story 97.5-FE discipline.
 * Story 109.4-FE: optional polling support (AC-2, AC-5).
 */

import { useQuery } from '@tanstack/react-query'
import { getAiModels } from '@/lib/api/ai/models'
import { useAuthStore } from '@/stores/authStore'
import type { AiModelListResponse } from '@/types/ai/models'

export const aiModelsKeys = {
  // cabinetId scoping per CLAUDE.md Pattern 4 § Multi-tenant cabinet-isolation discipline (Story 97.5-FE).
  all: (cabinetId: string | null) => ['ai', 'models', cabinetId] as const,
  list: (cabinetId: string | null) => [...aiModelsKeys.all(cabinetId)] as const,
}

export interface UseAiModelsOptions {
  /**
   * When true, sets refetchInterval: 5_000 to poll until training completes.
   * Story 109.4-FE AC-2: caller (ModelListSection) decides on/off.
   * Backward-compat: omitting options preserves Story 109.3 default behavior.
   */
  polling?: boolean
}

export function useAiModels(options?: UseAiModelsOptions) {
  const cabinetId = useAuthStore(s => s.cabinetId)
  return useQuery<AiModelListResponse>({
    queryKey: aiModelsKeys.list(cabinetId),
    queryFn: () => getAiModels(),
    enabled: !!cabinetId,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
    refetchInterval: options?.polling === true ? 5_000 : false,
  })
}
