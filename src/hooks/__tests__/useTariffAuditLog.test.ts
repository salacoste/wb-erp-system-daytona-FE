/**
 * Unit tests for useTariffAuditLog hook
 * Tests: success/loading/error, params, placeholderData
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useTariffAuditLog } from '../useTariffAuditLog'
import type { TariffAuditResponse, TariffAuditEntry } from '@/types/tariffs-admin'

vi.mock('@/lib/api/tariffs-admin', () => ({
  getTariffAuditLog: vi.fn(),
}))

vi.mock('@/hooks/tariff-query-keys', () => ({
  tariffQueryKeys: {
    all: ['tariffs'],
    auditLog: (params?: Record<string, unknown>) => ['tariffs', 'audit', params],
  },
}))

import { getTariffAuditLog } from '@/lib/api/tariffs-admin'

const mockGetAuditLog = vi.mocked(getTariffAuditLog)

const mockEntry: TariffAuditEntry = {
  id: 1,
  action: 'UPDATE',
  field_name: 'acceptanceBoxRatePerLiter',
  old_value: '10',
  new_value: '12',
  user_id: 'user-1',
  user_email: 'admin@test.com',
  ip_address: '127.0.0.1',
  created_at: '2025-01-15T10:00:00Z',
}

const mockResponse: TariffAuditResponse = {
  data: [mockEntry],
  meta: { page: 1, limit: 50, total: 1, total_pages: 1 },
}

describe('useTariffAuditLog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createWrapper() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    })
    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children)
  }

  it('fetches audit log with default empty params', async () => {
    mockGetAuditLog.mockResolvedValueOnce(mockResponse)
    const { result } = renderHook(() => useTariffAuditLog(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetAuditLog).toHaveBeenCalledWith({})
    expect(result.current.data).toEqual(mockResponse)
  })

  it('fetches audit log with pagination params', async () => {
    mockGetAuditLog.mockResolvedValueOnce(mockResponse)
    const params = { page: 2, limit: 25 }
    const { result } = renderHook(() => useTariffAuditLog(params), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetAuditLog).toHaveBeenCalledWith(params)
  })

  it('fetches audit log with field_name filter', async () => {
    mockGetAuditLog.mockResolvedValueOnce(mockResponse)
    const params = { field_name: 'acceptanceBoxRatePerLiter' }
    const { result } = renderHook(() => useTariffAuditLog(params), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetAuditLog).toHaveBeenCalledWith(params)
  })

  it('is loading before fetch completes', async () => {
    let resolveLoading: (v: unknown) => void
    mockGetAuditLog.mockImplementationOnce(
      () =>
        new Promise((resolve: (v: unknown) => void) => {
          resolveLoading = resolve
        }) as unknown as ReturnType<typeof getTariffAuditLog>
    )
    const { result } = renderHook(() => useTariffAuditLog({ field_name: '__loading_test__' }), {
      wrapper: createWrapper(),
    })
    expect(result.current.isLoading).toBe(true)
    // Resolve to avoid leaking promise
    await act(async () => {
      resolveLoading!(mockResponse)
    })
  })

  it('returns entries array from response data', async () => {
    const multiEntryResponse: TariffAuditResponse = {
      data: [
        mockEntry,
        { ...mockEntry, id: 2, action: 'CREATE' as const },
        { ...mockEntry, id: 3, action: 'DELETE' as const },
      ],
      meta: { page: 1, limit: 50, total: 3, total_pages: 1 },
    }
    mockGetAuditLog.mockResolvedValueOnce(multiEntryResponse)
    const { result } = renderHook(() => useTariffAuditLog({ field_name: '__entries_test__' }), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.data).toHaveLength(3)
  })

  it('handles empty audit log response', async () => {
    const emptyResponse: TariffAuditResponse = {
      data: [],
      meta: { page: 1, limit: 50, total: 0, total_pages: 0 },
    }
    mockGetAuditLog.mockResolvedValueOnce(emptyResponse)
    const { result } = renderHook(() => useTariffAuditLog({ field_name: '__empty_test__' }), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.data).toEqual([])
    expect(result.current.data?.meta.total).toBe(0)
  })

  it('preserves previous data while loading next page (placeholderData)', async () => {
    const page1Response: TariffAuditResponse = {
      data: [mockEntry],
      meta: { page: 1, limit: 50, total: 100, total_pages: 2 },
    }

    mockGetAuditLog.mockResolvedValueOnce(page1Response)
    const { result, rerender } = renderHook(({ page }) => useTariffAuditLog({ page, limit: 50 }), {
      wrapper: createWrapper(),
      initialProps: { page: 1 },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.meta.page).toBe(1)

    // Trigger page 2 fetch (never resolves so placeholder stays active)
    mockGetAuditLog.mockImplementationOnce(() => new Promise(() => {}))
    rerender({ page: 2 })

    // While page 2 loads, placeholderData keeps page 1 visible
    expect(result.current.data?.meta.page).toBe(1)
    expect(result.current.isPlaceholderData).toBe(true)
  })

  // Error test placed last to avoid mock leakage to subsequent tests
  it('returns error state on fetch failure', async () => {
    mockGetAuditLog.mockRejectedValueOnce(new Error('Server error'))
    const { result } = renderHook(() => useTariffAuditLog({ field_name: '__error_test__' }), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error).toBeTruthy()
  })
})
