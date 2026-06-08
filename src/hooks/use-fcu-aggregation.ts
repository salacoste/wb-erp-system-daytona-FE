/**
 * FCU Aggregation TanStack Query Hook
 * Epic 77-FE, Story 77.4: Per-SKU delivery cost for unit economics
 * Story 85.2: Re-enabled after backend delivered /v1/shipment-cost/by-sku
 *
 * @internal Wired by `useUnitEconomicsPageState` in
 *   `src/app/(dashboard)/analytics/unit-economics/`. Not orphaned —
 *   consumed when `viewBy === 'sku'` to enrich unit-economics rows with
 *   per-SKU delivery cost.
 */

import { useQuery } from '@tanstack/react-query'
import { getFcuBySku, type FcuBySkuItem } from '@/lib/api/shipment-cost/fcu-aggregation-api'

export const fcuAggregationKeys = {
  all: ['fcu-aggregation'] as const,
  bySku: (week?: string) => [...fcuAggregationKeys.all, 'by-sku', week] as const,
}

/**
 * Fetch per-SKU FCU from latest confirmed shipment.
 * Returns empty array if no confirmed shipments exist.
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
