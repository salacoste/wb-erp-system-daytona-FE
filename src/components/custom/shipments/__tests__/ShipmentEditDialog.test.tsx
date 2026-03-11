import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { ShipmentEditDialog } from '../ShipmentEditDialog'
import { DeliveryMode, ShipmentStatus, type Shipment } from '@/types/shipment-cost'

const mockMutateAsync = vi.fn()
let mockIsPending = false

vi.mock('@/hooks/use-shipments', () => ({
  useUpdateShipment: () => ({
    mutateAsync: mockMutateAsync,
    get isPending() {
      return mockIsPending
    },
  }),
}))

const baseShipment: Shipment = {
  id: 's-001',
  cabinetId: 'cab-001',
  name: 'Тестовая отправка',
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

describe('ShipmentEditDialog', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsPending = false
  })

  it('renders dialog with pre-filled name', () => {
    renderWithProviders(
      <ShipmentEditDialog shipment={baseShipment} open={true} onClose={onClose} />
    )
    expect(screen.getByText('Редактировать отправку')).toBeInTheDocument()
    expect(screen.getByLabelText('Название')).toHaveValue('Тестовая отправка')
  })

  it('renders pre-filled cost for FIXED_VEHICLE', () => {
    renderWithProviders(
      <ShipmentEditDialog shipment={baseShipment} open={true} onClose={onClose} />
    )
    expect(screen.getByLabelText('Общая стоимость доставки (₽)')).toHaveValue(15000)
  })

  it('renders cost label for PER_PALLET mode', () => {
    const perPallet: Shipment = {
      ...baseShipment,
      deliveryMode: DeliveryMode.PER_PALLET,
      totalDeliveryCost: null,
      palletRate: '3000.0000',
    }
    renderWithProviders(<ShipmentEditDialog shipment={perPallet} open={true} onClose={onClose} />)
    expect(screen.getByLabelText('Стоимость за паллету (₽)')).toHaveValue(3000)
  })

  it('shows delivery mode as read-only label', () => {
    renderWithProviders(
      <ShipmentEditDialog shipment={baseShipment} open={true} onClose={onClose} />
    )
    expect(screen.getByText('Фиксированная стоимость')).toBeInTheDocument()
  })

  it('shows validation errors on empty submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ShipmentEditDialog shipment={baseShipment} open={true} onClose={onClose} />
    )

    const nameInput = screen.getByLabelText('Название')
    await user.clear(nameInput)
    const costInput = screen.getByLabelText('Общая стоимость доставки (₽)')
    await user.clear(costInput)
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => {
      expect(screen.getByText('Название обязательно')).toBeInTheDocument()
      expect(screen.getByText('Введите число больше 0')).toBeInTheDocument()
    })
  })

  it('sets aria-invalid on inputs with errors', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ShipmentEditDialog shipment={baseShipment} open={true} onClose={onClose} />
    )

    await user.clear(screen.getByLabelText('Название'))
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Название')).toHaveAttribute('aria-invalid', 'true')
    })
  })

  it('calls mutateAsync with correct data on valid submit', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockResolvedValueOnce({})
    renderWithProviders(
      <ShipmentEditDialog shipment={baseShipment} open={true} onClose={onClose} />
    )

    const nameInput = screen.getByLabelText('Название')
    await user.clear(nameInput)
    await user.type(nameInput, 'Обновлённая')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        id: 's-001',
        data: { name: 'Обновлённая', totalDeliveryCost: 15000 },
      })
    })
  })

  it('shows error message when submit fails', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockRejectedValueOnce(new Error('Conflict'))
    renderWithProviders(
      <ShipmentEditDialog shipment={baseShipment} open={true} onClose={onClose} />
    )

    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => {
      expect(screen.getByText('Conflict')).toBeInTheDocument()
    })
  })

  it('disables submit button during pending', () => {
    mockIsPending = true
    renderWithProviders(
      <ShipmentEditDialog shipment={baseShipment} open={true} onClose={onClose} />
    )
    expect(screen.getByRole('button', { name: /сохранение/i })).toBeDisabled()
  })
})
