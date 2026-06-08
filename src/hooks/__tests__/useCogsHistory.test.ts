/**
 * Unit tests for useCogsHistory and useCogsAtDate hooks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useCogsHistory, useCogsAtDate } from '../useCogsHistory'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn() },
}))

import { apiClient } from '@/lib/api-client'
const mockGet = vi.mocked(apiClient.get)

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

const mockHistoryResponse = {
  data: [
    {
      id: 'cogs-1',
      nmId: '12345678',
      saName: 'Test Product',
      validFrom: '2025-11-01',
      validTo: null,
      unitCostRub: '500.00',
      currency: 'RUB',
      source: 'manual',
      createdBy: 'user1',
      createdAt: '2025-11-01T10:00:00Z',
      updatedAt: '2025-11-01T10:00:00Z',
      notes: 'Initial COGS',
    },
    {
      id: 'cogs-0',
      nmId: '12345678',
      saName: 'Test Product',
      validFrom: '2025-10-01',
      validTo: '2025-11-01',
      unitCostRub: '450.00',
      currency: 'RUB',
      source: 'import',
      createdBy: 'system',
      createdAt: '2025-10-01T10:00:00Z',
      updatedAt: '2025-10-01T10:00:00Z',
      notes: null,
    },
  ],
  pagination: { cursor: null, hasMore: false },
}

describe('useCogsHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches COGS history for a product', async () => {
    mockGet.mockResolvedValueOnce(mockHistoryResponse)

    const { result } = renderHook(() => useCogsHistory('12345678'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const data = result.current.data!
    expect(data.data).toHaveLength(2)
    expect(data.data[0].id).toBe('cogs-1')
    expect(data.data[0].validTo).toBeNull()
    expect(data.data[1].validTo).toBe('2025-11-01')
    expect(data.pagination?.hasMore).toBe(false)
  })

  it('calls API with correct nm_id parameter', async () => {
    mockGet.mockResolvedValueOnce(mockHistoryResponse)

    renderHook(() => useCogsHistory('12345678'), { wrapper: createWrapper() })

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1))
    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('nm_id=12345678')
    expect(url).toContain('limit=100')
  })

  it('is disabled when nmId is undefined', () => {
    const { result } = renderHook(() => useCogsHistory(undefined), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('handles API error', async () => {
    mockGet.mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useCogsHistory('12345678'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('Server error')
  })

  it('handles empty history response', async () => {
    mockGet.mockResolvedValueOnce({ data: [], pagination: { cursor: null, hasMore: false } })

    const { result } = renderHook(() => useCogsHistory('12345678'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data).toHaveLength(0)
  })
})

describe('useCogsAtDate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches COGS valid at specific date', async () => {
    mockGet.mockResolvedValueOnce(mockHistoryResponse)

    const { result } = renderHook(() => useCogsAtDate('12345678', '2025-11-15'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cogs = result.current.data!
    expect(cogs).not.toBeNull()
    expect(cogs?.id).toBe('cogs-1')
  })

  it('returns null when no COGS found at date', async () => {
    mockGet.mockResolvedValueOnce({ data: [], pagination: {} })

    const { result } = renderHook(() => useCogsAtDate('12345678', '2025-01-01'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })

  it('is disabled when nmId is undefined', () => {
    const { result } = renderHook(() => useCogsAtDate(undefined, '2025-11-15'), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('is disabled when date is undefined', () => {
    const { result } = renderHook(() => useCogsAtDate('12345678', undefined), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('calls API with valid_at parameter', async () => {
    mockGet.mockResolvedValueOnce(mockHistoryResponse)

    renderHook(() => useCogsAtDate('12345678', '2025-11-15'), { wrapper: createWrapper() })

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1))
    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('nm_id=12345678')
    expect(url).toContain('valid_at=2025-11-15')
    expect(url).toContain('limit=1')
  })

  it('handles API error', async () => {
    mockGet.mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useCogsAtDate('12345678', '2025-11-15'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('Server error')
  })
})
