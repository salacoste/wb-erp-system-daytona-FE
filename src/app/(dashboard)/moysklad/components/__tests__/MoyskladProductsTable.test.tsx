/**
 * Component tests — MoyskladProductsTable (M2 «МС товары» tab).
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 *
 * Covers: row rendering with formatted prices, «—» on null article/price/updated,
 * pager (Назад/Вперёд + «Показано N–M из total», disabled state, offset advance),
 * empty state, and the live-call error banner (graceful, no crash).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MoyskladProductsTable } from '../MoyskladProductsTable'
import type { MoyskladProduct, MoyskladProductsResponse } from '@/types/moysklad'

// Controlled per-test mock.
const useMoyskladProductsMock = vi.fn()
vi.mock('@/hooks/useMoyskladQueries', () => ({
  useMoyskladProducts: (...args: unknown[]) => useMoyskladProductsMock(...args),
}))

const rowWithPrices = {
  id: 'prod-1',
  name: 'Футболка белая',
  article: 'WB-001',
  code: '00001',
  externalCode: 'ext-1',
  buyPriceRub: 70800,
  salePriceRub: 12000,
  updated: '2026-07-01T10:00:00.000Z',
} satisfies MoyskladProduct

const rowMissingPrices = {
  id: 'prod-2',
  name: 'Носки (без цены)',
  article: null,
  code: null,
  externalCode: null,
  buyPriceRub: null,
  salePriceRub: null,
  updated: null,
} satisfies MoyskladProduct

const dataResponse = (rows: MoyskladProduct[], total = 394): MoyskladProductsResponse => ({
  rows,
  total,
})

describe('MoyskladProductsTable', () => {
  beforeEach(() => {
    useMoyskladProductsMock.mockReturnValue({
      data: dataResponse([rowWithPrices, rowMissingPrices]),
    })
  })

  it('renders a product row with name, article, code, and formatted prices', () => {
    render(<MoyskladProductsTable />)
    expect(screen.getByText('Футболка белая')).toBeInTheDocument()
    expect(screen.getByText('WB-001')).toBeInTheDocument()
    expect(screen.getByText('00001')).toBeInTheDocument()
    // formatCurrency(70800) → "70 800 ₽"; formatCurrency(12000) → "12 000 ₽".
    expect(screen.getByText('70 800 ₽')).toBeInTheDocument()
    expect(screen.getByText('12 000 ₽')).toBeInTheDocument()
  })

  it('renders «—» for null article/code/prices/updated (AP#8 — money never 0)', () => {
    render(<MoyskladProductsTable />)
    // article/code null → «—». The row with null name shows «—» too.
    // Prices null → «—». Multiple «—» cells exist; verify the row name renders.
    expect(screen.getByText('Носки (без цены)')).toBeInTheDocument()
    // The «—» glyph appears for article, code, buyPrice, salePrice, updated cells.
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(5)
  })

  it('shows the pager hint «Показано N–M из total»', () => {
    render(<MoyskladProductsTable />)
    expect(screen.getByText(/Показано 1–2 из 394/)).toBeInTheDocument()
  })

  it('disables Назад on the first page and enables Вперёд when more rows exist', () => {
    render(<MoyskladProductsTable />)
    expect(screen.getByRole('button', { name: /Назад/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Вперёд/ })).toBeEnabled()
  })

  it('advances offset when Вперёд is clicked (calls hook with new offset)', () => {
    render(<MoyskladProductsTable />)
    fireEvent.click(screen.getByRole('button', { name: /Вперёд/ }))
    // PAGE_SIZE=20 → second call has offset 20.
    expect(useMoyskladProductsMock).toHaveBeenLastCalledWith({ limit: 20, offset: 20 })
  })

  it('disables Вперёд on the last page (offset + rows >= total)', () => {
    useMoyskladProductsMock.mockReturnValue({
      data: dataResponse([rowWithPrices], 1),
    })
    render(<MoyskladProductsTable />)
    expect(screen.getByRole('button', { name: /Вперёд/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Назад/ })).toBeDisabled()
  })

  it('shows the empty state when there are no products', () => {
    useMoyskladProductsMock.mockReturnValue({ data: dataResponse([], 0) })
    render(<MoyskladProductsTable />)
    expect(screen.getByText('Нет товаров в МойСклад')).toBeInTheDocument()
    expect(screen.getByText(/Показано 0 из 0/)).toBeInTheDocument()
  })

  it('renders the product table skeleton while the live products request is loading', () => {
    useMoyskladProductsMock.mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: true,
    })

    const { container } = render(<MoyskladProductsTable />)

    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(1)
    expect(screen.queryByText('Нет товаров в МойСклад')).not.toBeInTheDocument()
  })

  it('surfaces the live-call error banner (graceful, no crash)', () => {
    useMoyskladProductsMock.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
    })
    render(<MoyskladProductsTable />)
    expect(
      screen.getByText(/Не удалось загрузить товары из МойСклад — проверьте подключение/)
    ).toBeInTheDocument()
  })
})
