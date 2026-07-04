/**
 * Story O1: useUpdateOrderOperationalStatus hook tests.
 * Verifies mutation call, cache invalidation, and toast on success/error.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'

const mockUpdate = vi.fn()
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
  updateOrderOperationalStatus: (...args: unknown[]) => mockUpdate(...args),
}))

import { useUpdateOrderOperationalStatus } from '../useOrdersMutations'

describe('useUpdateOrderOperationalStatus (Story O1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls updateOrderOperationalStatus with uuid + status', async () => {
    const uuid = '2405776e-4660-4857-ab4f-a56a3134dda9'
    mockUpdate.mockResolvedValue({
      id: uuid,
      operationalStatus: 'ASSEMBLED',
      operationalStatusUpdatedAt: '2026-07-04T12:00:00Z',
    })
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateOrderOperationalStatus(), {
      wrapper: createQueryWrapper(queryClient),
    })

    result.current.mutate({ orderUuid: uuid, status: 'ASSEMBLED' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockUpdate).toHaveBeenCalledWith(uuid, 'ASSEMBLED')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['orders', 'list'] })
    expect(mockToastSuccess).toHaveBeenCalledWith('Статус обновлён')
  })

  it('toasts the backend error message on failure', async () => {
    mockUpdate.mockRejectedValueOnce(
      new Error('Invalid transition: NEW -> DELIVERED. Allowed from NEW: ASSEMBLED, CANCELLED')
    )
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useUpdateOrderOperationalStatus(), {
      wrapper: createQueryWrapper(queryClient),
    })

    result.current.mutate({ orderUuid: 'uuid-1', status: 'DELIVERED' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockToastError).toHaveBeenCalledWith(
      'Invalid transition: NEW -> DELIVERED. Allowed from NEW: ASSEMBLED, CANCELLED'
    )
  })
})
