/**
 * Bid Recommendations API
 * GET /v1/cabinets/:id/campaigns/:advertId/bid-recommendations?nmId=X
 * Story 86.1: Campaign bid optimization
 */

import { apiClient } from '../api-client'
import type { BidRecommendationsResponse } from '@/types/bid-recommendations'

/** Fetch bid recommendations for a campaign + SKU pair */
export async function getBidRecommendations(
  cabinetId: string,
  advertId: number,
  nmId: number
): Promise<BidRecommendationsResponse> {
  if (!Number.isFinite(advertId) || !Number.isFinite(nmId)) {
    throw new Error('advertId and nmId must be valid numbers')
  }
  const params = new URLSearchParams({ nmId: String(nmId) })
  return apiClient.get<BidRecommendationsResponse>(
    `/v1/cabinets/${cabinetId}/campaigns/${advertId}/bid-recommendations?${params}`
  )
}
