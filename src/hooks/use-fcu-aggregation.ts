/**
 * FCU Aggregation TanStack Query Hook
 * Epic 77-FE, Story 77.4: Per-SKU delivery cost for unit economics
 * Pattern: src/hooks/useUnitEconomics.ts
 */

import { useQuery } from '@tanstack/react-query'
import type { FcuBySkuItem } from '@/lib/api/shipment-cost/fcu-aggregation-api'

export const fcuAggregationKeys = {
  all: ['fcu-aggregation'] as const,
  bySku: (week?: string) => [...fcuAggregationKeys.all, 'by-sku', week] as const,
}

/**
 * Fetch per-SKU FCU from latest confirmed shipment.
 * Backend endpoint /v1/shipment-cost/by-sku is NOT YET IMPLEMENTED (confirmed 2026-03-30).
 * Hook disabled until backend delivers the endpoint. Returns empty array.
 */
export function useFcuBySku(_week?: string) {
  return useQuery<FcuBySkuItem[], Error>({
    queryKey: fcuAggregationKeys.bySku(_week),
    queryFn: () => Promise.resolve([]),
    enabled: false, // Endpoint not implemented — re-enable when backend delivers
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })
}
