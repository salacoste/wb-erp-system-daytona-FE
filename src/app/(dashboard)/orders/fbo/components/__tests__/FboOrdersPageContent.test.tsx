import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/utils/test-utils'
import type { OrderFboItem, SaleFboItem } from '@/types/orders-fbo'

import { FboOrdersPageContent } from '../FboOrdersPageContent'

const mocks = vi.hoisted(() => ({
  useOrdersFbo: vi.fn(),
  useSalesFbo: vi.fn(),
  ordersRefetch: vi.fn(),
  salesRefetch: vi.fn(),
}))

vi.mock('@/hooks/useOrdersFbo', () => ({
  useOrdersFbo: (...args: unknown[]) => mocks.useOrdersFbo(...args),
  useOrdersFboAggregate: () => ({ data: undefined, isLoading: false }),
  useOrdersFboSyncStatus: () => ({ data: null }),
  useSyncOrdersFbo: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/hooks/useSalesFbo', () => ({
  useSalesFbo: (...args: unknown[]) => mocks.useSalesFbo(...args),
  useSalesFboAggregate: () => ({ data: undefined, isLoading: false }),
}))

const emptyPage = {
  items: [],
  pagination: { total: 0, limit: 20, offset: 0 },
}

const order = {
  id: 'order-row-1',
  orderId: 'order-1',
  srid: 'SR-1',
  nmId: 1743001,
  supplierArticle: 'SKU-174-3',
  barcode: null,
  brand: 'Story Brand',
  subject: 'Футболка',
  category: null,
  totalPrice: 1500,
  discountPercent: 10,
  spp: null,
  finishedPrice: 1350,
  priceWithDisc: 1350,
  warehouseName: 'Коледино',
  regionName: null,
  orderDate: '2026-08-31',
  isCancel: false,
  createdAt: '2026-08-31T10:00:00Z',
  updatedAt: '2026-08-31T10:00:00Z',
} satisfies OrderFboItem

const sale = {
  id: 'sale-row-1',
  srid: 'SALE-SR-1',
  odid: 1743002,
  nmId: 1743002,
  supplierArticle: 'SALE-SKU-174-3',
  brand: 'Story Sale Brand',
  subject: 'Носки',
  category: null,
  finishedPrice: 900,
  forPay: 810,
  isStorno: false,
  saleDate: '2026-08-31',
  warehouseName: 'Электросталь',
  regionName: null,
  createdAt: '2026-08-31T10:00:00Z',
} satisfies SaleFboItem

