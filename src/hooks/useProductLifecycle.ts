/**
 * Hooks for discontinued-product («Снят с продажи») assortment management.
 * TanStack Query: cabinet-scoped keys (Story 97.5-FE cabinet-isolation discipline),
 * mutation invalidates both lists so the UI reflects PATCH changes immediately.
 *
 * @see src/lib/api/product-lifecycle-api.ts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import {
  discontinuedProductsQueryKeys,
  discontinuedSuggestionsQueryKeys,
  getDiscontinuedProducts,
  getDiscontinuedSuggestions,
  updateProductLifecycle,
} from '@/lib/api/product-lifecycle-api'
import type { ProductLifecycleStatus } from '@/types/product-lifecycle'

const STALE_TIME = 60_000

/** Discontinued products for the current cabinet. */
export function useDiscontinuedProducts() {
  const cabinetId = useAuthStore(s => s.cabinetId)
  return useQuery({
    queryKey: discontinuedProductsQueryKeys.all(cabinetId ?? null),
    queryFn: getDiscontinuedProducts,
    enabled: !!cabinetId,
    staleTime: STALE_TIME,
  })
}

/** System-suggested-discontinued products pending seller confirmation. */
export function useDiscontinuedSuggestions() {
  const cabinetId = useAuthStore(s => s.cabinetId)
  return useQuery({
    queryKey: discontinuedSuggestionsQueryKeys.all(cabinetId ?? null),
    queryFn: getDiscontinuedSuggestions,
    enabled: !!cabinetId,
    staleTime: STALE_TIME,
  })
}

/** PATCH /v1/products/:nmId/lifecycle — invalidate both lists on success. */
export function useUpdateProductLifecycle() {
  const queryClient = useQueryClient()
  const cabinetId = useAuthStore(s => s.cabinetId)
  return useMutation({
    mutationFn: ({
      nmId,
      status,
      discontinuedAt,
    }: {
      nmId: number
      status: ProductLifecycleStatus
      discontinuedAt?: string
    }) => updateProductLifecycle(nmId, status, discontinuedAt),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: discontinuedProductsQueryKeys.all(cabinetId ?? null),
      })
      void queryClient.invalidateQueries({
        queryKey: discontinuedSuggestionsQueryKeys.all(cabinetId ?? null),
      })
    },
  })
}
