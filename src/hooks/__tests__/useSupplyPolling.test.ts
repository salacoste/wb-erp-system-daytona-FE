/**
 * Unit tests for useSupplyPolling hook and supply-polling-constants
 * Story 53.7-FE: Status Polling & Sync
 * Epic 53-FE: Supply Management UI
 *
 * Tests polling config constants, query keys, and hook behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { POLLING_CONFIG, supplyPollingQueryKeys, useSupplyPolling } from '../useSupplyPolling'
import type { SuppliesListResponse, SupplyStatusChange } from '@/types/supplies'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import { apiClient } from '@/lib/api-client'

const mockGet = vi.mocked(apiClient.get)

async function advanceTimersByTime(ms: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

function makeSuppliesResponse(items: Array<{ id: string; status: string }>): SuppliesListResponse {
  return {
    items: items.map(item => ({
      id: item.id,
      wbSupplyId: `wb-${item.id}`,
      name: `Supply ${item.id}`,
      status: item.status as SuppliesListResponse['items'][number]['status'],
      ordersCount: 5,
      createdAt: new Date().toISOString(),
      closedAt: null,
      syncedAt: null,
    })),
    pagination: { total: items.length, limit: 100, offset: 0 },
    filters: { status: null, from: null, to: null },
  }
}

const createWrapper = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

// =============================================================================
// POLLING_CONFIG constants (AC1)
// =============================================================================

describe('POLLING_CONFIG', () => {
  it('has 30 second default interval', () => {
    expect(POLLING_CONFIG.defaultInterval).toBe(30000)
  })

  it('has 60 second interval for DELIVERING status', () => {
    expect(POLLING_CONFIG.deliveringInterval).toBe(60000)
  })

  it('defines terminal statuses for stop condition', () => {
    expect(POLLING_CONFIG.terminalStatuses).toContain('DELIVERED')
    expect(POLLING_CONFIG.terminalStatuses).toContain('CANCELLED')
  })

  it('defines active statuses for polling', () => {
    expect(POLLING_CONFIG.activeStatuses).toContain('CLOSED')
    expect(POLLING_CONFIG.activeStatuses).toContain('DELIVERING')
  })

  it('has max attempts > 0', () => {
    expect(POLLING_CONFIG.maxAttempts).toBeGreaterThan(0)
  })

  it('has max consecutive errors > 0', () => {
    expect(POLLING_CONFIG.maxConsecutiveErrors).toBeGreaterThan(0)
  })

  it('has manual sync rate limit of 5 minutes', () => {
    expect(POLLING_CONFIG.manualSyncRateLimitMs).toBe(5 * 60 * 1000)
  })
})

// =============================================================================
// supplyPollingQueryKeys (AC6)
// =============================================================================

describe('supplyPollingQueryKeys', () => {
  it('generates correct base key', () => {
    expect(supplyPollingQueryKeys.all).toEqual(['supply-polling'])
  })

  it('generates correct active supplies key', () => {
    const key = supplyPollingQueryKeys.active()
    expect(key).toEqual(['supply-polling', 'active'])
  })

  it('generates correct sync key', () => {
    const key = supplyPollingQueryKeys.sync()
    expect(key).toEqual(['supply-polling', 'sync'])
  })
})

// =============================================================================
// useSupplyPolling hook (AC2-5, AC7-8)
// =============================================================================

describe('useSupplyPolling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns initial state with no active supplies', async () => {
    mockGet.mockResolvedValueOnce(makeSuppliesResponse([]))

    const { result } = renderHook(() => useSupplyPolling({ enabled: true }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.isPolling).toBe(false)
    expect(result.current.activeCount).toBe(0)
    expect(result.current.changedSupplies).toEqual([])
    expect(result.current.consecutiveErrors).toBe(0)
    expect(result.current.isPaused).toBe(false)
  })

  it('detects active supplies and reports polling state', async () => {
    mockGet.mockResolvedValueOnce(
      makeSuppliesResponse([
        { id: '1', status: 'CLOSED' },
        { id: '2', status: 'DELIVERING' },
      ])
    )

    const { result } = renderHook(() => useSupplyPolling({ enabled: true }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.activeCount).toBe(2)
  })

  it('returns false isPolling when disabled', () => {
    mockGet.mockResolvedValue(makeSuppliesResponse([]))

    const { result } = renderHook(() => useSupplyPolling({ enabled: false }), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPolling).toBe(false)
  })

  it('detects status changes between polls', async () => {
    const firstResponse = makeSuppliesResponse([{ id: '1', status: 'CLOSED' }])
    const secondResponse = makeSuppliesResponse([{ id: '1', status: 'DELIVERING' }])

    mockGet.mockResolvedValueOnce(firstResponse).mockResolvedValueOnce(secondResponse)

    const onStatusChange = vi.fn()
    const { result } = renderHook(() => useSupplyPolling({ enabled: true, onStatusChange }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Advance timer to trigger refetch
    await advanceTimersByTime(30000)

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2))

    // Status change should be detected
    await waitFor(() => {
      expect(result.current.changedSupplies.length).toBeGreaterThan(0)
    })

    const change = result.current.changedSupplies[0] as SupplyStatusChange
    expect(change.supplyId).toBe('1')
    expect(change.oldStatus).toBe('CLOSED')
    expect(change.newStatus).toBe('DELIVERING')
    expect(onStatusChange).toHaveBeenCalled()
  })

  it('clears changed supplies after acknowledgeChanges', async () => {
    const firstResponse = makeSuppliesResponse([{ id: '1', status: 'CLOSED' }])
    const secondResponse = makeSuppliesResponse([{ id: '1', status: 'DELIVERING' }])

    mockGet.mockResolvedValueOnce(firstResponse).mockResolvedValueOnce(secondResponse)

    const { result } = renderHook(() => useSupplyPolling({ enabled: true }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    await advanceTimersByTime(30000)
    await waitFor(() => expect(result.current.changedSupplies.length).toBeGreaterThan(0))

    act(() => {
      result.current.acknowledgeChanges()
    })

    expect(result.current.changedSupplies).toHaveLength(0)
  })

  it('pauses polling on window blur when pauseOnBlur is true', async () => {
    mockGet.mockResolvedValue(makeSuppliesResponse([{ id: '1', status: 'CLOSED' }]))

    const { result } = renderHook(() => useSupplyPolling({ enabled: true, pauseOnBlur: true }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    act(() => {
      window.dispatchEvent(new Event('blur'))
    })

    expect(result.current.isPaused).toBe(true)
  })

  it('resumes polling on window focus after blur', async () => {
    mockGet.mockResolvedValue(makeSuppliesResponse([{ id: '1', status: 'CLOSED' }]))

    const { result } = renderHook(() => useSupplyPolling({ enabled: true, pauseOnBlur: true }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    act(() => {
      window.dispatchEvent(new Event('blur'))
    })
    expect(result.current.isPaused).toBe(true)

    act(() => {
      window.dispatchEvent(new Event('focus'))
    })
    expect(result.current.isPaused).toBe(false)
  })

  it('does not pause on blur when pauseOnBlur is false', async () => {
    mockGet.mockResolvedValue(makeSuppliesResponse([{ id: '1', status: 'CLOSED' }]))

    const { result } = renderHook(() => useSupplyPolling({ enabled: true, pauseOnBlur: false }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    act(() => {
      window.dispatchEvent(new Event('blur'))
    })

    expect(result.current.isPaused).toBe(false)
  })

  it('reports formatted last sync time', async () => {
    mockGet.mockResolvedValueOnce(makeSuppliesResponse([]))

    const { result } = renderHook(() => useSupplyPolling({ enabled: true }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.lastSyncFormatted).not.toBe('Не синхронизировано')
  })

  it('reports "Не синхронизировано" before first sync', () => {
    mockGet.mockResolvedValue(makeSuppliesResponse([]))

    const { result } = renderHook(() => useSupplyPolling({ enabled: false }), {
      wrapper: createWrapper(),
    })

    expect(result.current.lastSyncFormatted).toBe('Не синхронизировано')
  })

  it('uses default interval when all supplies are active but not all DELIVERING', async () => {
    mockGet.mockResolvedValueOnce(
      makeSuppliesResponse([
        { id: '1', status: 'CLOSED' },
        { id: '2', status: 'DELIVERING' },
      ])
    )

    const { result } = renderHook(() => useSupplyPolling({ enabled: true }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.currentInterval).toBe(POLLING_CONFIG.defaultInterval)
  })

  it('uses delivering interval when all active supplies are DELIVERING', async () => {
    mockGet.mockResolvedValueOnce(makeSuppliesResponse([{ id: '1', status: 'DELIVERING' }]))

    const { result } = renderHook(() => useSupplyPolling({ enabled: true }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.currentInterval).toBe(POLLING_CONFIG.deliveringInterval)
  })

  it('tracks consecutive errors', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network Error'))

    const { result } = renderHook(
      () => useSupplyPolling({ enabled: true, maxConsecutiveErrors: 5 }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.error).toBeTruthy(), { timeout: 5000 })

    expect(result.current.consecutiveErrors).toBe(1)
  })

  it('resets consecutive errors on successful fetch', async () => {
    mockGet
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce(makeSuppliesResponse([]))

    const { result } = renderHook(() => useSupplyPolling({ enabled: true }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.error).toBeTruthy(), { timeout: 5000 })
    expect(result.current.consecutiveErrors).toBe(1)

    await advanceTimersByTime(30000)

    await waitFor(() => expect(result.current.consecutiveErrors).toBe(0), { timeout: 5000 })
  })

  it('provides countdown timer for next sync', async () => {
    mockGet.mockResolvedValue(makeSuppliesResponse([{ id: '1', status: 'CLOSED' }]))

    const { result } = renderHook(() => useSupplyPolling({ enabled: true }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const initialCountdown = result.current.nextSyncIn
    expect(initialCountdown).toBeLessThanOrEqual(30)

    await advanceTimersByTime(1000)

    expect(result.current.nextSyncIn).toBeLessThan(initialCountdown)
  })

  it('no active supplies returns zero activeCount', async () => {
    mockGet.mockResolvedValueOnce(
      makeSuppliesResponse([
        { id: '1', status: 'OPEN' },
        { id: '2', status: 'DELIVERED' },
      ])
    )

    const { result } = renderHook(() => useSupplyPolling({ enabled: true }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.activeCount).toBe(0)
  })
})
