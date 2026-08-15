'use client'

/**
 * Pricing Basis Hooks (SPP-1.3)
 * Cabinet-scoped query + mutation for GET/PUT /v1/pricing/basis.
 * Mirrors useCabinetTaxSettings: queryKey includes cabinetId (Story 97.5-FE
 * multi-tenant cabinet-isolation discipline).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPricingBasis, updatePricingBasis } from '@/lib/api/pricing-basis'
import { priceRecommendationQueryKeys } from '@/hooks/usePriceRecommendations'
import type { PriceBasis } from '@/types/price-recommendations'

export const pricingBasisKeys = {
  all: ['pricing-basis'] as const,
  cabinet: (cabinetId: string) => ['pricing-basis', cabinetId] as const,
}

/** Fetch the current cabinet's pricing basis (disabled when no cabinet). */
export function usePricingBasis(cabinetId: string | null) {
  return useQuery({
    queryKey: pricingBasisKeys.cabinet(cabinetId ?? ''),
    queryFn: () => getPricingBasis(),
    enabled: !!cabinetId,
    staleTime: 60_000,
  })
}

/**
 * PUT the pricing basis. On success invalidates BOTH key families: the basis
 * setting itself + price recommendations (a basis change makes every cached
 * recommendation row stale — SPP-1.7-FE).
 */
export function useUpdatePricingBasis(cabinetId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (basis: PriceBasis) => updatePricingBasis(basis),
    onSuccess: basis => {
      if (cabinetId) {
        queryClient.setQueryData(pricingBasisKeys.cabinet(cabinetId), basis)
      }
      void queryClient.invalidateQueries({ queryKey: pricingBasisKeys.all })
      void queryClient.invalidateQueries({ queryKey: priceRecommendationQueryKeys.all })
    },
  })
}

/**
 * SPP-1.7-FE review fix: after a basis switch the BE list still serves cached
 * rows computed under the OLD basis (recomputation happens on /refresh or the
 * scheduler). The toggle surfaces this instead of silently showing a mixed
 * toggle=Витрина / badges=Продавец state.
 */
export function isRecomputePending(cabinetBasis: unknown, rowBasis: unknown): boolean {
  if (cabinetBasis !== 'SELLER' && cabinetBasis !== 'STOREFRONT_ANON') return false
  if (rowBasis !== 'SELLER' && rowBasis !== 'STOREFRONT_ANON') return false
  return cabinetBasis !== rowBasis
}
