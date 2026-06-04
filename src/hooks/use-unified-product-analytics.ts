/**
 * Unified Product Analytics React Query Hooks — Stories 120.6 + 120.7-FE.
 *
 * Three independent hooks for the 3 product analytics endpoints
 * (Pattern 1: independent hooks, multi-source orchestration).
 */

import { useQuery } from '@tanstack/react-query'
import {
  getUnifiedProductAnalytics,
  getOrganicShare,
  getIncrementalRoas,
  unifiedProductQueryKeys,
  UNIFIED_PRODUCT_CACHE,
} from '@/lib/api/unified-product-analytics'

export interface UseUnifiedProductParams {
  nmId: string | undefined
  from: string
  to: string
}

/** GET /unified — funnel + advertising + organic + summary. */
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

/** GET /organic-share — per-day organic/paid cart split (Story 120.7). */
export function useOrganicShare({ nmId, from, to }: UseUnifiedProductParams) {
  return useQuery({
    queryKey: unifiedProductQueryKeys.organicShare({ nmId: nmId ?? '', from, to }),
    queryFn: () => getOrganicShare({ nmId: nmId!, from, to }),
    enabled: !!nmId && !!from && !!to,
    staleTime: UNIFIED_PRODUCT_CACHE.staleTime,
    gcTime: UNIFIED_PRODUCT_CACHE.gcTime,
    retry: 1,
  })
}

/** GET /incremental-roas — true incremental ad value (Story 120.7). */
export function useIncrementalRoas({ nmId, from, to }: UseUnifiedProductParams) {
  return useQuery({
    queryKey: unifiedProductQueryKeys.incrementalRoas({ nmId: nmId ?? '', from, to }),
    queryFn: () => getIncrementalRoas({ nmId: nmId!, from, to }),
    enabled: !!nmId && !!from && !!to,
    staleTime: UNIFIED_PRODUCT_CACHE.staleTime,
    gcTime: UNIFIED_PRODUCT_CACHE.gcTime,
    retry: 1,
  })
}
