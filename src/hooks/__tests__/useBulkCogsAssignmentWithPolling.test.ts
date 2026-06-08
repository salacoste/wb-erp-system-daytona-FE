/**
 * Unit tests for useBulkCogsAssignmentWithPolling hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useBulkCogsAssignmentWithPolling } from '../useBulkCogsAssignmentWithPolling'

// Mock all dependencies
const mockMutate = vi.hoisted(() => vi.fn())

vi.mock('../useBulkCogsAssignment', () => ({
  useBulkCogsAssignment: vi.fn().mockReturnValue({
    mutate: mockMutate,
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: null,
  }),
}))

vi.mock('@/lib/margin-helpers', () => ({
  getPollingStrategy: vi.fn().mockReturnValue({
    interval: 2500,
    maxAttempts: 24,
    estimatedTime: 10000,
  }),
}))

vi.mock('@/stores/marginPollingStore', () => ({
  useMarginPollingStore: vi.fn().mockReturnValue({
    addPollingProduct: vi.fn(),
    removePollingProduct: vi.fn(),
  }),
}))

vi.mock('../useBulkCogsAssignmentWithPolling-utils', () => ({
  isMarginCalculationComplete: vi.fn(),
  extractSampleIds: vi.fn().mockReturnValue(['nm-1', 'nm-2']),
  MARGIN_COMPLETION_THRESHOLD: 0.5,
  MAX_SAMPLE_SIZE: 10,
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}))

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn() },
}))

import { useBulkCogsAssignment } from '../useBulkCogsAssignment'
import { toast } from 'sonner'

const mockUseAssignment = vi.mocked(useBulkCogsAssignment)
const mockToast = vi.mocked(toast)

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('useBulkCogsAssignmentWithPolling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMutate.mockReset()
    mockUseAssignment.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
      data: null,
    } as unknown as ReturnType<typeof useBulkCogsAssignment>)
  })

  it('returns initial state', () => {
    const { result } = renderHook(() => useBulkCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(false)
    expect(result.current.isPolling).toBe(false)
    expect(result.current.pollingAttempts).toBe(0)
    expect(result.current.pollingTimeout).toBe(false)
    expect(result.current.pollingStrategy).toEqual({
      interval: 2500,
      maxAttempts: 24,
      estimatedTime: 10000,
    })
  })

  it('exposes mutate function', () => {
    const { result } = renderHook(() => useBulkCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    expect(typeof result.current.mutate).toBe('function')
  })

  it('passes through isPending from assignment mutation', () => {
    mockUseAssignment.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isSuccess: false,
      isError: false,
      error: null,
      data: null,
    } as unknown as ReturnType<typeof useBulkCogsAssignment>)

    const { result } = renderHook(() => useBulkCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(true)
  })

  it('passes through isError and error from assignment mutation', () => {
    const error = new Error('Assignment failed')
    mockUseAssignment.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isSuccess: false,
      isError: true,
      error,
      data: null,
    } as unknown as ReturnType<typeof useBulkCogsAssignment>)

    const { result } = renderHook(() => useBulkCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.error).toBe(error)
  })

  it('mutate delegates to assignment mutation', () => {
    const { result } = renderHook(() => useBulkCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    const params = { items: [{ nm_id: 'nm-1', unit_cost_rub: 100, valid_from: '2025-W03' }] }
    act(() => {
      result.current.mutate(params)
    })

    expect(mockMutate).toHaveBeenCalledWith(params, expect.any(Object))
  })

  it('mutate calls onSuccess callback', () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useBulkCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    const params = { items: [{ nm_id: 'nm-1', unit_cost_rub: 100, valid_from: '2025-W03' }] }
    act(() => {
      result.current.mutate(params, { onSuccess })
    })

    // Extract the onSuccess handler passed to useBulkCogsAssignment.mutate
    const mutationOptions = mockMutate.mock.calls[0][1] as {
      onSuccess?: (data: unknown) => void
    }
    const responseData = {
      succeeded: 1,
      failed: 0,
      results: [{ success: true, nm_id: 'nm-1' }],
      marginRecalculation: { triggered: true, affectedWeeks: ['2025-W03'], taskUuid: 'task-1' },
    }

    act(() => {
      mutationOptions.onSuccess?.(responseData)
    })

    expect(onSuccess).toHaveBeenCalledWith(responseData)
    expect(mockToast.success).toHaveBeenCalledWith(
      'Себестоимость назначена',
      expect.objectContaining({ description: expect.stringContaining('Успешно: 1') })
    )
  })

  it('mutate calls onError callback', () => {
    const onError = vi.fn()
    const { result } = renderHook(() => useBulkCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    const params = { items: [{ nm_id: 'nm-1', unit_cost_rub: 100, valid_from: '2025-W03' }] }
    act(() => {
      result.current.mutate(params, { onError })
    })

    const mutationOptions = mockMutate.mock.calls[0][1] as {
      onError?: (error: Error) => void
    }
    const error = new Error('API error')

    act(() => {
      mutationOptions.onError?.(error)
    })

    expect(onError).toHaveBeenCalledWith(error)
    expect(mockToast.error).toHaveBeenCalled()
  })

  it('shows info toast when margin recalculation triggered', () => {
    const { result } = renderHook(() => useBulkCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    const params = { items: [{ nm_id: 'nm-1', unit_cost_rub: 100, valid_from: '2025-W03' }] }
    act(() => {
      result.current.mutate(params)
    })

    const mutationOptions = mockMutate.mock.calls[0][1] as {
      onSuccess?: (data: unknown) => void
    }
    const responseData = {
      succeeded: 2,
      failed: 0,
      results: [
        { success: true, nm_id: 'nm-1' },
        { success: true, nm_id: 'nm-2' },
      ],
      marginRecalculation: { triggered: true, affectedWeeks: ['2025-W03'], taskUuid: 'task-1' },
    }

    act(() => {
      mutationOptions.onSuccess?.(responseData)
    })

    expect(mockToast.info).toHaveBeenCalledWith(
      expect.stringContaining('Расчёт маржи'),
      expect.any(Object)
    )
  })

  it('shows info toast when no margin recalculation but succeeded > 0', () => {
    const { result } = renderHook(() => useBulkCogsAssignmentWithPolling(), {
      wrapper: createWrapper(),
    })

    const params = { items: [{ nm_id: 'nm-1', unit_cost_rub: 100, valid_from: '2025-W03' }] }
    act(() => {
      result.current.mutate(params)
    })

    const mutationOptions = mockMutate.mock.calls[0][1] as {
      onSuccess?: (data: unknown) => void
    }
    const responseData = {
      succeeded: 1,
      failed: 0,
      results: [{ success: true, nm_id: 'nm-1' }],
      marginRecalculation: null,
    }

    act(() => {
      mutationOptions.onSuccess?.(responseData)
    })

    expect(mockToast.info).toHaveBeenCalledWith(
      'Себестоимость назначена',
      expect.objectContaining({
        description: 'Маржа будет рассчитана после импорта продаж',
      })
    )
  })
})
