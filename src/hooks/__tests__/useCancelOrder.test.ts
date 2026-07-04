/**
 * Story O3: useCancelOrder hook tests.
 * Verifies mutation call, cache invalidation, and toast on success/error.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'

const mockCancel = vi.fn()
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
  },
  cancelOrder: (...args: unknown[]) => mockCancel(...args),
}))

import { useCancelOrder } from '../useOrdersMutations'

describe('useCancelOrder (Story O3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls cancelOrder(uuid), invalidates lists, and toasts on success', async () => {
    const uuid = '2405776e-4660-4857-ab4f-a56a3134dda9'
    mockCancel.mockResolvedValue({ canceled: true })
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCancelOrder(), {
      wrapper: createQueryWrapper(queryClient),
    })

    result.current.mutate({ orderUuid: uuid })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockCancel).toHaveBeenCalledWith(uuid)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['orders', 'list'] })
    expect(mockToastSuccess).toHaveBeenCalledWith('Заказ отменён')
  })

  it('toasts the backend error message on failure', async () => {
    mockCancel.mockRejectedValueOnce(new Error('Заказ уже отгружен'))
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useCancelOrder(), {
      wrapper: createQueryWrapper(queryClient),
    })

    result.current.mutate({ orderUuid: 'uuid-1' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockToastError).toHaveBeenCalledWith('Заказ уже отгружен')
  })
})
