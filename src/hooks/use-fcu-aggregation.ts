/**
 * FCU Aggregation TanStack Query Hook
 * Epic 77-FE, Story 77.4: Per-SKU delivery cost for unit economics
 * Pattern: src/hooks/useUnitEconomics.ts
 */

import { useQuery } from '@tanstack/react-query'
import { getFcuBySku } from '@/lib/api/shipment-cost/fcu-aggregation-api'
import type { FcuBySkuItem } from '@/lib/api/shipment-cost/fcu-aggregation-api'

export const fcuAggregationKeys = {
  all: ['fcu-aggregation'] as const,
  bySku: (week?: string) => [...fcuAggregationKeys.all, 'by-sku', week] as const,
}

/**
 * Fetch per-SKU FCU from latest confirmed shipment.
 * Gracefully handles 404/500 (endpoint may not be deployed yet).
 */
export function useFcuBySku(week?: string) {
  return useQuery<FcuBySkuItem[], Error>({
    queryKey: fcuAggregationKeys.bySku(week),
    queryFn: () => getFcuBySku(week),
    enabled: !!week,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
  })
}
