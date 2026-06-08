/**
 * Unit tests for useCogsEdit hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useCogsEdit } from '../useCogsEdit'

vi.mock('@/lib/api-client', () => ({
  apiClient: { patch: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

const mockPatch = vi.mocked(apiClient.patch)
const mockToastSuccess = vi.mocked(toast.success)
const mockToastError = vi.mocked(toast.error)

const createWrapper = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

const mockEditResponse = {
  cogs_id: 'cogs-123',
  nm_id: '12345678',
  unit_cost_rub: 500,
  currency: 'RUB',
  valid_from: '2025-11-01',
  valid_to: null,
  source: 'manual',
  notes: 'Updated note',
  created_by: 'user',
  created_at: '2025-11-01T00:00:00Z',
  updated_at: '2025-12-01T00:00:00Z',
  is_active: true,
  margin_recalculation: {
    triggered: true,
    task_uuid: 'task-1',
    affected_weeks: ['2025-W47', '2025-W48'],
    estimated_time_sec: 8,
  },
}

describe('useCogsEdit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls PATCH endpoint and returns response', async () => {
    mockPatch.mockResolvedValueOnce(mockEditResponse)

    const onSuccess = vi.fn()
    const { result } = renderHook(() => useCogsEdit('cogs-123', { onSuccess }), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ unit_cost_rub: 500 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockPatch).toHaveBeenCalledWith('/v1/cogs/cogs-123', { unit_cost_rub: 500 })
    expect(result.current.data?.cogs_id).toBe('cogs-123')
    expect(onSuccess).toHaveBeenCalledWith(mockEditResponse)
  })

  it('shows success toast with affected weeks count', async () => {
    mockPatch.mockResolvedValueOnce(mockEditResponse)

    const { result } = renderHook(() => useCogsEdit('cogs-123'), { wrapper: createWrapper() })

    result.current.mutate({ unit_cost_rub: 500 })

    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledTimes(1))
    const description = mockToastSuccess.mock.calls[0][1]?.description as string
    expect(description).toContain('2')
    expect(description).toContain('8 сек')
  })

  it('shows "Изменения сохранены" when no affected weeks', async () => {
    mockPatch.mockResolvedValueOnce({
      ...mockEditResponse,
      margin_recalculation: { ...mockEditResponse.margin_recalculation, affected_weeks: [] },
    })

    const { result } = renderHook(() => useCogsEdit('cogs-123'), { wrapper: createWrapper() })

    result.current.mutate({ notes: 'new note' })

    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledTimes(1))
    const description = mockToastSuccess.mock.calls[0][1]?.description as string
    expect(description).toBe('Изменения сохранены')
  })

  it('shows 400 validation error toast', async () => {
    const error = Object.assign(new Error('Bad request'), {
      response: { status: 400, data: { message: 'Invalid cost' } },
    })
    mockPatch.mockRejectedValueOnce(error)

    const { result } = renderHook(() => useCogsEdit('cogs-123'), { wrapper: createWrapper() })

    result.current.mutate({ unit_cost_rub: -1 })

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('Ошибка валидации', expect.any(Object))
    )
  })

  it('shows 403 forbidden error toast', async () => {
    const error = Object.assign(new Error('Forbidden'), { status: 403 })
    mockPatch.mockRejectedValueOnce(error)

    const { result } = renderHook(() => useCogsEdit('cogs-123'), { wrapper: createWrapper() })

    result.current.mutate({ unit_cost_rub: 500 })

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('Недостаточно прав для редактирования')
    )
  })

  it('shows 404 not found error toast', async () => {
    const error = Object.assign(new Error('Not found'), {
      response: { status: 404 },
    })
    mockPatch.mockRejectedValueOnce(error)

    const { result } = renderHook(() => useCogsEdit('cogs-123'), { wrapper: createWrapper() })

    result.current.mutate({ unit_cost_rub: 500 })

    await waitFor(() => expect(mockToastError).toHaveBeenCalledTimes(1))
    expect(mockToastError.mock.calls[0][0]).toBe('Запись не найдена')
  })

  it('shows generic error toast on unknown error', async () => {
    mockPatch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useCogsEdit('cogs-123'), { wrapper: createWrapper() })

    result.current.mutate({ unit_cost_rub: 500 })

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('Ошибка сохранения', expect.any(Object))
    )
  })

  it('calls onError callback on failure', async () => {
    const error = Object.assign(new Error('fail'), { status: 500 })
    mockPatch.mockRejectedValueOnce(error)
    const onError = vi.fn()

    const { result } = renderHook(() => useCogsEdit('cogs-123', { onError }), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ unit_cost_rub: 500 })

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1))
  })
})
