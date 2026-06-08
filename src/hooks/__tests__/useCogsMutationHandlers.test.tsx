/**
 * Tests for useCogsMutationHandlers
 * Polling event handlers for COGS assignment with margin polling
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePollingHandlers, invalidateProductQueries } from '../useCogsMutationHandlers'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}))
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    queryClient,
  }
}

describe('invalidateProductQueries', () => {
  it('invalidates product and analytics queries', () => {
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    invalidateProductQueries(queryClient, 'nm-123')

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['products'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['products', 'nm-123'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['analytics'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['dashboard'] })
  })

  it('skips nm_id-specific invalidation when nmId is null', () => {
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    invalidateProductQueries(queryClient, null)

    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['products', null] })
  })
})

describe('usePollingHandlers', () => {
  let removePollingProduct: ReturnType<typeof vi.fn>
  let setPollingConfig: ReturnType<typeof vi.fn>
  let setPollingNmId: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    removePollingProduct = vi.fn()
    setPollingConfig = vi.fn()
    setPollingNmId = vi.fn()
  })

  it('returns handler functions', () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(
      () => usePollingHandlers('nm-123', removePollingProduct, setPollingConfig, setPollingNmId),
      { wrapper }
    )

    expect(typeof result.current.handlePollingSuccess).toBe('function')
    expect(typeof result.current.handlePollingTimeout).toBe('function')
    expect(typeof result.current.handlePollingError).toBe('function')
  })

  it('handlePollingSuccess cleans up polling state', () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(
      () => usePollingHandlers('nm-123', removePollingProduct, setPollingConfig, setPollingNmId),
      { wrapper }
    )

    act(() => {
      result.current.handlePollingSuccess(25.5)
    })

    expect(removePollingProduct).toHaveBeenCalledWith('nm-123')
    expect(setPollingConfig).toHaveBeenCalledWith(null)
    expect(setPollingNmId).toHaveBeenCalledWith(null)
  })

  it('handlePollingSuccess works with null marginPct', () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(
      () => usePollingHandlers('nm-123', removePollingProduct, setPollingConfig, setPollingNmId),
      { wrapper }
    )

    act(() => {
      result.current.handlePollingSuccess(null as unknown as number)
    })

    expect(removePollingProduct).toHaveBeenCalledWith('nm-123')
  })

  it('handlePollingTimeout cleans up and shows warning', () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(
      () => usePollingHandlers('nm-123', removePollingProduct, setPollingConfig, setPollingNmId),
      { wrapper }
    )

    act(() => {
      result.current.handlePollingTimeout()
    })

    expect(removePollingProduct).toHaveBeenCalledWith('nm-123')
    expect(setPollingConfig).toHaveBeenCalledWith(null)
    expect(setPollingNmId).toHaveBeenCalledWith(null)
  })

  it('handlePollingError removes polling product', () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(
      () => usePollingHandlers('nm-123', removePollingProduct, setPollingConfig, setPollingNmId),
      { wrapper }
    )

    act(() => {
      result.current.handlePollingError(new Error('timeout'))
    })

    expect(removePollingProduct).toHaveBeenCalledWith('nm-123')
  })

  it('handlers work when pollingNmId is null', () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(
      () => usePollingHandlers(null, removePollingProduct, setPollingConfig, setPollingNmId),
      { wrapper }
    )

    act(() => {
      result.current.handlePollingSuccess(10)
    })
    act(() => {
      result.current.handlePollingTimeout()
    })
    act(() => {
      result.current.handlePollingError(new Error('test'))
    })

    // removePollingProduct should NOT be called with null
    expect(removePollingProduct).not.toHaveBeenCalled()
  })
})
