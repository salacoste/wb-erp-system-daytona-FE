/**
 * Tests for bid-recommendations API
 * Story 86.1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}))

import { apiClient } from '@/lib/api-client'
import { getBidRecommendations, normalizeBidRecommendationsResponse } from '../bid-recommendations'

describe('getBidRecommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls correct endpoint + normalizes the real backend shape (kopecks→rubles)', async () => {
    // iter-70: the REAL backend shape is { base:{competitiveBid:{bidKopecks}}, normQueries }, NOT
    // { recommendations }. The old fabricated mock masked the crash + the kopecks unit bug.
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      advertId: 123,
      nmId: 456,
      base: {
        competitiveBid: { bidKopecks: 5000 },
        leadersBid: { bidKopecks: 8000 },
        top2: { bidKopecks: 12000 },
      },
      normQueries: [],
    })

    const result = await getBidRecommendations('cab-1', 123, 456)

    expect(apiClient.get).toHaveBeenCalledWith(
      '/v1/cabinets/cab-1/campaigns/123/bid-recommendations?nmId=456'
    )
    expect(result.recommendations.competitive).toBe(50) // 5000 kopecks → 50 ₽ (was 5000 raw)
  })

  it('throws on non-finite advertId', async () => {
    await expect(getBidRecommendations('cab-1', NaN, 456)).rejects.toThrow('valid numbers')
  })

  it('throws on non-finite nmId', async () => {
    await expect(getBidRecommendations('cab-1', 123, Infinity)).rejects.toThrow('valid numbers')
  })

  it('propagates API errors', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Not Found'))
    await expect(getBidRecommendations('cab-1', 123, 456)).rejects.toThrow('Not Found')
  })
})

describe('normalizeBidRecommendationsResponse (iter-70 — fixes crash + kopecks)', () => {
  it('maps base.*.bidKopecks → recommendations in rubles (÷100)', () => {
    const r = normalizeBidRecommendationsResponse({
      advertId: 1,
      nmId: 2,
      base: {
        competitiveBid: { bidKopecks: 85800 },
        leadersBid: { bidKopecks: 91100 },
        top2: { bidKopecks: 0 },
      },
      normQueries: [],
    })
    expect(r.recommendations.competitive).toBe(858) // was 85800 raw → 100× inflation
    expect(r.recommendations.leaders).toBe(911)
    expect(r.recommendations.top2).toBe(0) // card renders ≤0 as "—"
  })

  it('maps normQueries → keywords (normQuery→keyword; reach tiers→bids ÷100)', () => {
    const r = normalizeBidRecommendationsResponse({
      advertId: 1,
      nmId: 2,
      base: {},
      normQueries: [
        {
          normQuery: 'эпоксидная смола',
          reachMax: { bidKopecks: 10000 },
          reachMedium: { bidKopecks: 7000 },
          reachMin: { bidKopecks: 5000 },
        },
      ],
    })
    expect(r.keywords).toHaveLength(1)
    expect(r.keywords?.[0]).toMatchObject({
      keyword: 'эпоксидная смола',
      maxBid: 100, // reachMax
      recommendedBid: 70, // reachMedium
      minBid: 50, // reachMin
    })
  })

  it('does NOT crash on missing base/normQueries (the old undefined-recommendations crash)', () => {
    const r = normalizeBidRecommendationsResponse({ advertId: 1, nmId: 2 })
    expect(r.recommendations).toEqual({ competitive: 0, leaders: 0, top2: 0 })
    expect(r.keywords).toEqual([])
  })
})
