import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { ShipmentsTable } from '../ShipmentsTable'
import { DeliveryMode, ShipmentStatus, type Shipment } from '@/types/shipment-cost'

const mockShipments: Shipment[] = [
  {
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
    pallets: [
      {
        id: 'p-1',
        shipmentId: 's-001',
        palletNumber: 1,
        boxLines: [],
        createdAt: '',
        updatedAt: '',
      },
    ],
    createdAt: '2026-03-11T10:00:00Z',
    updatedAt: '2026-03-11T10:00:00Z',
  },
  {
    id: 's-002',
    cabinetId: 'cab-001',
    name: 'Подтверждённая',
    deliveryMode: DeliveryMode.PER_PALLET,
    totalDeliveryCost: null,
    palletRate: '3000.0000',
    status: ShipmentStatus.CONFIRMED,
    createdBy: 'test@test.com',
    confirmedBy: 'admin@test.com',
    confirmedAt: '2026-03-11T12:00:00Z',
    supplyId: null,
    pallets: [],
    createdAt: '2026-03-10T10:00:00Z',
    updatedAt: '2026-03-11T12:00:00Z',
  },
]

const defaultProps = {
  shipments: mockShipments,
  total: 2,
  page: 1,
  limit: 10,
  statusFilter: undefined as ShipmentStatus | undefined,
  sortOrder: 'desc' as const,
  onStatusChange: vi.fn(),
  onPageChange: vi.fn(),
  onLimitChange: vi.fn(),
  onSortToggle: vi.fn(),
}

describe('ShipmentsTable', () => {
  it('renders shipment names', () => {
    renderWithProviders(<ShipmentsTable {...defaultProps} />)
    expect(screen.getByText('Мартовская отправка')).toBeInTheDocument()
    expect(screen.getByText('Подтверждённая')).toBeInTheDocument()
  })

  it('renders status badges', () => {
    renderWithProviders(<ShipmentsTable {...defaultProps} />)
    expect(screen.getByText('ЧЕРНОВИК')).toBeInTheDocument()
    expect(screen.getByText('ПОДТВЕРЖДЕНА')).toBeInTheDocument()
  })

  it('renders delivery mode labels', () => {
    renderWithProviders(<ShipmentsTable {...defaultProps} />)
    expect(screen.getByText('Фиксированная стоимость')).toBeInTheDocument()
    expect(screen.getByText('За паллету')).toBeInTheDocument()
  })

  it('renders pallet count', () => {
    renderWithProviders(<ShipmentsTable {...defaultProps} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('renders total count', () => {
    renderWithProviders(<ShipmentsTable {...defaultProps} />)
    expect(screen.getByText('Найдено: 2')).toBeInTheDocument()
  })

  it('renders view buttons with aria-label', () => {
    renderWithProviders(<ShipmentsTable {...defaultProps} />)
    const viewButtons = screen.getAllByRole('link', { name: 'Открыть отправку' })
    expect(viewButtons).toHaveLength(2)
  })

  it('disables prev button on first page', () => {
    renderWithProviders(<ShipmentsTable {...defaultProps} page={1} />)
    expect(screen.getByRole('button', { name: 'Назад' })).toBeDisabled()
  })

  it('disables next button on last page', () => {
    renderWithProviders(<ShipmentsTable {...defaultProps} page={1} total={5} limit={10} />)
    expect(screen.getByRole('button', { name: 'Вперёд' })).toBeDisabled()
  })

  it('renders sort button with aria-label on date column', () => {
    renderWithProviders(<ShipmentsTable {...defaultProps} />)
    const sortBtn = screen.getByRole('button', { name: /сортировать по дате/i })
    expect(sortBtn).toBeInTheDocument()
  })

  it('calls onSortToggle when sort button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ShipmentsTable {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: /сортировать по дате/i }))
    expect(defaultProps.onSortToggle).toHaveBeenCalledOnce()
  })

  it('shows empty message when no shipments match filter', () => {
    renderWithProviders(<ShipmentsTable {...defaultProps} shipments={[]} total={0} />)
    expect(screen.getByText('Нет отправок по фильтру')).toBeInTheDocument()
  })
})
