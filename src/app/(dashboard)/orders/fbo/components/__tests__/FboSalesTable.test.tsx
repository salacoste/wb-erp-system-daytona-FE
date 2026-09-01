/**
 * FboSalesTable Unit Tests
 *
 * Verifies sales table rendering:
 * - Loading state shows spinner
 * - Empty state shows message
 * - Sales render with correct columns
 * - Storno (return) rows show destructive badge
 * - Normal rows show default badge
 */

import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { FboSalesTable } from '../FboSalesTable'
import type { SaleFboItem } from '@/types/orders-fbo'

const makeSale = (overrides: Partial<SaleFboItem> = {}): SaleFboItem => ({
  id: 'sale-uuid-1',
  srid: 'SR-1',
  odid: 900001,
  nmId: 100001,
  supplierArticle: 'SKU-A',
  brand: 'TestBrand',
  subject: 'Футболка',
  category: null,
  finishedPrice: 1350,
  forPay: 1200,
  isStorno: false,
  saleDate: '2025-06-01',
  warehouseName: 'Коледино',
  regionName: null,
  createdAt: '2025-06-01T10:00:00Z',
  ...overrides,
})

describe('FboSalesTable', () => {
  it('shows loading spinner when isLoading is true', () => {
    renderWithProviders(
      <FboSalesTable
        sales={[]}
        isLoading={true}
        page={1}
        totalPages={1}
        totalCount={0}
        onPageChange={vi.fn()}
      />
    )
    expect(screen.getByText('Загрузка продаж...')).toBeInTheDocument()
  })

  it('shows empty state when no sales', () => {
    renderWithProviders(
      <FboSalesTable
        sales={[]}
        isLoading={false}
        page={1}
        totalPages={0}
        totalCount={0}
        onPageChange={vi.fn()}
      />
    )
    expect(screen.getByTestId('fbo-sales-empty')).toHaveTextContent(
      'Нет продаж за выбранный период'
    )
  })

  it('renders table headers and sale data', () => {
    const sale = makeSale()
    renderWithProviders(
      <FboSalesTable
        sales={[sale]}
        isLoading={false}
        page={1}
        totalPages={1}
        totalCount={1}
        onPageChange={vi.fn()}
      />
    )
    expect(screen.getByText('Артикул')).toBeInTheDocument()
    expect(screen.getByText('Цена продажи')).toBeInTheDocument()
    expect(screen.getByText('К выплате')).toBeInTheDocument()
    expect(screen.getByText('TestBrand')).toBeInTheDocument()
    expect(screen.getByText('100001')).toBeInTheDocument()
  })

  it('renders the RTC caption when captionText is provided (Story 172.15)', () => {
    renderWithProviders(
      <FboSalesTable
        sales={[makeSale()]}
        isLoading={false}
        page={1}
        totalPages={1}
        totalCount={1}
        onPageChange={vi.fn()}
        captionText="Продажи FBO Wildberries"
      />
    )
    expect(screen.getByRole('caption')).toHaveTextContent('Продажи FBO Wildberries')
    expect(screen.getByRole('region', { name: 'Продажи FBO Wildberries' })).toHaveAttribute(
      'tabindex',
      '0'
    )
  })

  it('renders NO caption element without captionText (Story 172.15)', () => {
    renderWithProviders(
      <FboSalesTable
        sales={[makeSale()]}
        isLoading={false}
        page={1}
        totalPages={1}
        totalCount={1}
        onPageChange={vi.fn()}
      />
    )
    expect(screen.queryByRole('caption')).toBeNull()
  })

  it('renders destructive badge for storno (return) rows', () => {
    const sale = makeSale({ isStorno: true })
    renderWithProviders(
      <FboSalesTable
        sales={[sale]}
        isLoading={false}
        page={1}
        totalPages={1}
        totalCount={1}
        onPageChange={vi.fn()}
      />
    )
    expect(screen.getByText('Возврат')).toBeInTheDocument()
  })

  it('renders default badge for normal sale rows', () => {
    const sale = makeSale({ isStorno: false })
    renderWithProviders(
      <FboSalesTable
        sales={[sale]}
        isLoading={false}
        page={1}
        totalPages={1}
        totalCount={1}
        onPageChange={vi.fn()}
      />
    )
    expect(screen.getByText('Продажа')).toBeInTheDocument()
  })

  it('shows pagination when totalPages > 1', () => {
    renderWithProviders(
      <FboSalesTable
        sales={[makeSale()]}
        isLoading={false}
        page={1}
        totalPages={5}
        totalCount={100}
        onPageChange={vi.fn()}
      />
    )
    expect(screen.getByText(/Стр\. 1 из 5/)).toBeInTheDocument()
  })
})
