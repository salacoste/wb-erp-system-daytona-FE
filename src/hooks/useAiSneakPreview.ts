/**
 * AI Sneak-preview hook — low-confidence forecasts during 'sneak_preview' state.
 *
 * Story 108.5-FE.
 * Cabinet-isolation discipline (Story 97.5-FE): /v1/ai/sneak-preview IS per-cabinet.
 * queryKey INCLUDES cabinetId.
 */
import { useQuery } from '@tanstack/react-query'
import { getAiSneakPreview } from '@/lib/api/ai/trends-sneak'
import { useAuthStore } from '@/stores/authStore'
import type { AiSneakPreviewResponse } from '@/types/ai/trends-sneak'

export const aiSneakPreviewKeys = {
  byCabinet: (cabinetId: string | null) => ['ai', 'sneak-preview', cabinetId] as const,
} as const

export function useAiSneakPreview(enabled = true) {
  const cabinetId = useAuthStore(s => s.cabinetId)
  return useQuery<AiSneakPreviewResponse, Error>({
    queryKey: aiSneakPreviewKeys.byCabinet(cabinetId),
    queryFn: getAiSneakPreview,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    enabled: !!cabinetId && enabled,
    retry: 1,
  })
}
