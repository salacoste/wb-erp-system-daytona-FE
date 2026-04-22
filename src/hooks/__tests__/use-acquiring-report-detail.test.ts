/**
 * Unit tests for useAcquiringReportDetail — Story 90.1-FE
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
    getAcquiringReportDetail: vi.fn(),
  }
})

import { getAcquiringReportDetail } from '@/lib/api/acquiring-analytics'
import { useAcquiringReportDetail } from '../use-acquiring-report-detail'

const mockedGetAcquiringReportDetail = vi.mocked(getAcquiringReportDetail)

const MOCK_DETAIL_RESPONSE = {
  data: [
    {
      rrdId: 1001,
      reportId: 12345,
      acqDate: '2026-04-05',
      acquiringBank: 'Сбербанк',
      saleDate: '2026-04-04',
      srid: 'abc123',
      docTypeName: 'Продажа',
      nmId: 55555,
      retailAmount: 1500.5,
      acquiringFee: 22.5,
      acquiringFeeVat: 4.5,
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

describe('useAcquiringReportDetail', () => {
  it('returns data when cabinetId and reportId are both set', async () => {
    useAuthStore.setState({ cabinetId: 'test-cabinet' })
    mockedGetAcquiringReportDetail.mockResolvedValueOnce(MOCK_DETAIL_RESPONSE)

    const { result } = renderHook(() => useAcquiringReportDetail(12345), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedGetAcquiringReportDetail).toHaveBeenCalledWith({ reportId: 12345 })
    expect(result.current.data?.data).toHaveLength(1)
    expect(result.current.data?.data[0].rrdId).toBe(1001)
    expect(result.current.data?.data[0].acquiringFee).toBe(22.5)
  })

  it('is disabled (fetchStatus idle) when cabinetId is null', () => {
    useAuthStore.setState({ cabinetId: null })

    const { result } = renderHook(() => useAcquiringReportDetail(12345), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedGetAcquiringReportDetail).not.toHaveBeenCalled()
  })

  it('is disabled when reportId is null', () => {
    useAuthStore.setState({ cabinetId: 'test-cabinet' })

    const { result } = renderHook(() => useAcquiringReportDetail(null), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedGetAcquiringReportDetail).not.toHaveBeenCalled()
  })
})
