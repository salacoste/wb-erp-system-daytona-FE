/**
 * Brand-Share React Query hooks — PR4b.
 * Reference: docs/request-backend/225-brand-share-backend-contract.md
 *
 * Three cascading read-only hooks:
 *  - useBrandShareBrands() — always enabled (no params).
 *  - useBrandShareParentSubjects(brand, range) — enabled only when a brand is picked.
 *  - useBrandShareReport(brand, parentId, range) — enabled only when brand AND category picked.
 *
 * Stale/retry mirrors advertising analytics conventions (staleTime 60s, retry once).
 * A 503 upstream failure is forwarded as-is (ApiError) for the view to render a friendly state.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import {
  brandShareQueryKeys,
  getBrandShareBrands,
  getBrandShareParentSubjects,
  getBrandShareReport,
} from '@/lib/api/brand-share'
import type {
  BrandParentSubject,
  BrandShareDateRange,
  BrandShareReport,
} from '@/types/brand-share'

const BRAND_SHARE_QUERY_CONFIG = {
  staleTime: 60_000,
  gcTime: 5 * 60_000,
  retry: 1,
} as const

/** 1. Brand list for the first dropdown. */
export function useBrandShareBrands(): UseQueryResult<string[]> {
  return useQuery({
    queryKey: brandShareQueryKeys.brands(),
    queryFn: getBrandShareBrands,
    ...BRAND_SHARE_QUERY_CONFIG,
  })
}

/** 2. Parent-subject (category) list — enabled only after a brand is selected. */
export function useBrandShareParentSubjects(
  brand: string | null,
  range: BrandShareDateRange
): UseQueryResult<BrandParentSubject[]> {
  const enabled = !!brand && brand.trim() !== ''
  return useQuery({
    queryKey: brandShareQueryKeys.parentSubjects(brand ?? '', range),
    queryFn: () => getBrandShareParentSubjects({ brand: brand as string, ...range }),
    ...BRAND_SHARE_QUERY_CONFIG,
    enabled,
  })
}

/** 3. Daily time-series report — enabled only after brand AND category are selected. */
export function useBrandShareReport(
  brand: string | null,
  parentId: number | null,
  range: BrandShareDateRange
): UseQueryResult<BrandShareReport> {
  const enabled = !!brand && brand.trim() !== '' && parentId != null
  return useQuery({
    queryKey: brandShareQueryKeys.report(brand ?? '', parentId ?? 0, range),
    queryFn: () =>
      getBrandShareReport({ brand: brand as string, parentId: parentId as number, ...range }),
    ...BRAND_SHARE_QUERY_CONFIG,
    enabled,
  })
}