describe('FboOrdersPageContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.ordersRefetch.mockResolvedValue({})
    mocks.salesRefetch.mockResolvedValue({})
    mocks.useOrdersFbo.mockReturnValue({
      data: emptyPage,
      isLoading: false,
      isError: false,
      refetch: mocks.ordersRefetch,
    })
    mocks.useSalesFbo.mockReturnValue({
      data: emptyPage,
      isLoading: false,
      isError: false,
      refetch: mocks.salesRefetch,
    })
  })

  it('renders page title, filters, and tab triggers', () => {
    renderWithProviders(<FboOrdersPageContent />)

    expect(screen.getByText('FBO Заказы и продажи')).toBeInTheDocument()
    expect(screen.getByTestId('fbo-date-from')).toBeInTheDocument()
    expect(screen.getByTestId('fbo-date-to')).toBeInTheDocument()
    expect(screen.getByTestId('fbo-search')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Заказы' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Продажи' })).toBeInTheDocument()
    expect(screen.getByTestId('fbo-orders-page')).toBeInTheDocument()
  })

  it('renders the orders loading state while the orders list has no data', () => {
    mocks.useOrdersFbo.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: mocks.ordersRefetch,
    })

    renderWithProviders(<FboOrdersPageContent />)

    expect(screen.getByText('Загрузка заказов...')).toBeInTheDocument()
    expect(screen.queryByTestId('fbo-orders-empty')).not.toBeInTheDocument()
  })

  it('renders the orders empty state after an empty list resolves', () => {
    renderWithProviders(<FboOrdersPageContent />)

    expect(screen.getByTestId('fbo-orders-empty')).toHaveTextContent(
      'Нет заказов за выбранный период'
    )
  })

  it('renders a filtered-empty orders state after an unmatched article search', () => {
    renderWithProviders(<FboOrdersPageContent />)

    fireEvent.change(screen.getByLabelText('Поиск по артикулу'), {
      target: { value: '987654321' },
    })

    expect(mocks.useOrdersFbo).toHaveBeenLastCalledWith(
      expect.objectContaining({ nm_id: 987654321, offset: 0 })
    )
    expect(screen.getByTestId('fbo-orders-empty')).toHaveTextContent(
      'Нет заказов за выбранный период'
    )
  })

  it('advances orders pagination and requests the next offset', () => {
    mocks.useOrdersFbo.mockReturnValue({
      data: {
        items: [order],
        pagination: { total: 40, limit: 20, offset: 0 },
      },
      isLoading: false,
      isError: false,
      refetch: mocks.ordersRefetch,
    })

    renderWithProviders(<FboOrdersPageContent />)
    fireEvent.click(screen.getByRole('button', { name: 'Следующая страница' }))

    expect(mocks.useOrdersFbo).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 20 }))
    expect(screen.getByText('Стр. 2 из 2')).toBeInTheDocument()
  })

  it('renders a recoverable orders error instead of an empty result and retries the query', () => {
    mocks.useOrdersFbo.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mocks.ordersRefetch,
    })

    renderWithProviders(<FboOrdersPageContent />)

    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось загрузить заказы FBO.')
    expect(screen.queryByTestId('fbo-orders-empty')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(mocks.ordersRefetch).toHaveBeenCalledTimes(1)
  })

  it('keeps cached orders visible when refresh fails and retries the query', () => {
    mocks.useOrdersFbo.mockReturnValue({
      data: {
        items: [order],
        pagination: { total: 1, limit: 20, offset: 0 },
      },
      isLoading: false,
      isError: true,
      refetch: mocks.ordersRefetch,
    })

    renderWithProviders(<FboOrdersPageContent />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Не удалось обновить заказы FBO. Показаны ранее загруженные данные.'
    )
    expect(screen.getByText('Story Brand')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(mocks.ordersRefetch).toHaveBeenCalledTimes(1)
  })

  it('renders a recoverable sales error instead of an empty result and retries the query', async () => {
    const user = userEvent.setup()
    mocks.useSalesFbo.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mocks.salesRefetch,
    })

    renderWithProviders(<FboOrdersPageContent />)
    await user.click(screen.getByRole('tab', { name: 'Продажи' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось загрузить продажи FBO.')
    expect(screen.queryByTestId('fbo-sales-empty')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(mocks.salesRefetch).toHaveBeenCalledTimes(1)
  })

  it('renders the sales loading state while the sales list has no data', async () => {
    const user = userEvent.setup()
    mocks.useSalesFbo.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: mocks.salesRefetch,
    })

    renderWithProviders(<FboOrdersPageContent />)
    await user.click(screen.getByRole('tab', { name: 'Продажи' }))

    expect(screen.getByText('Загрузка продаж...')).toBeInTheDocument()
  })

  it('keeps cached sales visible when refresh fails', async () => {
    const user = userEvent.setup()
    mocks.useSalesFbo.mockReturnValue({
      data: {
        items: [sale],
        pagination: { total: 1, limit: 20, offset: 0 },
      },
      isLoading: false,
      isError: true,
      refetch: mocks.salesRefetch,
    })

    renderWithProviders(<FboOrdersPageContent />)
    await user.click(screen.getByRole('tab', { name: 'Продажи' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Не удалось обновить продажи FBO. Показаны ранее загруженные данные.'
    )
    expect(screen.getByText('Story Sale Brand')).toBeInTheDocument()
  })
})
