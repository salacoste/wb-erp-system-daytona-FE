'use client'

/**
 * TanStack Query hook for Inventory Summary
 * GET /v1/inventory/summary — stock snapshot with capitalization
 */

import { useQuery } from '@tanstack/react-query'
import { getInventorySummary, inventorySummaryQueryKeys } from '@/lib/api/inventory-summary'

/** Inventory summary snapshot (5min staleTime — backend caches) */
export function useInventorySummary() {
  return useQuery({
    queryKey: inventorySummaryQueryKeys.summary(),
    queryFn: getInventorySummary,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
  })
}
