/**
 * Supplies Query Keys & URL Builder
 * Extracted from supplies.ts for file-size compliance (Epic 134-FE)
 */

import type { SuppliesListParams } from '@/types/supplies'

// =============================================================================
// Query Keys Factory
// =============================================================================

/** Query keys for supplies (React Query caching) */
export const suppliesQueryKeys = {
  all: ['supplies'] as const,
  lists: () => [...suppliesQueryKeys.all, 'list'] as const,
  list: (params: SuppliesListParams) => [...suppliesQueryKeys.lists(), params] as const,
  details: () => [...suppliesQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...suppliesQueryKeys.details(), id] as const,
  documents: (id: string) => [...suppliesQueryKeys.all, 'documents', id] as const,
}

// =============================================================================
// Helper Functions
// =============================================================================

/** Build query string from params object, filtering out null/undefined */
export function buildQueryString(params: SuppliesListParams): string {
  const searchParams = new URLSearchParams()

  const entries = Object.entries(params) as [string, unknown][]
  for (const [key, value] of entries) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  }

  return searchParams.toString()
}
