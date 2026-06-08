/**
 * Unit tests for useSingleCogsAssignmentWithPolling hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useSingleCogsAssignmentWithPolling } from '../useSingleCogsAssignmentWithPolling'

// Mock all dependencies
vi.mock('../useSingleCogsAssignment', () => ({
  useSingleCogsAssignment: vi.fn(),
}))

vi.mock('../useMarginPollingWithQuery', () => ({
  useMarginPollingWithQuery: vi.fn(),
}))

vi.mock('../useCogsMutationHandlers', () => ({
  usePollingHandlers: vi.fn(),
  invalidateProductQueries: vi.fn(),
}))

vi.mock('@/lib/margin-helpers', () => ({
  getPollingStrategy: vi.fn(),
}))

vi.mock('@/lib/utils', () => ({
  formatPercentage: vi.fn((v: number) => `${v}%`),
}))

vi.mock('@/stores/marginPollingStore', () => ({
  useMarginPollingStore: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn() },
}))

import { useSingleCogsAssignment } from '../useSingleCogsAssignment'
import { useMarginPollingWithQuery } from '../useMarginPollingWithQuery'
import { usePollingHandlers } from '../useCogsMutationHandlers'
import { getPollingStrategy } from '@/lib/margin-helpers'
import { useMarginPollingStore } from '@/stores/marginPollingStore'

const mockUseAssignment = vi.mocked(useSingleCogsAssignment)
const mockUsePolling = vi.mocked(useMarginPollingWithQuery)
const mockUseHandlers = vi.mocked(usePollingHandlers)
const mockGetStrategy = vi.mocked(getPollingStrategy)

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('useSingleCogsAssignmentWithPolling', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations
    const mockMutate = vi.fn()
    const mockInvalidate = vi.fn().mockResolvedValue(undefined)
    mockUseAssignment.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
      data: null,
    } as unknown as ReturnType<typeof useSingleCogsAssignment>)

    mockUseHandlers.mockReturnValue({
      queryClient: {
        invalidateQueries: mockInvalidate,
        refetchQueries: vi.fn().mockResolvedValue(undefined),
      } as unknown as import('@tanstack/react-query').QueryClient,
      handlePollingSuccess: vi.fn(),
      handlePollingTimeout: vi.fn(),
      handlePollingError: vi.fn(),
    })

    mockUsePolling.mockReturnValue({
      isPolling: false,
      attempts: 0,
      timeout: false,
      margin: null,
      error: null,
      completedWithoutMargin: false,
    })

    mockGetStrategy.mockReturnValue({
      interval: 2500,
      maxAttempts: 24,
      estimatedTime: 10000,
    })

    vi.mocked(useMarginPollingStore).mockReturnValue({
      addPollingProduct: vi.fn(),
      removePollingProduct: vi.fn(),
    } as unknown as ReturnType<typeof useMarginPollingStore>)
  })

  it('returns initial state', () => {
    const { result } = renderHook(() => useSingleCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(false)
    expect(result.current.isPolling).toBe(false)
    expect(result.current.margin).toBeNull()
    expect(result.current.completedWithoutMargin).toBe(false)
  })

  it('exposes mutate function', () => {
    const { result } = renderHook(() => useSingleCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    expect(typeof result.current.mutate).toBe('function')
  })

  it('delegates to useSingleCogsAssignment', () => {
    renderHook(() => useSingleCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    expect(mockUseAssignment).toHaveBeenCalled()
  })

  it('delegates to useMarginPollingWithQuery', () => {
    renderHook(() => useSingleCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    expect(mockUsePolling).toHaveBeenCalled()
    const pollingOptions = mockUsePolling.mock.calls[0][0]
    // Should be disabled initially (no nmId/config)
    expect(pollingOptions.enabled).toBe(false)
  })

  it('passes through assignment mutation state', () => {
    mockUseAssignment.mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
      isSuccess: false,
      isError: false,
      error: null,
      data: null,
    } as unknown as ReturnType<typeof useSingleCogsAssignment>)

    const { result } = renderHook(() => useSingleCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(true)
  })

  it('passes through polling state', () => {
    mockUsePolling.mockReturnValue({
      isPolling: true,
      attempts: 5,
      timeout: false,
      margin: null,
      error: null,
      completedWithoutMargin: false,
    })

    const { result } = renderHook(() => useSingleCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPolling).toBe(true)
    expect(result.current.pollingAttempts).toBe(5)
  })

  it('passes through margin when available', () => {
    mockUsePolling.mockReturnValue({
      isPolling: false,
      attempts: 3,
      timeout: false,
      margin: 42.5,
      error: null,
      completedWithoutMargin: false,
    })

    const { result } = renderHook(() => useSingleCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    expect(result.current.margin).toBe(42.5)
  })

  it('passes through completedWithoutMargin flag', () => {
    mockUsePolling.mockReturnValue({
      isPolling: false,
      attempts: 24,
      timeout: false,
      margin: null,
      error: null,
      completedWithoutMargin: true,
    })

    const { result } = renderHook(() => useSingleCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    expect(result.current.completedWithoutMargin).toBe(true)
  })

  it('passes through polling timeout', () => {
    mockUsePolling.mockReturnValue({
      isPolling: false,
      attempts: 24,
      timeout: true,
      margin: null,
      error: null,
      completedWithoutMargin: false,
    })

    const { result } = renderHook(() => useSingleCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    expect(result.current.pollingTimeout).toBe(true)
  })
})
