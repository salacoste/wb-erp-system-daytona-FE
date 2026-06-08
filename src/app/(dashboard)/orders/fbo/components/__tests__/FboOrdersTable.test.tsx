/**
 * FboOrdersTable Unit Tests
 *
 * Verifies table rendering:
 * - Loading state shows spinner
 * - Empty state shows message
 * - Orders render with correct columns
 * - Pagination controls appear when totalPages > 1
 * - Cancelled orders show destructive badge
 */

import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { FboOrdersTable } from '../FboOrdersTable'
import type { OrderFboItem } from '@/types/orders-fbo'

const makeOrder = (overrides: Partial<OrderFboItem> = {}): OrderFboItem => ({
  id: 'uuid-1',
  orderId: '123456',
  srid: 'SR-1',
  nmId: 100001,
  supplierArticle: 'SKU-A',
  barcode: null,
  brand: 'TestBrand',
  subject: 'Футболка',
  category: null,
  totalPrice: 1500,
  discountPercent: 10,
  spp: null,
  finishedPrice: 1350,
  priceWithDisc: 1350,
  warehouseName: 'Коледино',
  regionName: null,
  orderDate: '2025-06-01',
  isCancel: false,
  createdAt: '2025-06-01T10:00:00Z',
  updatedAt: '2025-06-01T10:00:00Z',
  ...overrides,
})

describe('FboOrdersTable', () => {
  it('shows loading spinner when isLoading is true', () => {
    renderWithProviders(
      <FboOrdersTable
        orders={[]}
        isLoading={true}
        page={1}
        totalPages={1}
        totalCount={0}
        onPageChange={vi.fn()}
      />
    )
    expect(screen.getByText('Загрузка заказов...')).toBeInTheDocument()
  })

  it('shows empty state when no orders', () => {
    renderWithProviders(
      <FboOrdersTable
        orders={[]}
        isLoading={false}
        page={1}
        totalPages={0}
        totalCount={0}
        onPageChange={vi.fn()}
      />
    )
    expect(screen.getByTestId('fbo-orders-empty')).toHaveTextContent(
      'Нет заказов за выбранный период'
    )
  })

  it('renders table headers and order data', () => {
    const order = makeOrder()
    renderWithProviders(
      <FboOrdersTable
        orders={[order]}
        isLoading={false}
        page={1}
        totalPages={1}
        totalCount={1}
        onPageChange={vi.fn()}
      />
    )
    expect(screen.getByText('Артикул')).toBeInTheDocument()
    expect(screen.getByText('Бренд')).toBeInTheDocument()
    expect(screen.getByText('Статус')).toBeInTheDocument()
    expect(screen.getByText('TestBrand')).toBeInTheDocument()
    expect(screen.getByText('100001')).toBeInTheDocument()
  })

  it('renders destructive badge for cancelled orders', () => {
    const order = makeOrder({ isCancel: true })
    renderWithProviders(
      <FboOrdersTable
        orders={[order]}
        isLoading={false}
        page={1}
        totalPages={1}
        totalCount={1}
        onPageChange={vi.fn()}
      />
    )
    expect(screen.getByText('Отменён')).toBeInTheDocument()
  })

  it('renders default badge for active orders', () => {
    const order = makeOrder({ isCancel: false })
    renderWithProviders(
      <FboOrdersTable
        orders={[order]}
        isLoading={false}
        page={1}
        totalPages={1}
        totalCount={1}
        onPageChange={vi.fn()}
      />
    )
    expect(screen.getByText('Активен')).toBeInTheDocument()
  })

  it('shows pagination controls when totalPages > 1', () => {
    const orders = [makeOrder()]
    renderWithProviders(
      <FboOrdersTable
        orders={orders}
        isLoading={false}
        page={2}
        totalPages={3}
        totalCount={60}
        onPageChange={vi.fn()}
      />
    )
    expect(screen.getByLabelText('Предыдущая страница')).toBeInTheDocument()
    expect(screen.getByLabelText('Следующая страница')).toBeInTheDocument()
    expect(screen.getByText(/Стр\. 2 из 3/)).toBeInTheDocument()
  })

  it('disables previous button on first page', () => {
    const orders = [makeOrder()]
    renderWithProviders(
      <FboOrdersTable
        orders={orders}
        isLoading={false}
        page={1}
        totalPages={3}
        totalCount={60}
        onPageChange={vi.fn()}
      />
    )
    expect(screen.getByLabelText('Предыдущая страница')).toBeDisabled()
    expect(screen.getByLabelText('Следующая страница')).not.toBeDisabled()
  })
})
