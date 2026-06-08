/**
 * Unit tests for useMarginPollingCallbacks hook (queryFn builder)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useMarginPollingQueryFn } from '../useMarginPollingCallbacks'
import { ApiError } from '@/types/api'

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

function createDefaultRefs() {
  return {
    marginRef: { current: null as number | null },
    errorRef: { current: null as Error | null },
    isFirstAttemptRef: { current: true },
    onErrorRef: { current: undefined as ((error: Error) => void) | undefined },
    setCompletedWithoutMargin: vi.fn(),
  }
}

describe('useMarginPollingQueryFn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws when nmId is empty', () => {
    const refs = createDefaultRefs()
    const { result } = renderHook(() => useMarginPollingQueryFn('', false, refs), {
      wrapper: createWrapper(),
    })

    expect(() => result.current()).rejects.toThrow('Polling disabled')
  })

  it('throws when enabled is false', () => {
    const refs = createDefaultRefs()
    const { result } = renderHook(() => useMarginPollingQueryFn('12345', false, refs), {
      wrapper: createWrapper(),
    })

    expect(() => result.current()).rejects.toThrow('Polling disabled')
  })

  it('returns pending status when calculation is pending', async () => {
    mockGetStatus.mockResolvedValueOnce({ status: 'pending' })

    const refs = createDefaultRefs()
    const { result } = renderHook(() => useMarginPollingQueryFn('12345', true, refs), {
      wrapper: createWrapper(),
    })

    const response = await result.current()
    expect(response.status).toBe('pending')
  })

  it('returns in_progress status without stopping', async () => {
    mockGetStatus.mockResolvedValueOnce({ status: 'in_progress' })

    const refs = createDefaultRefs()
    const { result } = renderHook(() => useMarginPollingQueryFn('12345', true, refs), {
      wrapper: createWrapper(),
    })

    const response = await result.current()
    expect(response.status).toBe('in_progress')
  })

  it('handles completed status with margin available', async () => {
    mockGetStatus.mockResolvedValueOnce({ status: 'completed' })
    // Fallback product fetch returns product with margin
    mockApiClientGet.mockResolvedValueOnce({
      current_margin_pct: 45.5,
      missing_data_reason: null,
    })

    const refs = createDefaultRefs()
    const { result } = renderHook(() => useMarginPollingQueryFn('12345', true, refs), {
      wrapper: createWrapper(),
    })

    const response = await result.current()
    expect(response.status).toBe('completed')
    expect(refs.marginRef.current).toBe(45.5)
    expect(refs.setCompletedWithoutMargin).toHaveBeenCalledWith(false)
  })

  it('handles completed status without margin data', async () => {
    mockGetStatus.mockResolvedValueOnce({ status: 'completed' })
    // Product fetch returns product without margin
    mockApiClientGet.mockResolvedValueOnce({
      current_margin_pct: null,
      missing_data_reason: 'no_sales_data',
    })

    const refs = createDefaultRefs()
    const { result } = renderHook(() => useMarginPollingQueryFn('12345', true, refs), {
      wrapper: createWrapper(),
    })

    const response = await result.current()
    expect(response.status).toBe('completed')
    expect(refs.marginRef.current).toBeNull()
    expect(refs.setCompletedWithoutMargin).toHaveBeenCalledWith(true)
  })

  it('handles failed status by throwing error', async () => {
    mockGetStatus.mockResolvedValueOnce({ status: 'failed', error: 'Calculation error' })

    const onError = vi.fn()
    const refs = {
      ...createDefaultRefs(),
      onErrorRef: { current: onError },
    }

    const { result } = renderHook(() => useMarginPollingQueryFn('12345', true, refs), {
      wrapper: createWrapper(),
    })

    await expect(() => result.current()).rejects.toThrow('Calculation error')
    expect(refs.errorRef.current).toBeInstanceOf(Error)
    expect(onError).toHaveBeenCalledWith(expect.any(Error))
  })

  it('handles not_found on first attempt (retries)', async () => {
    mockGetStatus.mockResolvedValueOnce({ status: 'not_found' })

    const refs = createDefaultRefs()
    const { result } = renderHook(() => useMarginPollingQueryFn('12345', true, refs), {
      wrapper: createWrapper(),
    })

    const response = await result.current()
    // First attempt should retry
    expect(response.status).toBe('not_found')
    expect(refs.isFirstAttemptRef.current).toBe(false)
  })

  it('handles not_found on second attempt (throws)', async () => {
    mockGetStatus.mockResolvedValueOnce({ status: 'not_found' })

    const onError = vi.fn()
    const refs = {
      ...createDefaultRefs(),
      isFirstAttemptRef: { current: false },
      onErrorRef: { current: onError },
    }

    const { result } = renderHook(() => useMarginPollingQueryFn('12345', true, refs), {
      wrapper: createWrapper(),
    })

    await expect(() => result.current()).rejects.toThrow('not found')
    expect(onError).toHaveBeenCalledWith(expect.any(Error))
  })

  it('falls back to product fetch on 404 from margin-status', async () => {
    const apiError = new ApiError('Not found', 404)
    mockGetStatus.mockRejectedValueOnce(apiError)
    // Fallback returns completed when product has margin
    mockApiClientGet.mockResolvedValueOnce({ current_margin_pct: 30 })

    const refs = createDefaultRefs()
    const { result } = renderHook(() => useMarginPollingQueryFn('12345', true, refs), {
      wrapper: createWrapper(),
    })

    const response = await result.current()
    // fetchProductMarginFallback returns {status: 'completed'} when margin is present
    // but does NOT set marginRef (that's done in handleCompletedStatus which isn't called here)
    expect(response.status).toBe('completed')
  })

  it('re-throws non-404 errors from margin-status', async () => {
    const apiError = new ApiError('Internal error', 500)
    mockGetStatus.mockRejectedValueOnce(apiError)

    const refs = createDefaultRefs()
    const { result } = renderHook(() => useMarginPollingQueryFn('12345', true, refs), {
      wrapper: createWrapper(),
    })

    await expect(() => result.current()).rejects.toThrow('Internal error')
  })

  it('handles orphan product (product fetch also fails)', async () => {
    const apiError = new ApiError('Not found', 404)
    mockGetStatus.mockRejectedValueOnce(apiError)
    // Product fetch also fails (orphan)
    mockApiClientGet.mockRejectedValueOnce(new Error('Product not found'))

    const refs = createDefaultRefs()
    const { result } = renderHook(() => useMarginPollingQueryFn('12345', true, refs), {
      wrapper: createWrapper(),
    })

    // Should mark as completed (orphan)
    const response = await result.current()
    expect(response.status).toBe('completed')
  })
})
