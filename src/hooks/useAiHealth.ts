/**
 * AI Engine Health monitoring hook.
 * Polls /v1/ai/health every 30s per backend guide polling strategy.
 *
 * Story 108.2-FE.
 * Cabinet-isolation discipline (Story 97.5-FE): /v1/ai/health is GLOBAL
 * (no cabinet context per backend guide). queryKey does NOT include cabinetId.
 */
import { useQuery } from '@tanstack/react-query'
import { getAiHealth } from '@/lib/api/ai/system'
import type { AiHealthResponse } from '@/types/ai/system'

export const aiHealthKeys = {
  all: ['ai', 'health'] as const,
} as const

export function useAiHealth() {
  return useQuery<AiHealthResponse, Error>({
    queryKey: aiHealthKeys.all,
    queryFn: getAiHealth,
    refetchInterval: 30_000,
    staleTime: 15_000,
    gcTime: 60_000,
    retry: 1,
  })
}
