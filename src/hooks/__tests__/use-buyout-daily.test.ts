/**
 * Tests for Buyout Daily Trend hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { QueryClient } from '@tanstack/react-query'
import {
  BUYOUT_DAILY_POPULATED,
  BUYOUT_DAILY_FROM,
  BUYOUT_DAILY_TO,
} from '@/test/fixtures/buyout-daily-empty'

vi.mock('@/lib/api/buyout-daily', () => ({
  getBuyoutDailyTrends: vi.fn(),
  buyoutDailyKeys: {
    all: ['buyout-daily'],
    range: (from: string, to: string) => ['buyout-daily', from, to],
  },
  BUYOUT_DAILY_CACHE: { staleTime: 60000, gcTime: 300000 },
}))

import { getBuyoutDailyTrends } from '@/lib/api/buyout-daily'
import { useBuyoutDailyTrends } from '../use-buyout-daily'

const mockedGet = vi.mocked(getBuyoutDailyTrends)
let queryClient: QueryClient

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
})

describe('useBuyoutDailyTrends', () => {
  it('calls getBuyoutDailyTrends with from/to', async () => {
    mockedGet.mockResolvedValueOnce(BUYOUT_DAILY_POPULATED)

    const { result } = renderHook(() => useBuyoutDailyTrends(BUYOUT_DAILY_FROM, BUYOUT_DAILY_TO), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedGet).toHaveBeenCalledWith(BUYOUT_DAILY_FROM, BUYOUT_DAILY_TO)
  })

  it('uses buyoutDailyKeys.range as query key', async () => {
    mockedGet.mockResolvedValueOnce(BUYOUT_DAILY_POPULATED)

    const { result } = renderHook(() => useBuyoutDailyTrends(BUYOUT_DAILY_FROM, BUYOUT_DAILY_TO), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cache = queryClient.getQueryCache().findAll()
    expect(cache[0]?.queryKey).toEqual(['buyout-daily', BUYOUT_DAILY_FROM, BUYOUT_DAILY_TO])
  })

  it('is disabled when from is empty', () => {
    const { result } = renderHook(() => useBuyoutDailyTrends('', BUYOUT_DAILY_TO), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedGet).not.toHaveBeenCalled()
  })

  it('is disabled when to is empty', () => {
    const { result } = renderHook(() => useBuyoutDailyTrends(BUYOUT_DAILY_FROM, ''), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedGet).not.toHaveBeenCalled()
  })

  it('handles API error', async () => {
    mockedGet.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useBuyoutDailyTrends(BUYOUT_DAILY_FROM, BUYOUT_DAILY_TO), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error).toBeInstanceOf(Error)
  })
})
