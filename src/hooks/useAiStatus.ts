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

/**
 * Extracted for direct unit testing (pure functions over hook mocking, CLAUDE.md discipline).
 * Returns false (stop polling) when ready; 60s interval otherwise.
 * Handles undefined data (initial fetch / error state) by continuing to poll.
 */
export function shouldPollAiStatus(query: { state: { data?: AiStatusResponse } }): false | number {
  return query.state.data?.readinessLevel === 'ready' ? false : 60_000
}

/**
 * @param enabled - Pass false to suppress polling when AI is disabled (e.g. aiEnabled === false).
 *   Hook call must remain above early returns per Rules of Hooks — only the enabled flag changes.
 */
export function useAiStatus(enabled = true) {
  const cabinetId = useAuthStore(s => s.cabinetId)
  return useQuery<AiStatusResponse, Error>({
    queryKey: aiStatusKeys.byCabinet(cabinetId),
    queryFn: getAiStatus,
    // TanStack Query v5: refetchInterval callback receives the query object
    refetchInterval: shouldPollAiStatus,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    enabled: !!cabinetId && enabled,
    retry: 1,
  })
}
