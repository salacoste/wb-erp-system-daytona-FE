/**
 * Tests for SearchOrdersTable
 * Story 71.5-FE: Search Orders Tab
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SearchOrderItem } from '@/types/search-analytics'
import { SearchOrdersTable } from '../components/SearchOrdersTable'

const mockItems: SearchOrderItem[] = [
  { key: 'платье', totalOrders: 50, totalRevenue: 250000, uniqueProducts: 5 },
  { key: 'куртка', totalOrders: 30, totalRevenue: 180000, uniqueProducts: 3 },
  { key: 'обувь', totalOrders: 70, totalRevenue: 350000, uniqueProducts: 8 },
]

describe('SearchOrdersTable', () => {
  it('renders items in table rows', () => {
    render(<SearchOrdersTable items={mockItems} />)
    expect(screen.getByText('платье')).toBeInTheDocument()
    expect(screen.getByText('куртка')).toBeInTheDocument()
    expect(screen.getByText('обувь')).toBeInTheDocument()
  })

  it('renders 4 column headers', () => {
    render(<SearchOrdersTable items={mockItems} />)
    expect(screen.getByText('Запрос')).toBeInTheDocument()
    expect(screen.getByText('Заказы')).toBeInTheDocument()
    expect(screen.getByText('Выручка ₽')).toBeInTheDocument()
    expect(screen.getByText('Товаров')).toBeInTheDocument()
  })

  it('default sort is totalOrders descending', () => {
    render(<SearchOrdersTable items={mockItems} />)
    const rows = screen.getAllByRole('row')
    // First data row (index 1, after header) should be highest totalOrders = 70 (обувь)
    expect(rows[1]).toHaveTextContent('обувь')
    // Second data row should be 50 (платье)
    expect(rows[2]).toHaveTextContent('платье')
    // Third data row should be 30 (куртка)
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

  it('clicking different header sorts by that column desc', async () => {
    const user = userEvent.setup()
    render(<SearchOrdersTable items={mockItems} />)

    // Click "Выручка ₽" header
    const revenueButton = screen.getByText('Выручка ₽')
    await user.click(revenueButton)

    // Sorted by totalRevenue desc → обувь (350000), платье (250000), куртка (180000)
    const rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('обувь')
    expect(rows[2]).toHaveTextContent('платье')
    expect(rows[3]).toHaveTextContent('куртка')
  })
})
