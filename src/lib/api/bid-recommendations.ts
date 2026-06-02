/**
 * Bid Recommendations API
 * GET /v1/cabinets/:id/campaigns/:advertId/bid-recommendations?nmId=X
 * Story 86.1: Campaign bid optimization
 */

import { apiClient } from '../api-client'
import type { BidRecommendationsResponse } from '@/types/bid-recommendations'

/**
 * kopecks → rubles. iter-70: the backend returns bid values as `{ bidKopecks: <int kopecks> }`
 * (BidValueDto, e.g. 85800 = 858 ₽). Feeding the raw kopecks to formatCurrency inflated the price
 * 100×. Missing/invalid → 0 (the card renders ≤0 as "—").
 * NOTE: the card is display-only today. Any future bid-APPLY flow MUST convert the displayed
 * rubles ×100 back to kopecks before POSTing, or the backend (expecting kopecks) gets a 100×-low bid.
 */
function kopecksToRubles(raw: unknown): number {
  const k = (raw as { bidKopecks?: unknown } | null)?.bidKopecks
  return typeof k === 'number' && Number.isFinite(k) ? k / 100 : 0
}

/**
 * Boundary normalizer (iter-70): the backend shape is
 *   { advertId, nmId, base: { competitiveBid, leadersBid, top2 }, normQueries: [{ normQuery, reachMax, reachMedium, reachMin }] }
 * with all bids in kopecks — NOT the FE-canonical { recommendations:{competitive,leaders,top2}, keywords[] }.
 * The old code typed the raw response as BidRecommendationsResponse with NO transform → `recommendations`
 * was undefined → BidRecommendationsCard crashed reading `recommendations.competitive`. Confirmed against
 * src/cabinets/dto/bid-recommendation-response.dto.ts + a live 200 response.
 */
export function normalizeBidRecommendationsResponse(raw: unknown): BidRecommendationsResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const base = (r.base ?? {}) as Record<string, unknown>
  const normQueries = Array.isArray(r.normQueries) ? r.normQueries : []
  return {
    advertId: Number(r.advertId ?? 0),
    nmId: Number(r.nmId ?? 0),
    recommendations: {
      competitive: kopecksToRubles(base.competitiveBid),
      leaders: kopecksToRubles(base.leadersBid),
      top2: kopecksToRubles(base.top2),
    },
    keywords: normQueries.map(q => {
      const nq = (q ?? {}) as Record<string, unknown>
      return {
        keyword: String(nq.normQuery ?? ''),
        // backend reach tiers: max=widest reach, medium=balanced (recommended), min=narrowest.
        minBid: kopecksToRubles(nq.reachMin),
        maxBid: kopecksToRubles(nq.reachMax),
        recommendedBid: kopecksToRubles(nq.reachMedium),
      }
    }),
  }
}

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
  const raw = await apiClient.get<unknown>(
    `/v1/cabinets/${cabinetId}/campaigns/${advertId}/bid-recommendations?${params}`
  )
  return normalizeBidRecommendationsResponse(raw)
}
