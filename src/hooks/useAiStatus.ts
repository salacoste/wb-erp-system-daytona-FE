/**
 * AI Readiness Status hook.
 * Polls /v1/ai/status every 60s when readinessLevel !== 'ready'.
 * Once ready, polling stops (data unlikely to change back to collecting).
 *
 * Story 108.3-FE.
 * Cabinet-isolation discipline (Story 97.5-FE): /v1/ai/status IS per-cabinet
 * (returns cabinet-specific weeks/SKUs/orders). queryKey INCLUDES cabinetId.
 */
import { useQuery } from '@tanstack/react-query'
import { getAiStatus } from '@/lib/api/ai/status'
import { useAuthStore } from '@/stores/authStore'
import type { AiStatusResponse } from '@/types/ai/status'

export const aiStatusKeys = {
  byCabinet: (cabinetId: string | null) => ['ai', 'status', cabinetId] as const,
} as const

export function useAiStatus() {
  const cabinetId = useAuthStore(s => s.cabinetId)
  return useQuery<AiStatusResponse, Error>({
    queryKey: aiStatusKeys.byCabinet(cabinetId),
    queryFn: getAiStatus,
    // TanStack Query v5: refetchInterval callback receives the query object
    // Poll every 60s ONLY when not ready (data unlikely to change once ready)
    refetchInterval: query => {
      const data = query.state.data
      return data?.readinessLevel === 'ready' ? false : 60_000
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    enabled: !!cabinetId,
    retry: 1,
  })
}
