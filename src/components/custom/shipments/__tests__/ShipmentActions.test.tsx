/**
 * Tests for ShipmentActions component
 * Epic 76-FE, Story 76.5: Confirm + Recalculate + Readonly View
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { QueryClient } from '@tanstack/react-query'
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
  useDeleteShipment: () => ({
    mutateAsync: mockDeleteAsync,
    isPending: false,
  }),
}))

vi.mock('@/hooks/use-shipment-calculations', () => ({
  useCalculateShipment: () => ({
    mutateAsync: mockCalculateAsync,
    isPending: false,
  }),
  useConfirmShipment: () => ({
    mutateAsync: mockConfirmAsync,
    isPending: false,
  }),
  useRecalculateShipment: () => ({
    mutateAsync: mockRecalculateAsync,
    isPending: false,
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('../ShipmentEditDialog', () => ({
  ShipmentEditDialog: () => null,
}))

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

describe('ShipmentActions', () => {
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

  describe('DRAFT state', () => {
    it('renders edit, calculate, confirm, and delete buttons', () => {
      renderActions(baseDraftShipment)
      expect(screen.getByText('Редактировать')).toBeInTheDocument()
      expect(screen.getByText('Рассчитать')).toBeInTheDocument()
      expect(screen.getByText('Подтвердить')).toBeInTheDocument()
      expect(screen.getByText('Удалить')).toBeInTheDocument()
    })

    it('does not render recalculate button', () => {
      renderActions(baseDraftShipment)
      expect(screen.queryByText('Пересчитать')).not.toBeInTheDocument()
    })

    it('calls onCalculateStart and onCalculateSuccess on calculate', async () => {
      const onStart = vi.fn()
      const onSuccess = vi.fn()
      const mockResult = { results: [{ nmId: 1 }] }
      mockCalculateAsync.mockResolvedValueOnce(mockResult)

      renderActions(baseDraftShipment, {
        onCalculateStart: onStart,
        onCalculateSuccess: onSuccess,
      })

      await userEvent.click(screen.getByText('Рассчитать'))
      expect(onStart).toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalledWith(mockResult)
    })

    it('calls confirm and shows toast on success', async () => {
      renderActions(baseDraftShipment)
      await userEvent.click(screen.getByText('Подтвердить'))
      expect(mockConfirmAsync).toHaveBeenCalledWith('owner@test.com')
      expect(toast.success).toHaveBeenCalledWith('Отправка подтверждена')
    })
  })

  describe('CONFIRMED state', () => {
    it('renders recalculate button for Owner role', () => {
      mockUserRole = 'Owner'
      renderActions(confirmedShipment)
      expect(screen.getByText('Пересчитать')).toBeInTheDocument()
    })

    it('renders recalculate button for Manager role', () => {
      mockUserRole = 'Manager'
      renderActions(confirmedShipment)
      expect(screen.getByText('Пересчитать')).toBeInTheDocument()
    })

    it('renders recalculate button for Service role', () => {
      mockUserRole = 'Service'
      renderActions(confirmedShipment)
      expect(screen.getByText('Пересчитать')).toBeInTheDocument()
    })

    it('hides recalculate button for Analyst role', () => {
      mockUserRole = 'Analyst'
      renderActions(confirmedShipment)
      expect(screen.queryByText('Пересчитать')).not.toBeInTheDocument()
    })

    it('does not render DRAFT action buttons', () => {
      renderActions(confirmedShipment)
      expect(screen.queryByText('Редактировать')).not.toBeInTheDocument()
      expect(screen.queryByText('Рассчитать')).not.toBeInTheDocument()
      expect(screen.queryByText('Подтвердить')).not.toBeInTheDocument()
      expect(screen.queryByText('Удалить')).not.toBeInTheDocument()
    })

    it('calls recalculate and propagates results', async () => {
      const onStart = vi.fn()
      const onSuccess = vi.fn()
      const mockResult = { results: [{ nmId: 2 }] }
      mockRecalculateAsync.mockResolvedValueOnce(mockResult)

      renderActions(confirmedShipment, {
        onCalculateStart: onStart,
        onCalculateSuccess: onSuccess,
      })

      await userEvent.click(screen.getByText('Пересчитать'))
      expect(onStart).toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalledWith(mockResult)
    })
  })
})
