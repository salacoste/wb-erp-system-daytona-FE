/**
 * AI Preferences (on/off toggle) — GET and PATCH.
 * Story 108.2-FE.
 * Cabinet-isolation (Story 97.5-FE): preferences are per-cabinet,
 * so queryKey INCLUDES cabinetId.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAiPreferences, patchAiPreferences } from '@/lib/api/ai/system'
import { useAuthStore } from '@/stores/authStore'
import type { AiPreferences } from '@/types/ai/system'

export const aiPreferencesKeys = {
  byCabinet: (cabinetId: string | null) => ['ai', 'preferences', cabinetId] as const,
} as const

export function useAiPreferences() {
  const cabinetId = useAuthStore(s => s.cabinetId)
  return useQuery<AiPreferences, Error>({
    queryKey: aiPreferencesKeys.byCabinet(cabinetId),
    queryFn: getAiPreferences,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    enabled: !!cabinetId,
  })
}

export function useUpdateAiPreferences() {
  const cabinetId = useAuthStore(s => s.cabinetId)
  const queryClient = useQueryClient()
  return useMutation<AiPreferences, Error, AiPreferences>({
    mutationFn: body => patchAiPreferences(body),
    onMutate: async newPrefs => {
      const key = aiPreferencesKeys.byCabinet(cabinetId)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<AiPreferences>(key)
      queryClient.setQueryData(key, newPrefs)
      return { previous }
    },
    onError: (_err, _vars, context) => {
      const ctx = context as { previous?: AiPreferences } | undefined
      if (ctx?.previous) {
        queryClient.setQueryData(aiPreferencesKeys.byCabinet(cabinetId), ctx.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: aiPreferencesKeys.byCabinet(cabinetId) })
    },
  })
}
