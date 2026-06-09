/**
 * Unit tests for useSingleCogsAssignment hook
 * Tests: mutation success/error, cache invalidation, logging
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useSingleCogsAssignment } from '../useSingleCogsAssignment'

vi.mock('@/lib/api-client', () => ({
  apiClient: { post: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn() },
}))

import { apiClient } from '@/lib/api-client'
import { logger } from '@/lib/logger'

const mockPost = vi.mocked(apiClient.post)
const mockDebug = vi.mocked(logger.debug)
const mockError = vi.mocked(logger.error)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

const mockProductResponse = {
  nm_id: '12345',
  has_cogs: true,
  cogs: { id: 'cogs-1' },
  current_margin_pct: 15.5,
  missing_data_reason: null,
}

describe('useSingleCogsAssignment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls POST endpoint with nmId and COGS data', async () => {
    mockPost.mockResolvedValueOnce(mockProductResponse)

    const { result } = renderHook(() => useSingleCogsAssignment(), { wrapper: createWrapper() })

    const params = {
      nmId: '12345',
      cogs: { unit_cost_rub: 500, valid_from: '2025-01-01', source: 'manual' as const },
    }

    await act(async () => {
      result.current.mutate(params)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockPost).toHaveBeenCalledWith('/v1/products/12345/cogs', params.cogs)
  })

  it('returns product data on success', async () => {
    mockPost.mockResolvedValueOnce(mockProductResponse)

    const { result } = renderHook(() => useSingleCogsAssignment(), { wrapper: createWrapper() })

    result.current.mutate({
      nmId: '12345',
      cogs: { unit_cost_rub: 500, valid_from: '2025-01-01', source: 'manual' },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockProductResponse)
  })

  it('invalidates product, analytics, and dashboard queries on success', async () => {
    mockPost.mockResolvedValueOnce(mockProductResponse)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useSingleCogsAssignment(), { wrapper })

    result.current.mutate({
      nmId: '12345',
      cogs: { unit_cost_rub: 500, valid_from: '2025-01-01', source: 'manual' },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['products'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['products', '12345'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['analytics'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['dashboard'] })
  })

  it('logs debug messages on success', async () => {
    mockPost.mockResolvedValueOnce(mockProductResponse)

    const { result } = renderHook(() => useSingleCogsAssignment(), { wrapper: createWrapper() })

    result.current.mutate({
      nmId: '12345',
      cogs: { unit_cost_rub: 500, valid_from: '2025-01-01', source: 'manual' },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockDebug).toHaveBeenCalled()
    // Pre-mutation log + post-mutation log + margin log
    const debugCalls = mockDebug.mock.calls.map(c => c[0] as string)
    expect(debugCalls.some(msg => msg.includes('COGS Assignment'))).toBe(true)
  })

  it('logs margin percentage on success', async () => {
    mockPost.mockResolvedValueOnce(mockProductResponse)

    const { result } = renderHook(() => useSingleCogsAssignment(), { wrapper: createWrapper() })

    result.current.mutate({
      nmId: '12345',
      cogs: { unit_cost_rub: 500, valid_from: '2025-01-01', source: 'manual' },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const marginLog = mockDebug.mock.calls.find(
      c => typeof c[0] === 'string' && c[0].includes('Margin')
    )
    expect(marginLog).toBeTruthy()
  })

  it('logs missing_data_reason when margin is null', async () => {
    mockPost.mockResolvedValueOnce({
      ...mockProductResponse,
      current_margin_pct: null,
      missing_data_reason: 'calculation_in_progress',
    })

    const { result } = renderHook(() => useSingleCogsAssignment(), { wrapper: createWrapper() })

    result.current.mutate({
      nmId: '12345',
      cogs: { unit_cost_rub: 500, valid_from: '2025-01-01', source: 'manual' },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const notAvailableLog = mockDebug.mock.calls.find(
      c => typeof c[0] === 'string' && c[0].includes('Not available')
    )
    expect(notAvailableLog).toBeTruthy()
  })

  it('logs error and sets isError on failure', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useSingleCogsAssignment(), { wrapper: createWrapper() })

    result.current.mutate({
      nmId: '12345',
      cogs: { unit_cost_rub: 500, valid_from: '2025-01-01', source: 'manual' },
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockError).toHaveBeenCalled()
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('sets isPending during mutation', async () => {
    let resolvePost: (v: unknown) => void
    mockPost.mockImplementation(
      () =>
        new Promise(resolve => {
          resolvePost = resolve
        })
    )

    const { result } = renderHook(() => useSingleCogsAssignment(), { wrapper: createWrapper() })

    result.current.mutate({
      nmId: '12345',
      cogs: { unit_cost_rub: 500, valid_from: '2025-01-01', source: 'manual' },
    })

    await waitFor(() => expect(result.current.isPending).toBe(true))

    await act(async () => {
      resolvePost!(mockProductResponse)
    })

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.isSuccess).toBe(true)
  })

  it('handles missing_data_reason without margin (null+NaN guard)', async () => {
    mockPost.mockResolvedValueOnce({
      ...mockProductResponse,
      current_margin_pct: NaN,
    })

    const { result } = renderHook(() => useSingleCogsAssignment(), { wrapper: createWrapper() })

    result.current.mutate({
      nmId: '12345',
      cogs: { unit_cost_rub: 500, valid_from: '2025-01-01', source: 'manual' },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // NaN is not finite — should not crash the margin log path
    expect(result.current.isSuccess).toBe(true)
  })
})
