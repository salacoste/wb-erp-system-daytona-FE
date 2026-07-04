/**
 * Story O4: useUpdateOrderMeta hook tests.
 * Verifies mutation call, cache invalidation (lists + detail), and toast.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'

const mockUpdateMeta = vi.fn()
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}))

vi.mock('@/lib/api/orders', () => ({
  ordersQueryKeys: {
    all: ['orders'] as const,
    lists: () => ['orders', 'list'] as const,
    details: () => ['orders', 'detail'] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
  },
  updateOrderMeta: (...args: unknown[]) => mockUpdateMeta(...args),
}))

import { useUpdateOrderMeta } from '../useOrdersMutations'

describe('useUpdateOrderMeta (Story O4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('PATCHes meta and invalidates lists + the order detail + toasts', async () => {
    const uuid = '2405776e-4660-4857-ab4f-a56a3134dda9'
    mockUpdateMeta.mockResolvedValue({ updated: true })
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateOrderMeta(), {
      wrapper: createQueryWrapper(queryClient),
    })

    result.current.mutate({ orderUuid: uuid, body: { metaType: 'GTIN', value: '0123456789012' } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockUpdateMeta).toHaveBeenCalledWith(uuid, { metaType: 'GTIN', value: '0123456789012' })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['orders', 'list'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['orders', 'detail', uuid] })
    expect(mockToastSuccess).toHaveBeenCalledWith('Код маркировки сохранён')
  })

  it('toasts the backend error message on failure', async () => {
    mockUpdateMeta.mockRejectedValueOnce(new Error('Неверный код маркировки'))
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useUpdateOrderMeta(), {
      wrapper: createQueryWrapper(queryClient),
    })

    result.current.mutate({ orderUuid: 'uuid-1', body: { metaType: 'UIN', value: 'x' } })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockToastError).toHaveBeenCalledWith('Неверный код маркировки')
  })
})
