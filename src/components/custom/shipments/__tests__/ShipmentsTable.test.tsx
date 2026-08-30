import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '@/test/utils/test-utils'
import { DeliveryMode, ShipmentStatus, type Shipment } from '@/types/shipment-cost'

import { ShipmentsTable } from '../ShipmentsTable'

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

beforeEach(() => vi.clearAllMocks())

describe('ShipmentsTable', () => {
  it('declares the shipment queue table and responsive contract', () => {
    renderWithProviders(<ShipmentsTable {...defaultProps} />)

    const table = screen.getByRole('table', { name: 'Очередь отправок' })
    expect(table).toHaveAttribute('data-primary-column', 'name')
    expect(table).toHaveAttribute('data-narrow-strategy', 'stacked-detail')
    expect(table).toHaveAttribute('data-pagination-kind', 'offset')
    expect(table).toHaveAttribute('data-sort-direction', 'descending')
  })

  it('renders names, delivery modes, lifecycle statuses, and pallet precision in the table', () => {
    renderWithProviders(<ShipmentsTable {...defaultProps} />)
    const table = screen.getByRole('table', { name: 'Очередь отправок' })

    expect(within(table).getByText('Мартовская отправка')).toBeVisible()
    expect(within(table).getByText('Подтверждённая')).toBeVisible()
    expect(within(table).getByText('Фиксированная стоимость')).toBeVisible()
    expect(within(table).getByText('За паллету')).toBeVisible()
    expect(within(table).getByText('ЧЕРНОВИК').closest('[data-status]')).toHaveAttribute(
      'data-status',
      'pending'
    )
    expect(within(table).getByText('ПОДТВЕРЖДЕНА').closest('[data-status]')).toHaveAttribute(
      'data-status',
      'success'
    )
    expect(within(table).getByRole('cell', { name: '1 паллет' })).toHaveTextContent('1')
  })

  it('names every row action with shipment identity and preserves detail routes', () => {
    renderWithProviders(<ShipmentsTable {...defaultProps} />)
    const table = screen.getByRole('table', { name: 'Очередь отправок' })

    expect(
      within(table).getByRole('link', { name: 'Открыть отправку «Мартовская отправка»' })
    ).toHaveAttribute('href', '/shipments/s-001')
    expect(
      within(table).getByRole('link', { name: 'Открыть отправку «Подтверждённая»' })
    ).toHaveAttribute('href', '/shipments/s-002')
  })

  it('retains identity, status, date, and primary action in the narrow queue', () => {
    renderWithProviders(<ShipmentsTable {...defaultProps} />)
    const narrowQueue = screen.getByRole('group', {
      name: 'Карточки отправок: название, статус, дата и основное действие',
    })

    expect(within(narrowQueue).getByText('Мартовская отправка')).toBeVisible()
    expect(within(narrowQueue).getByText('ЧЕРНОВИК')).toBeVisible()
    expect(within(narrowQueue).getByText('11.03.2026')).toBeVisible()
    expect(
      within(narrowQueue).getByRole('link', {
        name: 'Открыть отправку «Мартовская отправка»',
      })
    ).toHaveAttribute('href', '/shipments/s-001')
  })

  it('uses the shipment id as a visible fallback for partial rows', () => {
    renderWithProviders(
      <ShipmentsTable
        {...defaultProps}
        shipments={[{ ...mockShipments[0], name: null }]}
        total={1}
      />
    )

    const table = screen.getByRole('table', { name: 'Очередь отправок' })
    expect(within(table).getByText('Отправка s-001')).toBeVisible()
    expect(within(table).getByText('Название не указано')).toBeVisible()
  })

  it('shows an explicit neutral fallback for an unknown lifecycle status', () => {
    renderWithProviders(
      <ShipmentsTable
        {...defaultProps}
        shipments={[{ ...mockShipments[0], status: 'LEGACY' as ShipmentStatus }]}
        total={1}
      />
    )

    const table = screen.getByRole('table', { name: 'Очередь отправок' })
    expect(within(table).getByText('НЕИЗВЕСТНЫЙ СТАТУС')).toBeVisible()
    expect(within(table).getByText('LEGACY')).toBeVisible()
  })

  it('exposes the current sort direction and delegates sort changes', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ShipmentsTable {...defaultProps} />)

    const dateHeader = screen.getByRole('columnheader', { name: /дата создания/i })
    expect(dateHeader).toHaveAttribute('aria-sort', 'descending')
    await user.click(screen.getByRole('button', { name: /сортировать по дате/i }))
    expect(defaultProps.onSortToggle).toHaveBeenCalledOnce()
  })

  it('reports result scope and disables pagination at the only page', () => {
    renderWithProviders(<ShipmentsTable {...defaultProps} />)

    expect(screen.getByText('Показано 1–2 из 2')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Предыдущая страница' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Следующая страница' })).toBeDisabled()
  })

  it('exposes filter state and delegates a status change', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ShipmentsTable {...defaultProps} />)

    expect(screen.getByText('Найдено отправок: 2')).toBeVisible()
    await user.click(screen.getByRole('combobox', { name: 'Статус отправки' }))
    await user.click(screen.getByRole('option', { name: 'Черновик' }))
    expect(defaultProps.onStatusChange).toHaveBeenCalledWith(ShipmentStatus.DRAFT)
  })

  it('renders a recoverable filtered-empty state and clears the filter', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ShipmentsTable
        {...defaultProps}
        shipments={[]}
        total={0}
        statusFilter={ShipmentStatus.DRAFT}
      />
    )

    expect(screen.getByText('Нет отправок по выбранному статусу.')).toBeVisible()
    expect(screen.getByText('Применён фильтр: ЧЕРНОВИК.')).toBeVisible()
    const resetButtons = screen.getAllByRole('button', { name: 'Показать все отправки' })
    await user.click(resetButtons.at(-1)!)
    expect(defaultProps.onStatusChange).toHaveBeenCalledWith(undefined)
  })

  it('keeps current data visible and announces background refresh', () => {
    renderWithProviders(<ShipmentsTable {...defaultProps} busy />)

    expect(screen.getByText('Обновляем очередь отправок, текущие данные доступны.')).toBeVisible()
    expect(screen.getByRole('table', { name: 'Очередь отправок' })).toHaveAttribute(
      'aria-busy',
      'true'
    )
  })
})
