/**
 * TanStack Query hook for admin AI model list (Owner role only).
 * GET /v1/ai/admin/models
 * Story 112.1-FE: cabinet-scoped queryKey per Story 97.5-FE discipline.
 * enabled gate: Owner role check mirrors Sidebar.tsx:29 pattern.
 */

import { useQuery } from '@tanstack/react-query'
import { getAdminModels } from '@/lib/api/ai/admin'
import { useAuthStore } from '@/stores/authStore'
import type { AdminModelListParams, AdminModelListResponse } from '@/types/ai/admin'

export const adminModelsKeys = {
  // cabinetId scoping per CLAUDE.md § Multi-tenant cabinet-isolation discipline (Story 97.5-FE).
  all: (cabinetId: string | null) => ['ai', 'admin', 'models', cabinetId] as const,
  filtered: (cabinetId: string | null, status: string | null, page: number, limit: number) =>
    [...adminModelsKeys.all(cabinetId), status, page, limit] as const,
}

export function useAdminModels(params: AdminModelListParams = {}) {
  const cabinetId = useAuthStore(s => s.cabinetId)
  const user = useAuthStore(s => s.user)

  return useQuery<AdminModelListResponse>({
    queryKey: adminModelsKeys.filtered(
      cabinetId,
      params.status ?? null,
      params.page ?? 1,
      params.limit ?? 20
    ),
    queryFn: () => getAdminModels(params),
    // Owner-only fetch — matches Sidebar.tsx:29 capitalization convention ('Owner')
    enabled: !!cabinetId && user?.role === 'Owner',
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 1,
  })
}
