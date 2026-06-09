/**
 * Unit tests for useDeleteTariffVersion hook
 * Tests: success/error mutations, toast messages, cache invalidation, error codes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useDeleteTariffVersion } from '../useDeleteTariffVersion'

vi.mock('@/lib/api/tariffs-admin', () => ({
  deleteTariffVersion: vi.fn(),
}))

vi.mock('@/hooks/tariff-query-keys', () => ({
  tariffQueryKeys: {
    all: ['tariffs'],
    versionHistory: () => ['tariffs', 'history'],
    auditLog: () => ['tariffs', 'audit'],
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { deleteTariffVersion } from '@/lib/api/tariffs-admin'
import { toast } from 'sonner'

const mockDelete = vi.mocked(deleteTariffVersion)
const mockToastSuccess = vi.mocked(toast.success)
const mockToastError = vi.mocked(toast.error)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

function createApiError(status: number, message: string) {
  const err = new Error(message) as Error & { status?: number }
  err.status = status
  return err
}

describe('useDeleteTariffVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls deleteTariffVersion with versionId on mutate', async () => {
    mockDelete.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useDeleteTariffVersion(), { wrapper: createWrapper() })

    result.current.mutate(42)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockDelete).toHaveBeenCalledWith(42)
  })

  it('shows success toast on successful deletion', async () => {
    mockDelete.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useDeleteTariffVersion(), { wrapper: createWrapper() })

    result.current.mutate(1)

    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith('Запланированная версия удалена')
    )
  })

  it('shows 400 toast for active/expired version error', async () => {
    mockDelete.mockRejectedValueOnce(createApiError(400, 'Bad Request'))

    const { result } = renderHook(() => useDeleteTariffVersion(), { wrapper: createWrapper() })

    result.current.mutate(1)

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('Нельзя удалить активную или истекшую версию')
    )
  })

  it('shows 404 toast for not found error', async () => {
    mockDelete.mockRejectedValueOnce(createApiError(404, 'Not Found'))

    const { result } = renderHook(() => useDeleteTariffVersion(), { wrapper: createWrapper() })

    result.current.mutate(999)

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Версия не найдена'))
  })

  it('shows 403 toast for forbidden error', async () => {
    mockDelete.mockRejectedValueOnce(createApiError(403, 'Forbidden'))

    const { result } = renderHook(() => useDeleteTariffVersion(), { wrapper: createWrapper() })

    result.current.mutate(1)

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('Недостаточно прав для удаления версии')
    )
  })

  it('shows generic error toast for unknown error', async () => {
    mockDelete.mockRejectedValueOnce(createApiError(500, 'Internal Server Error'))

    const { result } = renderHook(() => useDeleteTariffVersion(), { wrapper: createWrapper() })

    result.current.mutate(1)

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Ошибка при удалении версии'))
  })

  it('shows generic error toast for error without status', async () => {
    mockDelete.mockRejectedValueOnce(new Error('Network failure'))

    const { result } = renderHook(() => useDeleteTariffVersion(), { wrapper: createWrapper() })

    result.current.mutate(1)

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Ошибка при удалении версии'))
  })

  it('sets isPending during mutation', async () => {
    let resolveMutation: (v: unknown) => void
    mockDelete.mockImplementation(
      () =>
        new Promise((resolve: (v: unknown) => void) => {
          resolveMutation = resolve
        }) as Promise<void>
    )

    const { result } = renderHook(() => useDeleteTariffVersion(), { wrapper: createWrapper() })

    result.current.mutate(1)
    await waitFor(() => expect(result.current.isPending).toBe(true))

    await act(async () => {
      resolveMutation!(undefined)
    })
    await waitFor(() => expect(result.current.isPending).toBe(false))
  })

  it('invalidates version history and all tariff queries on success', async () => {
    mockDelete.mockResolvedValueOnce(undefined)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useDeleteTariffVersion(), { wrapper })

    result.current.mutate(1)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tariffs', 'history'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tariffs'] })
  })
})
