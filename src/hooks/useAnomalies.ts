/**
 * TanStack Query hook for AI anomaly list (Owner or Manager role only).
 * GET /v1/ai/anomalies — PENDING BACKEND: #167 (stub returns empty list).
 * Story 112.3-FE: dual-role gate (Owner OR Manager) per AC-3/AC-6.
 * Cabinet-scoped queryKey per Story 97.5-FE discipline.
 */

import { useQuery } from '@tanstack/react-query'
import { getAnomalies } from '@/lib/api/ai/system'
import { useAuthStore } from '@/stores/authStore'
import type { AnomalyListResponse, AnomalyStatus } from '@/types/ai/system'

export interface AnomaliesParams {
  status?: AnomalyStatus
  page?: number
  limit?: number
}

export const anomaliesKeys = {
  // cabinetId scoping per CLAUDE.md § Multi-tenant cabinet-isolation discipline (Story 97.5-FE).
  all: (cabinetId: string | null) => ['ai', 'anomalies', cabinetId] as const,
  filtered: (cabinetId: string | null, status: AnomalyStatus | null, page: number, limit: number) =>
    [...anomaliesKeys.all(cabinetId), status, page, limit] as const,
}

export function useAnomalies(params: AnomaliesParams = {}) {
  const cabinetId = useAuthStore(s => s.cabinetId)
  const user = useAuthStore(s => s.user)

  return useQuery<AnomalyListResponse>({
    queryKey: anomaliesKeys.filtered(
      cabinetId,
      params.status ?? null,
      params.page ?? 1,
      params.limit ?? 20
    ),
    queryFn: () => getAnomalies(params),
    // Dual-role gate: Owner OR Manager — broader than Story 112.1/112.2 Owner-only.
    // Matches backend RBAC documented in src/types/ai/system.ts:38.
    enabled: !!cabinetId && (user?.role === 'Owner' || user?.role === 'Manager'),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 1,
  })
}
