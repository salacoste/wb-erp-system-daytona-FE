/**
 * AI Trends hook — top SKUs from /v1/ai/trends.
 * Used in 'collecting' state to show top performers while AI accumulates data.
 *
 * Story 108.4-FE.
 * Cabinet-isolation discipline (Story 97.5-FE): /v1/ai/trends IS per-cabinet
 * (returns cabinet's SKUs). queryKey INCLUDES cabinetId.
 */
import { useQuery } from '@tanstack/react-query'
import { getAiTrends } from '@/lib/api/ai/trends-sneak'
import { useAuthStore } from '@/stores/authStore'
import type { AiTrendsResponse } from '@/types/ai/trends-sneak'

export const aiTrendsKeys = {
  byCabinet: (cabinetId: string | null) => ['ai', 'trends', cabinetId] as const,
} as const

export function useAiTrends(enabled = true) {
  const cabinetId = useAuthStore(s => s.cabinetId)
  return useQuery<AiTrendsResponse, Error>({
    queryKey: aiTrendsKeys.byCabinet(cabinetId),
    queryFn: getAiTrends,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    enabled: !!cabinetId && enabled,
    retry: 1,
  })
}
