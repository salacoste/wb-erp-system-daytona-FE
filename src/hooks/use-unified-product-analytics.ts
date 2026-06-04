/**
 * Unified Product Analytics React Query Hook — Story 120.6-FE.
 *
 * Fetches GET /v1/analytics/product/:nmId/unified (Request #177 RESOLVED).
 * Follows use-funnel-analytics.ts convention (Pattern 1: independent hook).
 */

import { useQuery } from '@tanstack/react-query'
import {
  getUnifiedProductAnalytics,
  unifiedProductQueryKeys,
  UNIFIED_PRODUCT_CACHE,
} from '@/lib/api/unified-product-analytics'

export interface UseUnifiedProductParams {
  nmId: string | undefined
  from: string
  to: string
}

/** Unified product analytics (funnel + advertising + organic + summary). */
export function useUnifiedProductAnalytics({ nmId, from, to }: UseUnifiedProductParams) {
  return useQuery({
    queryKey: unifiedProductQueryKeys.data({ nmId: nmId ?? '', from, to }),
    queryFn: () => getUnifiedProductAnalytics({ nmId: nmId!, from, to }),
    enabled: !!nmId && !!from && !!to,
    staleTime: UNIFIED_PRODUCT_CACHE.staleTime,
    gcTime: UNIFIED_PRODUCT_CACHE.gcTime,
    retry: 1,
  })
}
