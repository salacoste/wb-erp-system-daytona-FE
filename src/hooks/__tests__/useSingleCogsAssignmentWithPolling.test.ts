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

// =============================================================================
// mutate callback logic tests
// =============================================================================

describe('useSingleCogsAssignmentWithPolling mutate', () => {
  let capturedMutateOptions: {
    onSuccess?: (response: Record<string, unknown>) => void
    onError?: (error: Error) => void
  } = {}

  beforeEach(() => {
    vi.clearAllMocks()
    capturedMutateOptions = {}

    // Capture the options passed to assignmentMutation.mutate(params, options)
    const mockMutate = vi.fn((_params: unknown, options: Record<string, unknown>) => {
      capturedMutateOptions = options as typeof capturedMutateOptions
    })
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

  const standardParams = {
    nmId: '12345',
    cogs: { unit_cost_rub: 100.5, valid_from: '2025-W01' },
  }

  it('calls assignment mutate with params', () => {
    const { result } = renderHook(() => useSingleCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(standardParams)

    const assignmentMutate = mockUseAssignment.mock.results[0].value.mutate
    expect(assignmentMutate).toHaveBeenCalledWith(standardParams, expect.objectContaining({}))
  })

  it('skips polling when margin is already available in response', () => {
    const addPolling = vi.fn()
    vi.mocked(useMarginPollingStore).mockReturnValue({
      addPollingProduct: addPolling,
      removePollingProduct: vi.fn(),
    } as unknown as ReturnType<typeof useMarginPollingStore>)

    const { result } = renderHook(() => useSingleCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(standardParams)

    // Simulate assignment success with margin already available
    const response = { has_cogs: true, current_margin_pct: 42.5, is_orphan: false }
    capturedMutateOptions.onSuccess?.(response)

    // addPollingProduct should NOT have been called (polling skipped)
    expect(addPolling).not.toHaveBeenCalled()
  })

  it('starts polling when COGS assigned without immediate margin', () => {
    const addPolling = vi.fn()
    vi.mocked(useMarginPollingStore).mockReturnValue({
      addPollingProduct: addPolling,
      removePollingProduct: vi.fn(),
    } as unknown as ReturnType<typeof useMarginPollingStore>)

    const { result } = renderHook(() => useSingleCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(standardParams)

    // Simulate assignment success without margin (null current_margin_pct)
    const response = { has_cogs: true, current_margin_pct: null, is_orphan: false }
    capturedMutateOptions.onSuccess?.(response)

    expect(getPollingStrategy).toHaveBeenCalledWith('2025-W01', false)
    expect(addPolling).toHaveBeenCalledWith('12345')
  })

  it('skips polling for orphan products', () => {
    const addPolling = vi.fn()
    vi.mocked(useMarginPollingStore).mockReturnValue({
      addPollingProduct: addPolling,
      removePollingProduct: vi.fn(),
    } as unknown as ReturnType<typeof useMarginPollingStore>)

    const { result } = renderHook(() => useSingleCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(standardParams)

    // Simulate orphan product response
    const response = { has_cogs: true, current_margin_pct: null, is_orphan: true }
    capturedMutateOptions.onSuccess?.(response)

    expect(addPolling).not.toHaveBeenCalled()
  })

  it('skips polling when response has_cogs is false', () => {
    const addPolling = vi.fn()
    vi.mocked(useMarginPollingStore).mockReturnValue({
      addPollingProduct: addPolling,
      removePollingProduct: vi.fn(),
    } as unknown as ReturnType<typeof useMarginPollingStore>)

    const { result } = renderHook(() => useSingleCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(standardParams)

    // Simulate response where COGS was not actually assigned
    const response = { has_cogs: false, current_margin_pct: null, is_orphan: false }
    capturedMutateOptions.onSuccess?.(response)

    expect(addPolling).not.toHaveBeenCalled()
  })

  it('calls caller onSuccess when assignment succeeds', () => {
    const callerOnSuccess = vi.fn()

    const { result } = renderHook(() => useSingleCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(standardParams, { onSuccess: callerOnSuccess })

    const response = { has_cogs: true, current_margin_pct: 42.5, is_orphan: false }
    capturedMutateOptions.onSuccess?.(response)

    expect(callerOnSuccess).toHaveBeenCalledWith(response)
  })

  it('calls caller onError when assignment fails', () => {
    const callerOnError = vi.fn()

    const { result } = renderHook(() => useSingleCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(standardParams, { onError: callerOnError })

    const error = new Error('Assignment failed')
    capturedMutateOptions.onError?.(error)

    expect(callerOnError).toHaveBeenCalledWith(error)
  })

  it('uses default polling strategy when no config is set', () => {
    const addPolling = vi.fn()
    vi.mocked(useMarginPollingStore).mockReturnValue({
      addPollingProduct: addPolling,
      removePollingProduct: vi.fn(),
    } as unknown as ReturnType<typeof useMarginPollingStore>)

    renderHook(() => useSingleCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    // Before any mutation, pollingOptions should use the default strategy
    const pollingCall = mockUsePolling.mock.calls[0]
    expect(pollingCall?.[0].strategy).toEqual({
      interval: 2500,
      maxAttempts: 24,
      estimatedTime: 10000,
    })
  })

  it('passes through assignment error state', () => {
    mockUseAssignment.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: true,
      error: new Error('Network error'),
      data: null,
    } as unknown as ReturnType<typeof useSingleCogsAssignment>)

    const { result } = renderHook(() => useSingleCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('passes through assignment data', () => {
    const responseData = { has_cogs: true, current_margin_pct: 42.5 }
    mockUseAssignment.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: true,
      isError: false,
      error: null,
      data: responseData,
    } as unknown as ReturnType<typeof useSingleCogsAssignment>)

    const { result } = renderHook(() => useSingleCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    expect(result.current.data).toBe(responseData)
  })
})
