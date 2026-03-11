import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { ShipmentDetailHeader } from '../ShipmentDetailHeader'
import { DeliveryMode, ShipmentStatus, type Shipment } from '@/types/shipment-cost'

const mockDeleteAsync = vi.fn()
let mockIsDeleting = false

vi.mock('@/hooks/use-shipments', () => ({
  useDeleteShipment: () => ({
    mutateAsync: mockDeleteAsync,
    get isPending() {
      return mockIsDeleting
    },
  }),
  useUpdateShipment: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const baseDraft: Shipment = {
  id: 's-001',
  cabinetId: 'cab-001',
  name: 'Мартовская отправка',
  deliveryMode: DeliveryMode.FIXED_VEHICLE,
  totalDeliveryCost: '15000.0000',
  palletRate: null,
  status: ShipmentStatus.DRAFT,
  createdBy: 'test@test.com',
  confirmedBy: null,
  confirmedAt: null,
  supplyId: null,
  pallets: [],
  createdAt: '2026-03-11T10:00:00Z',
  updatedAt: '2026-03-11T10:00:00Z',
}

const confirmedShipment: Shipment = {
  ...baseDraft,
  id: 's-002',
  status: ShipmentStatus.CONFIRMED,
  confirmedBy: 'admin@test.com',
  confirmedAt: '2026-03-11T12:00:00Z',
}

describe('ShipmentDetailHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsDeleting = false
  })

  it('renders shipment name and status badge for DRAFT', () => {
    renderWithProviders(<ShipmentDetailHeader shipment={baseDraft} />)
    expect(screen.getByText('Мартовская отправка')).toBeInTheDocument()
    expect(screen.getByText('ЧЕРНОВИК')).toBeInTheDocument()
  })

  it('renders delivery mode and formatted cost', () => {
    renderWithProviders(<ShipmentDetailHeader shipment={baseDraft} />)
    expect(screen.getByText('Фиксированная стоимость')).toBeInTheDocument()
    expect(screen.getByText(/15\s?000/)).toBeInTheDocument()
  })

  it('renders formatted dates', () => {
    renderWithProviders(<ShipmentDetailHeader shipment={baseDraft} />)
    const dates = screen.getAllByText('11.03.2026')
    expect(dates).toHaveLength(2) // created + updated
  })

  it('shows edit and delete buttons for DRAFT', () => {
    renderWithProviders(<ShipmentDetailHeader shipment={baseDraft} />)
    expect(screen.getByText('Редактировать')).toBeInTheDocument()
    expect(screen.getByText('Удалить')).toBeInTheDocument()
  })

  it('hides edit and delete buttons for CONFIRMED', () => {
    renderWithProviders(<ShipmentDetailHeader shipment={confirmedShipment} />)
    expect(screen.queryByText('Редактировать')).not.toBeInTheDocument()
    expect(screen.queryByText('Удалить')).not.toBeInTheDocument()
  })

  it('shows lock icon for CONFIRMED status', () => {
    renderWithProviders(<ShipmentDetailHeader shipment={confirmedShipment} />)
    expect(screen.getByText('ПОДТВЕРЖДЕНА')).toBeInTheDocument()
  })

  it('renders dash when name is null', () => {
    renderWithProviders(<ShipmentDetailHeader shipment={{ ...baseDraft, name: null }} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('calls deleteAsync when delete is confirmed', async () => {
    const user = userEvent.setup()
    mockDeleteAsync.mockResolvedValueOnce(undefined)
    renderWithProviders(<ShipmentDetailHeader shipment={baseDraft} />)

    await user.click(screen.getByLabelText('Удалить отправку'))

    await waitFor(() => {
      expect(screen.getByText('Вы уверены? Это действие невозможно отменить.')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Удалить' }))

    await waitFor(() => {
      expect(mockDeleteAsync).toHaveBeenCalledWith('s-001')
    })
  })

  it('opens edit dialog when edit button clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ShipmentDetailHeader shipment={baseDraft} />)

    await user.click(screen.getByText('Редактировать'))

    await waitFor(() => {
      expect(screen.getByText('Редактировать отправку')).toBeInTheDocument()
    })
  })
})
