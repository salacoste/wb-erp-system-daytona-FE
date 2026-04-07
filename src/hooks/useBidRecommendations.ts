/**
 * Bid Recommendations Hook
 * GET /v1/cabinets/:id/campaigns/:advertId/bid-recommendations?nmId=X
 * Story 86.1: 30min staleTime matching backend cache
 */

import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getBidRecommendations } from '@/lib/api/bid-recommendations'
import { ApiError } from '@/types/api'

export const bidRecommendationsKeys = {
  all: ['bid-recommendations'] as const,
  byParams: (advertId: number, nmId: number) => ['bid-recommendations', advertId, nmId] as const,
}

export function useBidRecommendations(cabinetId: string, advertId: number, nmId: number) {
  return useQuery({
    queryKey: bidRecommendationsKeys.byParams(advertId, nmId),
    queryFn: async () => {
      try {
        return await getBidRecommendations(cabinetId, advertId, nmId)
      } catch (err) {
        if (err instanceof ApiError && err.status === 429) {
          toast.error('Превышен лимит запросов. Повторите через несколько минут')
        }
        throw err
      }
    },
    enabled: !!cabinetId && Number.isFinite(advertId) && Number.isFinite(nmId),
    staleTime: 30 * 60_000, // 30min — matches backend cache
    gcTime: 60 * 60_000,
    retry: false,
  })
}
