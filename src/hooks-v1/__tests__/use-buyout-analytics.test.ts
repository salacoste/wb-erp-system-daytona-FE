/**
 * Tests for Buyout Analytics hooks
 * Story 72.6-FE: Buyout Hook Migration
 * Epic 72-FE: Marketing Analytics Data Alignment
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { QueryClient } from '@tanstack/react-query'
import {
  BUYOUT_BY_SKU_RESPONSE,
  BUYOUT_SUMMARY_RESPONSE,
  BUYOUT_DATE_FROM,
  BUYOUT_DATE_TO,
} from '@/test/fixtures/buyout-analytics'

vi.mock('@/lib/api/buyout-analytics', () => ({
  getBuyoutBySku: vi.fn(),
  getBuyoutSummary: vi.fn(),
  buyoutQueryKeys: {
    all: ['buyout-analytics'],
    bySku: (params: Record<string, unknown>) => ['buyout-analytics', 'by-sku', params],
    summary: (params: Record<string, unknown>) => ['buyout-analytics', 'summary', params],
  },
  BUYOUT_CACHE: { staleTime: 1500000, gcTime: 3600000 },
}))

import { getBuyoutBySku, getBuyoutSummary } from '@/lib/api/buyout-analytics'
import { useBuyoutBySku, useBuyoutSummary } from '../use-buyout-analytics'

const mockedBySku = vi.mocked(getBuyoutBySku)
const mockedSummary = vi.mocked(getBuyoutSummary)

let queryClient: QueryClient

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
})

describe('useBuyoutBySku', () => {
  it('calls getBuyoutBySku with merged default params', async () => {
    mockedBySku.mockResolvedValueOnce(BUYOUT_BY_SKU_RESPONSE)

    const { result } = renderHook(() => useBuyoutBySku(BUYOUT_DATE_FROM, BUYOUT_DATE_TO), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedBySku).toHaveBeenCalledWith({
      from: BUYOUT_DATE_FROM,
      to: BUYOUT_DATE_TO,
      source: 'blended',
      trend: true,
      limit: 50,
      offset: 0,
    })
  })

  it('uses buyoutQueryKeys.bySku as query key', async () => {
    mockedBySku.mockResolvedValueOnce(BUYOUT_BY_SKU_RESPONSE)

    const { result } = renderHook(() => useBuyoutBySku(BUYOUT_DATE_FROM, BUYOUT_DATE_TO), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cache = queryClient.getQueryCache().findAll()
    expect(cache[0]?.queryKey).toEqual([
      'buyout-analytics',
      'by-sku',
      {
        from: BUYOUT_DATE_FROM,
        to: BUYOUT_DATE_TO,
        source: 'blended',
        trend: true,
        limit: 50,
        offset: 0,
      },
    ])
  })

  it('is disabled when from is empty', () => {
    const { result } = renderHook(() => useBuyoutBySku('', BUYOUT_DATE_TO), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedBySku).not.toHaveBeenCalled()
  })

  it('is disabled when to is empty', () => {
    const { result } = renderHook(() => useBuyoutBySku(BUYOUT_DATE_FROM, ''), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedBySku).not.toHaveBeenCalled()
  })

  it('overrides defaults with user params', async () => {
    mockedBySku.mockResolvedValueOnce(BUYOUT_BY_SKU_RESPONSE)

    renderHook(
      () =>
        useBuyoutBySku(BUYOUT_DATE_FROM, BUYOUT_DATE_TO, {
          limit: 25,
          offset: 50,
          sort: 'salesCount',
        }),
      { wrapper: createQueryWrapper(queryClient) }
    )

    await waitFor(() => expect(mockedBySku).toHaveBeenCalled())
    expect(mockedBySku).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 25, offset: 50, sort: 'salesCount' })
    )
  })

  it('handles API error', async () => {
    mockedBySku.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useBuyoutBySku(BUYOUT_DATE_FROM, BUYOUT_DATE_TO), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error).toBeInstanceOf(Error)
  })
})

describe('useBuyoutSummary', () => {
  it('calls getBuyoutSummary with from/to/source', async () => {
    mockedSummary.mockResolvedValueOnce(BUYOUT_SUMMARY_RESPONSE)

    const { result } = renderHook(
      () => useBuyoutSummary(BUYOUT_DATE_FROM, BUYOUT_DATE_TO, 'weekly'),
      { wrapper: createQueryWrapper(queryClient) }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedSummary).toHaveBeenCalledWith({
      from: BUYOUT_DATE_FROM,
      to: BUYOUT_DATE_TO,
      source: 'weekly',
    })
  })

  it('uses buyoutQueryKeys.summary as query key', async () => {
    mockedSummary.mockResolvedValueOnce(BUYOUT_SUMMARY_RESPONSE)

    const { result } = renderHook(() => useBuyoutSummary(BUYOUT_DATE_FROM, BUYOUT_DATE_TO), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cache = queryClient.getQueryCache().findAll()
    expect(cache[0]?.queryKey).toEqual([
      'buyout-analytics',
      'summary',
      { from: BUYOUT_DATE_FROM, to: BUYOUT_DATE_TO, source: undefined },
    ])
  })

  it('is disabled when from is empty', () => {
    const { result } = renderHook(() => useBuyoutSummary('', BUYOUT_DATE_TO), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedSummary).not.toHaveBeenCalled()
  })

  it('is disabled when to is empty', () => {
    const { result } = renderHook(() => useBuyoutSummary(BUYOUT_DATE_FROM, ''), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedSummary).not.toHaveBeenCalled()
  })

  it('handles API error', async () => {
    mockedSummary.mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useBuyoutSummary(BUYOUT_DATE_FROM, BUYOUT_DATE_TO), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error).toBeInstanceOf(Error)
  })
})
