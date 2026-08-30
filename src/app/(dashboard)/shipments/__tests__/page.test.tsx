import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '@/test/utils/test-utils'
import { ShipmentStatus } from '@/types/shipment-cost'

const mockRefetch = vi.fn()
const mockSetIsCreateOpen = vi.fn()
let mockRole = 'Manager'
let mockPackaging = [{ id: 'packaging-1' }]
let mockPageState: Record<string, unknown>

vi.mock('../useShipmentsPageState', () => ({
  useShipmentsPageState: () => mockPageState,
}))

vi.mock('@/hooks/use-sku-packaging', () => ({
  useSkuPackaging: () => ({ data: mockPackaging }),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: { user: { role: string } }) => unknown) =>
    selector({ user: { role: mockRole } }),
}))

vi.mock('@/components/custom/shipments', () => ({
  ShipmentsEmptyState: (props: {
    hasSkuPackaging: boolean
    canCreate: boolean
    onCreateClick: () => void
  }) => (
    <div
      data-testid="shipments-empty"
      data-packaging={String(props.hasSkuPackaging)}
      data-can-create={String(props.canCreate)}
    >
      {props.canCreate && (
        <button onClick={props.onCreateClick}>Создать из пустого состояния</button>
      )}
    </div>
  ),
  ShipmentsTable: (props: {
    shipments: unknown[]
    statusFilter?: ShipmentStatus
    busy?: boolean
  }) => (
    <div
      data-testid="shipments-table"
      data-count={props.shipments.length}
      data-status={props.statusFilter}
      data-busy={String(Boolean(props.busy))}
    />
  ),
  CreateShipmentDialog: (props: { open: boolean }) => (
    <div data-testid="create-shipment-dialog" data-open={String(props.open)} />
  ),
}))

import ShipmentsPage from '../page'

function initialState(overrides: Record<string, unknown> = {}) {
  return {
    shipments: [{ id: 'shipment-1' }],
    total: 1,
    page: 1,
    limit: 10,
    statusFilter: undefined,
    sortOrder: 'desc',
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: mockRefetch,
    isCreateOpen: false,
    setIsCreateOpen: mockSetIsCreateOpen,
    handleStatusChange: vi.fn(),
    handlePageChange: vi.fn(),
    handleLimitChange: vi.fn(),
    handleSortToggle: vi.fn(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRole = 'Manager'
  mockPackaging = [{ id: 'packaging-1' }]
  mockPageState = initialState()
})

describe('ShipmentsPage', () => {
  it('keeps route identity visible while the queue loads', () => {
    mockPageState = initialState({ shipments: [], total: 0, isLoading: true, isFetching: true })
    renderWithProviders(<ShipmentsPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Отправки' })).toBeVisible()
    expect(screen.getByRole('region', { name: 'Загружаем отправки' })).toHaveAttribute(
      'data-state',
      'loading'
    )
    expect(screen.queryByTestId('shipments-table')).not.toBeInTheDocument()
  })

  it('renders a recoverable terminal route error', async () => {
    const user = userEvent.setup()
    mockPageState = initialState({
      shipments: [],
      total: 0,
      isError: true,
      error: new Error('Сервис отправок недоступен'),
    })
    renderWithProviders(<ShipmentsPage />)

    expect(screen.getByRole('region', { name: 'Не удалось загрузить отправки' })).toHaveAttribute(
      'data-state',
      'error'
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Сервис отправок недоступен')
    await user.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(mockRefetch).toHaveBeenCalledOnce()
  })

  it('renders the migrated queue and opens creation for an authorized user', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ShipmentsPage />)

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByText(/очередь отправок по жизненному циклу/i)).toBeVisible()
    expect(screen.getByTestId('shipments-table')).toHaveAttribute('data-count', '1')
    await user.click(screen.getByRole('button', { name: 'Создать отправку' }))
    expect(mockSetIsCreateOpen).toHaveBeenCalledWith(true)
    expect(screen.getByTestId('create-shipment-dialog')).toHaveAttribute('data-open', 'false')
  })

  it('preserves previously loaded rows when a background refresh fails', () => {
    mockPageState = initialState({ isError: true, error: new Error('Ошибка обновления') })
    renderWithProviders(<ShipmentsPage />)

    expect(
      screen.getByRole('region', { name: 'Показаны ранее загруженные отправки' })
    ).toHaveAttribute('data-state', 'stale')
    expect(screen.getByText('Ошибка обновления')).toBeVisible()
    expect(screen.getByTestId('shipments-table')).toHaveAttribute('data-count', '1')
  })

  it('passes background-refresh state to the populated queue', () => {
    mockPageState = initialState({ isFetching: true })
    const { container } = renderWithProviders(<ShipmentsPage />)

    expect(container.querySelector('[data-slot="page-header"]')).toHaveAttribute(
      'data-busy',
      'true'
    )
    expect(screen.getByTestId('shipments-table')).toHaveAttribute('data-busy', 'true')
  })

  it('renders the unfiltered empty state with packaging and permission context', async () => {
    const user = userEvent.setup()
    mockPageState = initialState({ shipments: [], total: 0 })
    renderWithProviders(<ShipmentsPage />)

    expect(screen.getByTestId('shipments-empty')).toHaveAttribute('data-packaging', 'true')
    expect(screen.getByTestId('shipments-empty')).toHaveAttribute('data-can-create', 'true')
    await user.click(screen.getByRole('button', { name: 'Создать из пустого состояния' }))
    expect(mockSetIsCreateOpen).toHaveBeenCalledWith(true)
  })

  it('routes filtered-empty data through the table state owner', () => {
    mockPageState = initialState({
      shipments: [],
      total: 0,
      statusFilter: ShipmentStatus.CONFIRMED,
    })
    renderWithProviders(<ShipmentsPage />)

    expect(screen.queryByTestId('shipments-empty')).not.toBeInTheDocument()
    expect(screen.getByTestId('shipments-table')).toHaveAttribute('data-status', 'CONFIRMED')
  })

  it('does not expose create controls to a read-only analyst', () => {
    mockRole = 'Analyst'
    renderWithProviders(<ShipmentsPage />)

    expect(screen.queryByRole('button', { name: 'Создать отправку' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('create-shipment-dialog')).not.toBeInTheDocument()
  })
})
