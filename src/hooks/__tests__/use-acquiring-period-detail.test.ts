/**
 * Unit tests for useAcquiringPeriodDetail — Story 90.1-FE
 *
 * Pattern: renderHook + real authStore (useAuthStore.setState) for selector compat.
 * NOT vi.mocked(useAuthStore).mockReturnValue — that bypasses selector dispatch.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { QueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'

vi.mock('@/lib/api/acquiring-analytics', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/acquiring-analytics')>(
    '@/lib/api/acquiring-analytics'
  )
  return {
    ...actual,
    getAcquiringPeriodDetail: vi.fn(),
  }
})

import { getAcquiringPeriodDetail } from '@/lib/api/acquiring-analytics'
import { useAcquiringPeriodDetail } from '../use-acquiring-period-detail'

const mockedGetAcquiringPeriodDetail = vi.mocked(getAcquiringPeriodDetail)

const MOCK_PERIOD_DETAIL_RESPONSE = {
  data: [
    {
      rrdId: 2001,
      reportId: 99001,
      acqDate: '2026-04-10',
      acquiringBank: 'Тинькофф',
      saleDate: '2026-04-09',
      srid: 'xyz789',
      docTypeName: 'Продажа',
      nmId: 77777,
      retailAmount: 2000.0,
      acquiringFee: 30.0,
      acquiringFeeVat: 6.0,
      currency: 'RUB',
    },
  ],
  cachedAt: '2026-04-13T10:00:00Z',
}

let queryClient: QueryClient

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
})

afterEach(() => {
  useAuthStore.setState({ cabinetId: null })
})

describe('useAcquiringPeriodDetail', () => {
  it('returns data when cabinetId, from, and to are all set', async () => {
    useAuthStore.setState({ cabinetId: 'test-cabinet' })
    mockedGetAcquiringPeriodDetail.mockResolvedValueOnce(MOCK_PERIOD_DETAIL_RESPONSE)

    const { result } = renderHook(() => useAcquiringPeriodDetail('2026-04-01', '2026-04-07'), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedGetAcquiringPeriodDetail).toHaveBeenCalledWith({
      from: '2026-04-01',
      to: '2026-04-07',
    })
    expect(result.current.data?.data).toHaveLength(1)
    expect(result.current.data?.data[0].rrdId).toBe(2001)
    expect(result.current.data?.data[0].acquiringFee).toBe(30.0)
  })

  it('is disabled (fetchStatus idle) when cabinetId is null', () => {
    useAuthStore.setState({ cabinetId: null })

    const { result } = renderHook(() => useAcquiringPeriodDetail('2026-04-01', '2026-04-07'), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedGetAcquiringPeriodDetail).not.toHaveBeenCalled()
  })

  it('is disabled when from is empty string', () => {
    useAuthStore.setState({ cabinetId: 'test-cabinet' })

    const { result } = renderHook(() => useAcquiringPeriodDetail('', '2026-04-07'), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedGetAcquiringPeriodDetail).not.toHaveBeenCalled()
  })
})
