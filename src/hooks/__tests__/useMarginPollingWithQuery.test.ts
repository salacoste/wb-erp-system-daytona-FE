/**
 * Unit tests for useMarginPollingWithQuery hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useMarginPollingWithQuery } from '../useMarginPollingWithQuery'
import { DEFAULT_POLLING_STRATEGY } from '../margin-polling-types'

// Mock the child hooks and modules
vi.mock('@/lib/api', () => ({
  getMarginCalculationStatus: vi.fn(),
}))

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { getMarginCalculationStatus } from '@/lib/api'
import { apiClient } from '@/lib/api-client'

const mockGetStatus = vi.mocked(getMarginCalculationStatus)
const mockApiClientGet = vi.mocked(apiClient.get)

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

function createDefaultOptions() {
  return {
    nmId: '12345',
    enabled: true,
    strategy: { ...DEFAULT_POLLING_STRATEGY },
    onSuccess: vi.fn(),
    onTimeout: vi.fn(),
    onError: vi.fn(),
  }
}

describe('useMarginPollingWithQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns initial state when disabled', () => {
    const options = { ...createDefaultOptions(), enabled: false }

    const { result } = renderHook(() => useMarginPollingWithQuery(options), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPolling).toBe(false)
    expect(result.current.margin).toBeNull()
    expect(result.current.timeout).toBe(false)
    expect(result.current.attempts).toBe(0)
    expect(result.current.completedWithoutMargin).toBe(false)
  })

  it('returns initial state when nmId is empty', () => {
    const options = { ...createDefaultOptions(), nmId: '' }

    const { result } = renderHook(() => useMarginPollingWithQuery(options), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPolling).toBe(false)
  })

  it('starts polling when enabled with valid nmId', async () => {
    // Return pending first, then completed with margin
    mockGetStatus
      .mockResolvedValueOnce({ status: 'pending' })
      .mockResolvedValueOnce({ status: 'completed' })

    // Product fetch for completed status
    mockApiClientGet.mockResolvedValueOnce({
      current_margin_pct: 42.5,
      missing_data_reason: null,
    })

    const options = createDefaultOptions()
    renderHook(() => useMarginPollingWithQuery(options), {
      wrapper: createWrapper(),
    })

    // Wait for at least one fetch
    await waitFor(() => expect(mockGetStatus).toHaveBeenCalled(), { timeout: 3000 })
  })

  it('calls onSuccess when margin is found', async () => {
    mockGetStatus.mockResolvedValue({ status: 'completed' })
    mockApiClientGet.mockResolvedValue({
      current_margin_pct: 55.0,
      missing_data_reason: null,
    })

    const onSuccess = vi.fn()
    const options = { ...createDefaultOptions(), onSuccess }

    renderHook(() => useMarginPollingWithQuery(options), {
      wrapper: createWrapper(),
    })

    // Wait for query to complete and margin to be set
    await waitFor(() => expect(mockGetStatus).toHaveBeenCalledWith('12345'), { timeout: 3000 })
  })

  it('sets completedWithoutMargin when no margin data available', async () => {
    mockGetStatus.mockResolvedValue({ status: 'completed' })
    mockApiClientGet.mockResolvedValue({
      current_margin_pct: null,
      missing_data_reason: 'no_sales_data',
    })

    const options = createDefaultOptions()
    const { result } = renderHook(() => useMarginPollingWithQuery(options), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.completedWithoutMargin).toBe(true), { timeout: 5000 })
  })

  it('resets state when nmId changes', async () => {
    mockGetStatus.mockResolvedValue({ status: 'pending' })

    const options = createDefaultOptions()
    const { result, rerender } = renderHook(
      (opts: typeof options) => useMarginPollingWithQuery(opts),
      { wrapper: createWrapper(), initialProps: options }
    )

    // Change nmId
    const newOptions = { ...createDefaultOptions(), nmId: '99999' }
    rerender(newOptions)

    // After nmId change, attempts should reset
    expect(result.current.attempts).toBe(0)
    expect(result.current.margin).toBeNull()
    expect(result.current.timeout).toBe(false)
  })

  it('resets state when disabled', () => {
    const options = createDefaultOptions()
    const { result, rerender } = renderHook(
      (opts: typeof options) => useMarginPollingWithQuery(opts),
      { wrapper: createWrapper(), initialProps: options }
    )

    // Disable polling
    rerender({ ...options, enabled: false })

    expect(result.current.isPolling).toBe(false)
    expect(result.current.attempts).toBe(0)
  })

  it('reports error when queryFn throws', async () => {
    mockGetStatus.mockRejectedValue(new Error('Failed'))

    const onError = vi.fn()
    const options = { ...createDefaultOptions(), onError }

    const { result } = renderHook(() => useMarginPollingWithQuery(options), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.error).toBeTruthy(), { timeout: 5000 })
  })
})
