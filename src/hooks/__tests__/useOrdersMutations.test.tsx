/**
 * Tests for useOrdersSync and useOrdersBackfill mutation hooks
 * Extracted from useOrdersMutations.ts
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  useOrdersSync,
  useOrdersBackfill,
  useUpdateOrderExpiration,
  useAutoFillOrderExpiration,
  useReconcileOrderExpiration,
} from '../useOrdersMutations'
import * as ordersApi from '@/lib/api/orders'
import { ApiError } from '@/types/api'

vi.mock('@/lib/api/orders', async () => {
  const actual = await vi.importActual<typeof ordersApi>('@/lib/api/orders')
  return {
    ...actual,
    triggerOrdersSync: vi.fn(),
    triggerOrdersBackfill: vi.fn(),
    updateOrderExpiration: vi.fn(),
    autoFillOrderExpiration: vi.fn(),
    reconcileOrderExpiration: vi.fn(),
  }
})

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockSync = vi.mocked(ordersApi.triggerOrdersSync)
const mockBackfill = vi.mocked(ordersApi.triggerOrdersBackfill)
const mockUpdateExpiration = vi.mocked(ordersApi.updateOrderExpiration)
const mockAutoFillExpiration = vi.mocked(ordersApi.autoFillOrderExpiration)
const mockReconcileExpiration = vi.mocked(ordersApi.reconcileOrderExpiration)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useOrdersSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls triggerOrdersSync on mutate', async () => {
    mockSync.mockResolvedValueOnce({ jobId: 'job-1', message: 'Sync started' })

    const { result } = renderHook(() => useOrdersSync(), { wrapper: createWrapper() })

    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockSync).toHaveBeenCalledOnce()
    expect(result.current.data).toEqual({ jobId: 'job-1', message: 'Sync started' })
  })

  it('calls onSuccess callback', async () => {
    const onSuccess = vi.fn()
    mockSync.mockResolvedValueOnce({ jobId: 'job-2', message: 'Sync started' })

    const { result } = renderHook(() => useOrdersSync({ onSuccess }), { wrapper: createWrapper() })

    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(onSuccess).toHaveBeenCalledWith({ jobId: 'job-2', message: 'Sync started' })
  })

  it('calls onError callback on failure', async () => {
    const onError = vi.fn()
    mockSync.mockRejectedValueOnce(new Error('Sync failed'))

    const { result } = renderHook(() => useOrdersSync({ onError }), { wrapper: createWrapper() })

    result.current.mutate()

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(onError).toHaveBeenCalledWith(expect.any(Error))
    expect(result.current.error?.message).toBe('Sync failed')
  })

  it('returns isPending false initially', () => {
    const { result } = renderHook(() => useOrdersSync(), { wrapper: createWrapper() })
    expect(result.current.isPending).toBe(false)
  })

  it('works without callbacks (no options)', async () => {
    mockSync.mockResolvedValueOnce({ jobId: 'job-3', message: 'Sync started' })

    const { result } = renderHook(() => useOrdersSync(), { wrapper: createWrapper() })

    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockSync).toHaveBeenCalledOnce()
  })
})

describe('useOrdersBackfill', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls triggerOrdersBackfill with params', async () => {
    mockBackfill.mockResolvedValueOnce({
      jobId: 'bj-1',
      message: 'Backfill started',
      dateFrom: '2026-01-01',
      dateTo: '2026-03-01',
      days: 60,
    })

    const { result } = renderHook(() => useOrdersBackfill(), { wrapper: createWrapper() })

    result.current.mutate({ dateFrom: '2026-01-01', dateTo: '2026-03-01' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // TanStack v5 passes mutation context as second arg — check first arg only
    expect(mockBackfill).toHaveBeenCalledWith(
      { dateFrom: '2026-01-01', dateTo: '2026-03-01' },
      expect.anything()
    )
    expect(result.current.data?.days).toBe(60)
  })

  it('calls onSuccess callback', async () => {
    const onSuccess = vi.fn()
    const response = {
      jobId: 'bj-2',
      message: 'Backfill queued',
      dateFrom: '2026-01-01',
      dateTo: '2026-02-01',
      days: 32,
    }
    mockBackfill.mockResolvedValueOnce(response)

    const { result } = renderHook(() => useOrdersBackfill({ onSuccess }), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ dateFrom: '2026-01-01', dateTo: '2026-02-01' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(onSuccess).toHaveBeenCalledWith(response)
  })

  it('calls onError callback on failure', async () => {
    const onError = vi.fn()
    mockBackfill.mockRejectedValueOnce(new Error('Backfill error'))

    const { result } = renderHook(() => useOrdersBackfill({ onError }), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ dateFrom: '2026-01-01', dateTo: '2026-02-01' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(onError).toHaveBeenCalledWith(expect.any(Error))
    expect(result.current.error?.message).toBe('Backfill error')
  })

  it('returns isPending false initially', () => {
    const { result } = renderHook(() => useOrdersBackfill(), { wrapper: createWrapper() })
    expect(result.current.isPending).toBe(false)
  })

  it('handles API error without onError callback', async () => {
    mockBackfill.mockRejectedValueOnce(new Error('Server error'))

    const { result } = renderHook(() => useOrdersBackfill(), { wrapper: createWrapper() })

    result.current.mutate({ dateFrom: '2026-01-01', dateTo: '2026-02-01' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Server error')
  })
})

describe('useUpdateOrderExpiration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses the UUID route input and invalidates exactly detail(wbOrderId)', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined)
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    mockUpdateExpiration.mockResolvedValue({
      updated: true,
      expirationDate: '2030-09-12',
      decision: 'filled',
    })

    const { result } = renderHook(() => useUpdateOrderExpiration(), { wrapper })
    result.current.mutate({
      orderUuid: 'order-uuid',
      wbOrderId: '1234567890',
      expirationDate: '2030-09-12',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockUpdateExpiration).toHaveBeenCalledWith('order-uuid', {
      expirationDate: '2030-09-12',
    })
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ordersApi.ordersQueryKeys.detail('1234567890'),
    })
    expect(invalidate).not.toHaveBeenCalledWith({
      queryKey: ordersApi.ordersQueryKeys.detail('order-uuid'),
    })
    expect(toast.success).toHaveBeenCalledWith('Срок годности сохранён')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('does not invalidate detail cache when the mutation fails', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined)
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    mockUpdateExpiration.mockRejectedValue(new Error('Дата слишком ранняя'))

    const { result } = renderHook(() => useUpdateOrderExpiration(), { wrapper })
    result.current.mutate({
      orderUuid: 'order-uuid',
      wbOrderId: '1234567890',
      expirationDate: '2030-09-12',
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(invalidate).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('Дата слишком ранняя')
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('uses read-only reconciliation instead of retrying an uncertain WB write', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined)
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    mockUpdateExpiration.mockRejectedValue(
      new ApiError('Исход требует проверки', 502, {
        error: { code: 'ORDER_EXPIRATION_OUTCOME_UNCERTAIN' },
      })
    )
    mockReconcileExpiration.mockResolvedValue({
      reconciled: true,
      verified: true,
      expirationDate: '2030-09-12',
      decision: 'filled',
      outcome: 'verified',
    })

    const { result } = renderHook(() => useUpdateOrderExpiration(), { wrapper })
    result.current.mutate({
      orderUuid: 'order-uuid',
      wbOrderId: '1234567890',
      expirationDate: '2030-09-12',
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    await waitFor(() => expect(mockReconcileExpiration).toHaveBeenCalledWith('order-uuid'))
    expect(mockUpdateExpiration).toHaveBeenCalledTimes(1)
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ordersApi.ordersQueryKeys.detail('1234567890'),
    })
    expect(toast.success).toHaveBeenCalledWith('Срок годности подтверждён повторным чтением WB')
  })
})

describe('useAutoFillOrderExpiration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('invalidates the WB detail key after FEFO reservation and verified write', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined)
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    mockAutoFillExpiration.mockResolvedValue({
      updated: true,
      expirationDate: '2030-09-12',
      decision: 'filled',
      reservationId: 'reservation-1',
      batchId: 'batch-1',
    })

    const { result } = renderHook(() => useAutoFillOrderExpiration(), { wrapper })
    result.current.mutate({ orderUuid: 'order-uuid', wbOrderId: '5327897132' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockAutoFillExpiration).toHaveBeenCalledWith('order-uuid')
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ordersApi.ordersQueryKeys.detail('5327897132'),
    })
    expect(toast.success).toHaveBeenCalledWith('Срок годности заполнен по партии FEFO')
  })
})

describe('useReconcileOrderExpiration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('performs only read-back and invalidates the WB detail key', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined)
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    mockReconcileExpiration.mockResolvedValue({
      reconciled: true,
      verified: true,
      expirationDate: '2030-09-12',
      decision: 'filled',
      outcome: 'verified',
    })

    const { result } = renderHook(() => useReconcileOrderExpiration(), { wrapper })
    result.current.mutate({ orderUuid: 'order-uuid', wbOrderId: '5327897132' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockReconcileExpiration).toHaveBeenCalledWith('order-uuid')
    expect(mockUpdateExpiration).not.toHaveBeenCalled()
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ordersApi.ordersQueryKeys.detail('5327897132'),
    })
    expect(toast.success).toHaveBeenCalledWith('Срок годности подтверждён повторным чтением WB')
  })
})
