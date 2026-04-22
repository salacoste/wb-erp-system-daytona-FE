/**
 * Tests for SearchOrdersTable
 * Story 71.5-FE: Search Orders Tab
 * Story 91.1-FE: totalRevenue column removed
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SearchOrderItem } from '@/types/search-analytics'
import { SearchOrdersTable } from '../components/SearchOrdersTable'

// Story 91.1-FE: totalRevenue removed from SearchOrderItem
const mockItems: SearchOrderItem[] = [
  { key: 'платье', totalOrders: 50, uniqueProducts: 10 },
  { key: 'куртка', totalOrders: 30, uniqueProducts: 5 },
  { key: 'обувь', totalOrders: 70, uniqueProducts: 15 },
]

describe('SearchOrdersTable', () => {
  it('renders items in table rows', () => {
    render(<SearchOrdersTable items={mockItems} />)
    expect(screen.getByText('платье')).toBeInTheDocument()
    expect(screen.getByText('куртка')).toBeInTheDocument()
    expect(screen.getByText('обувь')).toBeInTheDocument()
  })

  // Story 91.1-FE: was 4 headers, now 3 (Выручка ₽ removed)
  it('renders 3 column headers', () => {
    render(<SearchOrdersTable items={mockItems} />)
    expect(screen.getByText('Запрос')).toBeInTheDocument()
    expect(screen.getByText('Заказы')).toBeInTheDocument()
    expect(screen.getByText('Товаров')).toBeInTheDocument()
  })

  it('default sort is totalOrders descending', () => {
    render(<SearchOrdersTable items={mockItems} />)
    const rows = screen.getAllByRole('row')
    // First data row (index 1, after header) should be highest totalOrders = 70 (обувь)
    expect(rows[1]).toHaveTextContent('обувь')
    expect(rows[2]).toHaveTextContent('платье')
    expect(rows[3]).toHaveTextContent('куртка')
  })

  it('clicking same header toggles asc/desc', async () => {
    const user = userEvent.setup()
    render(<SearchOrdersTable items={mockItems} />)

    // Default: desc by totalOrders → обувь first
    let rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('обувь')

    // Click "Заказы" to toggle to asc
    const ordersButton = screen.getByText('Заказы')
    await user.click(ordersButton)

    // After asc toggle → куртка first (30)
    rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('куртка')
  })

  // Story 91.1-FE: replaced revenue sort test with uniqueProducts sort test
  it('clicking different header sorts by that column desc', async () => {
    const user = userEvent.setup()
    render(<SearchOrdersTable items={mockItems} />)

    // Click "Товаров" header
    const productsButton = screen.getByText('Товаров')
    await user.click(productsButton)

    const rows = screen.getAllByRole('row')
    // Sorted by uniqueProducts desc: обувь(15) > платье(10) > куртка(5)
    expect(rows[1]).toHaveTextContent('обувь')
    expect(rows[2]).toHaveTextContent('платье')
    expect(rows[3]).toHaveTextContent('куртка')
  })
})
