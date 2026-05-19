/**
 * TanStack Query hook for AI SKU accuracy list.
 * GET /v1/ai/evaluations/sku-accuracy
 * Story 110.3-FE Task 3: cabinet-scoped queryKey per Story 97.5-FE cabinet-isolation discipline.
 * No polling — evaluation data is stable within a session.
 * PENDING BACKEND: #166 — modelId/nmId sent as query params; backend currently ignores them.
 */

import { useQuery } from '@tanstack/react-query'
import { getSkuAccuracy } from '@/lib/api/ai/evaluations'
import { useAuthStore } from '@/stores/authStore'
import type { SkuAccuracyListResponse } from '@/types/ai/evaluations'

export const aiSkuAccuracyKeys = {
  // cabinetId + modelId + nmId scoping per CLAUDE.md Pattern 4 § Multi-tenant cabinet-isolation (Story 97.5-FE).
  all: (cabinetId: string | null) => ['ai', 'sku-accuracy', cabinetId] as const,
  byModel: (cabinetId: string | null, modelId: string) =>
    [...aiSkuAccuracyKeys.all(cabinetId), modelId] as const,
  bySku: (cabinetId: string | null, modelId: string, nmId: number | null) =>
    [...aiSkuAccuracyKeys.byModel(cabinetId, modelId), nmId] as const,
}

export function useAiSkuAccuracy(modelId: string, nmId?: number) {
  const cabinetId = useAuthStore(s => s.cabinetId)
  // F-7: normalize once at hook boundary — queryKey and fetcher both use the same value
  const normalizedNmId: number | null = nmId ?? null
  return useQuery<SkuAccuracyListResponse>({
    queryKey: aiSkuAccuracyKeys.bySku(cabinetId, modelId, normalizedNmId),
    queryFn: () => getSkuAccuracy({ modelId, nmId: normalizedNmId }),
    enabled: !!cabinetId && !!modelId,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}
