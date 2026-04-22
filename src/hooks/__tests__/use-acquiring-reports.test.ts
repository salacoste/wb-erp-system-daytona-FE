/**
 * Unit tests for useAcquiringReports — Story 90.1-FE
 *
 * Pattern: renderHook + real authStore (useAuthStore.setState) for selector compat.
 * NOT vi.mocked(useAuthStore).mockReturnValue — that bypasses selector dispatch.
 * See Story 92.1 completion notes for rationale.
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
    getAcquiringReports: vi.fn(),
  }
})

import { getAcquiringReports } from '@/lib/api/acquiring-analytics'
import { useAcquiringReports } from '../use-acquiring-reports'

const mockedGetAcquiringReports = vi.mocked(getAcquiringReports)

const MOCK_LIST_RESPONSE = {
  data: [
    {
      reportId: 12345,
      sellerFinanceName: 'ИП Иванов И.И.',
      dateFrom: '2026-04-01',
      dateTo: '2026-04-07',
      createDate: '2026-04-08',
      currency: 'RUB',
      acquiringFeeSum: 450.5,
      acquiringFeeVatSum: 90.1,
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

describe('useAcquiringReports', () => {
  it('returns data when cabinetId, from, and to are all set', async () => {
    useAuthStore.setState({ cabinetId: 'test-cabinet' })
    mockedGetAcquiringReports.mockResolvedValueOnce(MOCK_LIST_RESPONSE)

    const { result } = renderHook(() => useAcquiringReports('2026-04-01', '2026-04-07'), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedGetAcquiringReports).toHaveBeenCalledWith({ from: '2026-04-01', to: '2026-04-07' })
    expect(result.current.data?.data).toHaveLength(1)
    expect(result.current.data?.data[0].reportId).toBe(12345)
    expect(result.current.data?.cachedAt).toBe('2026-04-13T10:00:00Z')
  })

  it('is disabled (fetchStatus idle) when cabinetId is null', () => {
    useAuthStore.setState({ cabinetId: null })

    const { result } = renderHook(() => useAcquiringReports('2026-04-01', '2026-04-07'), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedGetAcquiringReports).not.toHaveBeenCalled()
  })

  it('is disabled when from is empty string', () => {
    useAuthStore.setState({ cabinetId: 'test-cabinet' })

    const { result } = renderHook(() => useAcquiringReports('', '2026-04-07'), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedGetAcquiringReports).not.toHaveBeenCalled()
  })

  it('is disabled when to is empty string', () => {
    useAuthStore.setState({ cabinetId: 'test-cabinet' })

    const { result } = renderHook(() => useAcquiringReports('2026-04-01', ''), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedGetAcquiringReports).not.toHaveBeenCalled()
  })
})
