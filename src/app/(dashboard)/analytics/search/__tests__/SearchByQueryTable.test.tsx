/**
 * Tests for SearchByQueryTable
 * Story 71.7-FE: By-Query Product Ranking Tab
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SearchProductItem } from '@/types/search-analytics'
import { SearchByQueryTable } from '../components/SearchByQueryTable'

const mockProducts: SearchProductItem[] = [
  {
    nmId: 11111111,
    vendorCode: 'ART-001',
    avgPosition: 5.2,
    totalImpressions: 5000,
    totalClicks: 200,
    avgCtr: 4.0,
    totalOrders: 15,
  },
  {
    nmId: 22222222,
    vendorCode: null,
    avgPosition: 25.7,
    totalImpressions: 8000,
    totalClicks: 350,
    avgCtr: 4.4,
    totalOrders: 25,
  },
  {
    nmId: 33333333,
    vendorCode: 'ART-003',
    avgPosition: 42.1,
    totalImpressions: 3000,
    totalClicks: 100,
    avgCtr: 3.3,
    totalOrders: 8,
  },
]

describe('SearchByQueryTable', () => {
  // Story 91.1-FE: 'Выручка ₽' column removed (was 7, now 6)
  it('renders 6 column headers', () => {
    render(<SearchByQueryTable products={mockProducts} />)
    expect(screen.getByText('Артикул')).toBeInTheDocument()
    expect(screen.getByText('Ср. позиция')).toBeInTheDocument()
    expect(screen.getByText('Показы')).toBeInTheDocument()
    expect(screen.getByText('Клики')).toBeInTheDocument()
    expect(screen.getByText('CTR %')).toBeInTheDocument()
    expect(screen.getByText('Заказы')).toBeInTheDocument()
  })

  it('renders product items with nmId and vendorCode', () => {
    render(<SearchByQueryTable products={mockProducts} />)
    expect(screen.getByText('11111111')).toBeInTheDocument()
    expect(screen.getByText('ART-001')).toBeInTheDocument()
    expect(screen.getByText('22222222')).toBeInTheDocument()
    expect(screen.queryByText('22222222')?.closest('td')?.textContent).not.toContain('ART-')
    expect(screen.getByText('33333333')).toBeInTheDocument()
    expect(screen.getByText('ART-003')).toBeInTheDocument()
  })

  it('default sort is avgPosition ascending', () => {
    render(<SearchByQueryTable products={mockProducts} />)
    const rows = screen.getAllByRole('row')
    // First data row (index 1) = lowest position = 5.2 (nmId 11111111)
    expect(rows[1]).toHaveTextContent('11111111')
    // Second = 25.7 (nmId 22222222)
    expect(rows[2]).toHaveTextContent('22222222')
    // Third = 42.1 (nmId 33333333)
    expect(rows[3]).toHaveTextContent('33333333')
  })

  it('clicking same header toggles asc/desc', async () => {
    const user = userEvent.setup()
    render(<SearchByQueryTable products={mockProducts} />)

    // Default: asc by avgPosition → 11111111 first (5.2)
    let rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('11111111')

    // Click "Ср. позиция" to toggle to desc
    await user.click(screen.getByText('Ср. позиция'))

    // After desc → 33333333 first (42.1)
    rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('33333333')
  })

  it('clicking different header sorts by that column desc', async () => {
    const user = userEvent.setup()
    render(<SearchByQueryTable products={mockProducts} />)

    // Click "Заказы" header
    await user.click(screen.getByText('Заказы'))

    // Sorted by totalOrders desc → 25 (22222222), 15 (11111111), 8 (33333333)
    const rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('22222222')
    expect(rows[2]).toHaveTextContent('11111111')
    expect(rows[3]).toHaveTextContent('33333333')
  })

  it('shows green badge for position 1-10', () => {
    render(<SearchByQueryTable products={mockProducts} />)
    // nmId 11111111 has avgPosition 5.2 → green badge
    const rows = screen.getAllByRole('row')
    const greenBadge = rows[1].querySelector('.bg-green-100')
    expect(greenBadge).toBeInTheDocument()
  })

  it('shows yellow badge for position 11-30', () => {
    render(<SearchByQueryTable products={mockProducts} />)
    // nmId 22222222 has avgPosition 25.7 → yellow badge
    const rows = screen.getAllByRole('row')
    const yellowBadge = rows[2].querySelector('.bg-yellow-100')
    expect(yellowBadge).toBeInTheDocument()
  })

  it('shows red badge for position 31+', () => {
    render(<SearchByQueryTable products={mockProducts} />)
    // nmId 33333333 has avgPosition 42.1 → red badge
    const rows = screen.getAllByRole('row')
    const redBadge = rows[3].querySelector('.bg-red-100')
    expect(redBadge).toBeInTheDocument()
  })
})
