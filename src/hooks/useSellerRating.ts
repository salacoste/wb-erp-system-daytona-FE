/**
 * Seller Rating Hook
 * GET /v1/cabinets/:id/seller-rating
 *
 * Returns seller valuation (0–5 scale) and feedback count from WB API.
 * staleTime=60min — backend caches for 1 hour.
 * retry=false — backend returns graceful 200 with available=false on permission/API errors.
 */

import { useQuery } from '@tanstack/react-query'
import { getSellerRating } from '@/lib/api/cabinet'

export const sellerRatingKeys = {
  all: ['seller-rating'] as const,
  byId: (cabinetId: string) => ['seller-rating', cabinetId] as const,
}

export function useSellerRating(cabinetId: string) {
  return useQuery({
    queryKey: sellerRatingKeys.byId(cabinetId),
    queryFn: () => getSellerRating(cabinetId),
    enabled: !!cabinetId,
    staleTime: 60 * 60_000,
    retry: false,
  })
}
