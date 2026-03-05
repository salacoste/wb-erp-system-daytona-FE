/**
 * Seller Info Hook
 * GET /v1/cabinets/:id/seller-info
 *
 * Returns seller name, SID, and trademark from WB General API.
 * staleTime=60min — data rarely changes, backend caches 1 hour.
 */

import { useQuery } from '@tanstack/react-query'
import { getSellerInfo } from '@/lib/api/cabinet'

export const sellerInfoKeys = {
  all: ['seller-info'] as const,
  byId: (cabinetId: string) => ['seller-info', cabinetId] as const,
}

export function useSellerInfo(cabinetId: string) {
  return useQuery({
    queryKey: sellerInfoKeys.byId(cabinetId),
    queryFn: () => getSellerInfo(cabinetId),
    enabled: !!cabinetId,
    staleTime: 60 * 60_000,
  })
}
