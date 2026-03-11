import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { PalletAccordion } from '../PalletAccordion'
import type { Pallet } from '@/types/shipment-cost'

const mockAddAsync = vi.fn()
const mockRemoveAsync = vi.fn()
let mockIsAdding = false
let mockIsRemoving = false

vi.mock('@/hooks/use-box-lines', () => ({
  useAddBoxLine: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateBoxLine: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRemoveBoxLine: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    variables: undefined,
  }),
}))

vi.mock('@/hooks/use-sku-packaging', () => ({
  useSkuPackagingByNmId: () => ({ isError: false, isFetched: false }),
}))

vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({ data: null, isFetched: false }),
}))

vi.mock('@/hooks/use-shipment-detail', () => ({
  useAddPallet: () => ({
    mutateAsync: mockAddAsync,
    get isPending() {
      return mockIsAdding
    },
  }),
  useRemovePallet: () => ({
    mutateAsync: mockRemoveAsync,
    get isPending() {
      return mockIsRemoving
    },
  }),
}))

const mockPallets: Pallet[] = [
  {
    id: 'p-1',
    shipmentId: 's-001',
    palletNumber: 1,
    boxLines: [
      {
        id: 'bl-1',
        palletId: 'p-1',
        nmId: 100,
        boxCount: 5,
        totalUnits: null,
        unitCostRub: null,
        boxVolume: null,
        totalVolume: null,
        volumeShare: null,
        allocatedDeliveryCost: null,
        deliveryCostPerUnit: null,
        finalCostPerUnit: null,
        finalCostLine: null,
        createdAt: '',
        updatedAt: '',
      },
    ],
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'p-2',
    shipmentId: 's-001',
    palletNumber: 2,
    boxLines: [],
    createdAt: '',
    updatedAt: '',
  },
]

describe('PalletAccordion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAdding = false
    mockIsRemoving = false
  })

  it('renders pallet count in heading', () => {
    renderWithProviders(<PalletAccordion shipmentId="s-001" pallets={mockPallets} isDraft={true} />)
    expect(screen.getByText('Паллеты (2)')).toBeInTheDocument()
  })

  it('renders pallet headers with numbers', () => {
    renderWithProviders(<PalletAccordion shipmentId="s-001" pallets={mockPallets} isDraft={true} />)
    expect(screen.getByText(/Паллета #1/)).toBeInTheDocument()
    expect(screen.getByText(/Паллета #2/)).toBeInTheDocument()
  })

  it('renders box line count per pallet', () => {
    renderWithProviders(<PalletAccordion shipmentId="s-001" pallets={mockPallets} isDraft={true} />)
    expect(screen.getByText('(1 товаров)')).toBeInTheDocument()
    expect(screen.getByText('(0 товаров)')).toBeInTheDocument()
  })

  it('shows add button for DRAFT', () => {
    renderWithProviders(<PalletAccordion shipmentId="s-001" pallets={mockPallets} isDraft={true} />)
    expect(screen.getByText('Добавить паллету')).toBeInTheDocument()
  })

  it('hides add button for CONFIRMED', () => {
    renderWithProviders(
      <PalletAccordion shipmentId="s-001" pallets={mockPallets} isDraft={false} />
    )
    expect(screen.queryByText('Добавить паллету')).not.toBeInTheDocument()
  })

  it('calls addAsync when add button clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PalletAccordion shipmentId="s-001" pallets={mockPallets} isDraft={true} />)
    await user.click(screen.getByText('Добавить паллету'))
    expect(mockAddAsync).toHaveBeenCalledOnce()
  })

  it('shows empty message when no pallets', () => {
    renderWithProviders(<PalletAccordion shipmentId="s-001" pallets={[]} isDraft={true} />)
    expect(screen.getByText('Паллеты ещё не добавлены')).toBeInTheDocument()
  })

  it('shows remove buttons for DRAFT pallets', () => {
    renderWithProviders(<PalletAccordion shipmentId="s-001" pallets={mockPallets} isDraft={true} />)
    expect(screen.getByLabelText('Удалить паллету 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Удалить паллету 2')).toBeInTheDocument()
  })

  it('hides remove buttons for CONFIRMED pallets', () => {
    renderWithProviders(
      <PalletAccordion shipmentId="s-001" pallets={mockPallets} isDraft={false} />
    )
    expect(screen.queryByLabelText('Удалить паллету 1')).not.toBeInTheDocument()
  })

  it('expands pallet to show box line empty state', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <PalletAccordion shipmentId="s-001" pallets={[mockPallets[1]]} isDraft={true} />
    )
    await user.click(screen.getByLabelText('Раскрыть паллету 2'))
    expect(screen.getByText('Товары ещё не добавлены')).toBeInTheDocument()
  })
})
