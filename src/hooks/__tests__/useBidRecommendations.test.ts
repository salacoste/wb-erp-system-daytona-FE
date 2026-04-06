/**
 * Tests for useBidRecommendations hook — Story 86.1
 * Covers: validNmId guard, success path, rate limit toast, generic error path
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithClient } from '@/test/test-utils'
import { ApiError } from '@/types/api'
import { useBidRecommendations, bidRecommendationsKeys } from '../useBidRecommendations'

vi.mock('@/lib/api/bid-recommendations', () => ({
  getBidRecommendations: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

import { getBidRecommendations } from '@/lib/api/bid-recommendations'
import { toast } from 'sonner'

const mockResponse = {
  advertId: 123,
  nmId: 456,
  recommendations: { competitive: 50, leaders: 80, top2: 120 },
  cachedAt: '2026-04-06T10:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useBidRecommendations', () => {
  it('fetches recommendations when cabinetId, advertId, and nmId are valid', async () => {
    vi.mocked(getBidRecommendations).mockResolvedValueOnce(mockResponse)

    const { result } = renderHookWithClient(() => useBidRecommendations('cab-1', 123, 456))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockResponse)
    expect(getBidRecommendations).toHaveBeenCalledWith('cab-1', 123, 456)
  })

  it('does not fetch when nmId is undefined', () => {
    const { result } = renderHookWithClient(() => useBidRecommendations('cab-1', 123, undefined))

    expect(result.current.isFetching).toBe(false)
    expect(getBidRecommendations).not.toHaveBeenCalled()
  })

  it('does not fetch when nmId is zero', () => {
    const { result } = renderHookWithClient(() => useBidRecommendations('cab-1', 123, 0))

    expect(result.current.isFetching).toBe(false)
    expect(getBidRecommendations).not.toHaveBeenCalled()
  })

  it('does not fetch when nmId is negative', () => {
    const { result } = renderHookWithClient(() => useBidRecommendations('cab-1', 123, -5))

    expect(result.current.isFetching).toBe(false)
    expect(getBidRecommendations).not.toHaveBeenCalled()
  })

  it('does not fetch when cabinetId is empty', () => {
    const { result } = renderHookWithClient(() => useBidRecommendations('', 123, 456))

    expect(result.current.isFetching).toBe(false)
    expect(getBidRecommendations).not.toHaveBeenCalled()
  })

  it('does not fetch when advertId is NaN', () => {
    const { result } = renderHookWithClient(() => useBidRecommendations('cab-1', NaN, 456))

    expect(result.current.isFetching).toBe(false)
    expect(getBidRecommendations).not.toHaveBeenCalled()
  })

  it('shows rate limit toast when API returns 429 (AC #4)', async () => {
    vi.mocked(getBidRecommendations).mockRejectedValueOnce(new ApiError('Too Many Requests', 429))

    const { result } = renderHookWithClient(() => useBidRecommendations('cab-1', 123, 456))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith(
      'Превышен лимит запросов. Повторите через несколько минут'
    )
  })

  it('does NOT show rate limit toast for non-429 errors', async () => {
    vi.mocked(getBidRecommendations).mockRejectedValueOnce(
      new ApiError('Internal Server Error', 500)
    )

    const { result } = renderHookWithClient(() => useBidRecommendations('cab-1', 123, 456))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('does NOT show rate limit toast for generic Error (non-ApiError)', async () => {
    vi.mocked(getBidRecommendations).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHookWithClient(() => useBidRecommendations('cab-1', 123, 456))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('does not retry on error (retry: false)', async () => {
    vi.mocked(getBidRecommendations).mockRejectedValueOnce(new ApiError('Not Found', 404))

    const { result } = renderHookWithClient(() => useBidRecommendations('cab-1', 123, 456))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(getBidRecommendations).toHaveBeenCalledTimes(1)
  })
})

describe('bidRecommendationsKeys', () => {
  it('has correct base key', () => {
    expect(bidRecommendationsKeys.all).toEqual(['bid-recommendations'])
  })

  it('generates byParams key with advertId and nmId', () => {
    expect(bidRecommendationsKeys.byParams(123, 456)).toEqual(['bid-recommendations', 123, 456])
  })
})
