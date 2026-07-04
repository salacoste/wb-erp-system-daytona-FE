/**
 * Story O2: useConfirmOrder hook tests.
 * Verifies mutation call, cache invalidation, and toast on success/error.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'

const mockConfirm = vi.fn()
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
  confirmOrder: (...args: unknown[]) => mockConfirm(...args),
}))

import { useConfirmOrder } from '../useOrdersMutations'

describe('useConfirmOrder (Story O2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls confirmOrder(uuid), invalidates lists, and toasts on success', async () => {
    const uuid = '2405776e-4660-4857-ab4f-a56a3134dda9'
    mockConfirm.mockResolvedValue({ confirmed: true })
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useConfirmOrder(), {
      wrapper: createQueryWrapper(queryClient),
    })

    result.current.mutate({ orderUuid: uuid })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockConfirm).toHaveBeenCalledWith(uuid)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['orders', 'list'] })
    expect(mockToastSuccess).toHaveBeenCalledWith('Заказ подтверждён')
  })

  it('toasts the backend error message on failure', async () => {
    mockConfirm.mockRejectedValueOnce(new Error('Заказ нельзя подтвердить'))
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useConfirmOrder(), {
      wrapper: createQueryWrapper(queryClient),
    })

    result.current.mutate({ orderUuid: 'uuid-1' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockToastError).toHaveBeenCalledWith('Заказ нельзя подтвердить')
  })
})
