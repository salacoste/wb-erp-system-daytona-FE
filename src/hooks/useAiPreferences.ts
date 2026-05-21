/**
 * TanStack Query hook for AI Preferences (master aiEnabled toggle).
 * GET /v1/ai/preferences — Owner-only (cabinet-scoped per Story 97.5-FE).
 * Story 112.2-FE Task 1.
 *
 * QueryKey: ['ai', 'preferences', cabinetId] — scoped per cabinet-isolation discipline.
 * enabled: !!cabinetId && user?.role === 'Owner' — dual-gate per Story 112.1 F-3.
 */

import { useQuery } from '@tanstack/react-query'
import { getAiPreferences } from '@/lib/api/ai/system'
import { useAuthStore } from '@/stores/authStore'
import type { AiPreferences } from '@/types/ai/system'

export const aiPreferencesKeys = {
  // cabinetId scoping per CLAUDE.md Pattern 4 § Multi-tenant cabinet-isolation discipline (Story 97.5-FE).
  // Name: byCabinet — factory takes cabinetId input, returns per-cabinet key (not all-cabinets).
  byCabinet: (cabinetId: string | null) => ['ai', 'preferences', cabinetId] as const,
}

export function useAiPreferences() {
  const cabinetId = useAuthStore(s => s.cabinetId)
  const user = useAuthStore(s => s.user)

  return useQuery<AiPreferences>({
    queryKey: aiPreferencesKeys.byCabinet(cabinetId),
    queryFn: () => getAiPreferences(),
    // Dual-gate: cabinetId required AND Owner role required (Story 112.1 F-3 precedent).
    enabled: !!cabinetId && user?.role === 'Owner',
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
  })
}
