/**
 * Unit tests for useCogsDelete hook and utility functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import {
  useCogsDelete,
  analyzeVersionChain,
  formatDateForDelete,
  formatCurrencyForDelete,
} from '../useCogsDelete'
import type { CogsHistoryItem } from '@/types/cogs'

vi.mock('@/lib/api-client', () => ({
  apiClient: { delete: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

const mockDelete = vi.mocked(apiClient.delete)
const mockToastSuccess = vi.mocked(toast.success)
const mockToastError = vi.mocked(toast.error)

const createWrapper = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

const mockDeleteResponse = {
  deleted: true,
  cogs_id: 'cogs-123',
  nm_id: '12345678',
  deletion_type: 'soft' as const,
  can_restore: true,
  previous_version_reopened: true,
  margin_recalculation: {
    triggered: true,
    task_uuid: 'task-uuid-1',
    affected_weeks: ['2025-W47'],
    estimated_time_sec: 5,
  },
  message: 'Deleted',
}

describe('useCogsDelete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls DELETE endpoint and returns response', async () => {
    mockDelete.mockResolvedValueOnce(mockDeleteResponse)

    const onSuccess = vi.fn()
    const { result } = renderHook(() => useCogsDelete('cogs-123', { onSuccess }), {
      wrapper: createWrapper(),
    })

    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockDelete).toHaveBeenCalledWith('/v1/cogs/cogs-123')
    expect(result.current.data?.deleted).toBe(true)
    expect(result.current.data?.previous_version_reopened).toBe(true)
    expect(onSuccess).toHaveBeenCalledWith(mockDeleteResponse)
  })

  it('shows toast with previous version reopened info', async () => {
    mockDelete.mockResolvedValueOnce(mockDeleteResponse)

    const { result } = renderHook(() => useCogsDelete('cogs-123'), { wrapper: createWrapper() })

    result.current.mutate()

    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledTimes(1))
    const description = mockToastSuccess.mock.calls[0][1]?.description as string
    expect(description).toContain('Предыдущая версия COGS')
  })

  it('shows 403 toast on forbidden error', async () => {
    const error = Object.assign(new Error('Forbidden'), { status: 403 })
    mockDelete.mockRejectedValueOnce(error)

    const { result } = renderHook(() => useCogsDelete('cogs-123'), { wrapper: createWrapper() })

    result.current.mutate()

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('Недостаточно прав для удаления')
    )
  })

  it('shows 404 toast on not found error', async () => {
    const error = Object.assign(new Error('Not found'), {
      response: { status: 404 },
    })
    mockDelete.mockRejectedValueOnce(error)

    const { result } = renderHook(() => useCogsDelete('cogs-123'), { wrapper: createWrapper() })

    result.current.mutate()

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('Запись не найдена или уже удалена')
    )
  })

  it('shows generic error toast on unknown error', async () => {
    mockDelete.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useCogsDelete('cogs-123'), { wrapper: createWrapper() })

    result.current.mutate()

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('Ошибка удаления', expect.any(Object))
    )
  })

  it('calls onError callback on failure', async () => {
    const error = new Error('fail')
    mockDelete.mockRejectedValueOnce(error)
    const onError = vi.fn()

    const { result } = renderHook(() => useCogsDelete('cogs-123', { onError }), {
      wrapper: createWrapper(),
    })

    result.current.mutate()

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1))
  })
})

describe('analyzeVersionChain', () => {
  const baseItem: CogsHistoryItem = {
    cogs_id: 'cogs-1',
    nm_id: '123',
    unit_cost_rub: 500,
    currency: 'RUB',
    valid_from: '2025-11-01',
    valid_to: null,
    source: 'manual',
    notes: null,
    created_by: 'user',
    created_at: '2025-11-01T00:00:00Z',
    updated_at: '2025-11-01T00:00:00Z',
    is_active: true,
    affected_weeks: [],
  }

  it('identifies current version (valid_to=null)', () => {
    const result = analyzeVersionChain(baseItem, [baseItem])
    expect(result.isCurrentVersion).toBe(true)
  })

  it('identifies previous version exists', () => {
    const previous: CogsHistoryItem = {
      ...baseItem,
      cogs_id: 'cogs-0',
      valid_from: '2025-10-01',
      valid_to: '2025-11-01',
      unit_cost_rub: 450,
    }
    const result = analyzeVersionChain(baseItem, [previous, baseItem])
    expect(result.hasPreviousVersion).toBe(true)
    expect(result.previousVersionCost).toBe(450)
  })

  it('identifies only active version', () => {
    const result = analyzeVersionChain(baseItem, [baseItem])
    expect(result.isOnlyVersion).toBe(true)
  })

  it('identifies not-only version when multiple active', () => {
    const other: CogsHistoryItem = { ...baseItem, cogs_id: 'cogs-2' }
    const result = analyzeVersionChain(baseItem, [baseItem, other])
    expect(result.isOnlyVersion).toBe(false)
  })
})

describe('formatDateForDelete', () => {
  it('returns "текущий" for null date', () => {
    expect(formatDateForDelete(null)).toBe('текущий')
  })

  it('formats date in Russian locale', () => {
    const result = formatDateForDelete('2025-11-01')
    expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/)
  })

  it('returns raw string on invalid date', () => {
    expect(formatDateForDelete('not-a-date')).toBe('not-a-date')
  })
})

describe('formatCurrencyForDelete', () => {
  it('formats number as RUB currency', () => {
    const result = formatCurrencyForDelete(1500.5)
    expect(result).toMatch(/1\s?500,50/)
  })
})
