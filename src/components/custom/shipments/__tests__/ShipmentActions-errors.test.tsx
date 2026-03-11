/**
 * Error-path tests for ShipmentActions component
 * Epic 76-FE, Story 76.5: Code review fixes — 409 refetch, silent errors, email guard
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/types/api'
import { DeliveryMode, ShipmentStatus, type Shipment } from '@/types/shipment-cost'

let mockUserRole: string | undefined = 'Owner'
let mockUserEmail: string | undefined = 'owner@test.com'
let mockCalculateAsync: ReturnType<typeof vi.fn>
let mockConfirmAsync: ReturnType<typeof vi.fn>
let mockRecalculateAsync: ReturnType<typeof vi.fn>
let mockDeleteAsync: ReturnType<typeof vi.fn>

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      user: {
        get role() {
          return mockUserRole
        },
        get email() {
          return mockUserEmail
        },
      },
    }),
}))

vi.mock('@/hooks/use-shipments', () => ({
  useDeleteShipment: () => ({ mutateAsync: mockDeleteAsync, isPending: false }),
}))

vi.mock('@/hooks/use-shipment-calculations', () => ({
  useCalculateShipment: () => ({ mutateAsync: mockCalculateAsync, isPending: false }),
  useConfirmShipment: () => ({ mutateAsync: mockConfirmAsync, isPending: false }),
  useRecalculateShipment: () => ({ mutateAsync: mockRecalculateAsync, isPending: false }),
}))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('../ShipmentEditDialog', () => ({ ShipmentEditDialog: () => null }))
vi.mock('../ShipmentDeleteDialog', () => ({
  ShipmentDeleteDialog: ({ onDelete }: { onDelete: () => void }) => (
    <button onClick={onDelete}>Удалить</button>
  ),
}))

import { toast } from 'sonner'
import { ShipmentActions } from '../ShipmentActions'

const baseDraftShipment: Shipment = {
  id: 's-001',
  cabinetId: 'cab-1',
  name: 'Test Shipment',
  status: ShipmentStatus.DRAFT,
  deliveryMode: DeliveryMode.PER_PALLET,
  palletRate: '1000.00',
  totalDeliveryCost: null,
  confirmedBy: null,
  confirmedAt: null,
  createdBy: 'owner@test.com',
  supplyId: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  pallets: [],
}

const confirmedShipment: Shipment = {
  ...baseDraftShipment,
  status: ShipmentStatus.CONFIRMED,
  confirmedBy: 'owner@test.com',
  confirmedAt: '2026-01-02T00:00:00Z',
}

let queryClient: QueryClient

function renderActions(shipment: Shipment, props = {}) {
  return render(<ShipmentActions shipment={shipment} {...props} />, {
    wrapper: createQueryWrapper(queryClient),
  })
}

describe('ShipmentActions error paths', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserRole = 'Owner'
    mockUserEmail = 'owner@test.com'
    mockCalculateAsync = vi.fn().mockResolvedValue({ results: [] })
    mockConfirmAsync = vi.fn().mockResolvedValue({})
    mockRecalculateAsync = vi.fn().mockResolvedValue({ results: [] })
    mockDeleteAsync = vi.fn().mockResolvedValue(undefined)
    queryClient = createTestQueryClient()
  })

  it('shows 409 conflict toast on confirm when already confirmed', async () => {
    mockConfirmAsync.mockRejectedValueOnce(new ApiError('Conflict', 409))
    renderActions(baseDraftShipment)
    await userEvent.click(screen.getByText('Подтвердить'))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Отправка уже подтверждена')
    })
  })

  it('invalidates shipment queries on 409 conflict', async () => {
    mockConfirmAsync.mockRejectedValueOnce(new ApiError('Conflict', 409))
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    renderActions(baseDraftShipment)
    await userEvent.click(screen.getByText('Подтвердить'))
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['shipments'] })
    })
  })

  it('shows generic error toast on calculate 500', async () => {
    mockCalculateAsync.mockRejectedValueOnce(new ApiError('Server Error', 500))
    renderActions(baseDraftShipment)
    await userEvent.click(screen.getByText('Рассчитать'))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Ошибка при расчёте')
    })
  })

  it('shows generic error toast on confirm 500', async () => {
    mockConfirmAsync.mockRejectedValueOnce(new ApiError('Server Error', 500))
    renderActions(baseDraftShipment)
    await userEvent.click(screen.getByText('Подтвердить'))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Ошибка при подтверждении')
    })
  })

  it('shows generic error toast on recalculate 500', async () => {
    mockRecalculateAsync.mockRejectedValueOnce(new ApiError('Server Error', 500))
    renderActions(confirmedShipment)
    await userEvent.click(screen.getByText('Пересчитать'))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Ошибка при пересчёте')
    })
  })

  it('blocks confirm and shows toast when user email is missing', async () => {
    mockUserEmail = undefined
    renderActions(baseDraftShipment)
    await userEvent.click(screen.getByText('Подтвердить'))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Не удалось определить пользователя')
    })
    expect(mockConfirmAsync).not.toHaveBeenCalled()
  })

  it('propagates 400 validation errors to onCalculateError', async () => {
    const apiError = new ApiError('Validation failed', 400, {
      errors: [{ errorCode: 'MISSING_COGS', message: 'No COGS', affectedIds: [1] }],
    })
    mockCalculateAsync.mockRejectedValueOnce(apiError)
    const onError = vi.fn()
    renderActions(baseDraftShipment, { onCalculateError: onError })
    await userEvent.click(screen.getByText('Рассчитать'))
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith([
        { code: 'MISSING_COGS', message: 'No COGS', affectedIds: ['1'] },
      ])
    })
  })
})
