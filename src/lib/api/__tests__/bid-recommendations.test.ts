/**
 * Tests for bid-recommendations API
 * Story 86.1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}))

import { apiClient } from '@/lib/api-client'
import { getBidRecommendations } from '../bid-recommendations'

describe('getBidRecommendations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls correct endpoint with advertId and nmId', async () => {
    const mock = {
      advertId: 123,
      nmId: 456,
      recommendations: { competitive: 50, leaders: 80, top2: 120 },
    }
    vi.mocked(apiClient.get).mockResolvedValueOnce(mock)

    const result = await getBidRecommendations('cab-1', 123, 456)

    expect(apiClient.get).toHaveBeenCalledWith(
      '/v1/cabinets/cab-1/campaigns/123/bid-recommendations?nmId=456'
    )
    expect(result.recommendations.competitive).toBe(50)
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
