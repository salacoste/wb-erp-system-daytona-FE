/**
 * Tests for SearchByProductTable
 * Story 71.6-FE: By-Product Keyword Explorer Tab
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SearchQueryItem } from '@/types/search-analytics'
import { SearchByProductTable } from '../components/SearchByProductTable'

const mockQueries: SearchQueryItem[] = [
  {
    searchQuery: 'платье летнее',
    avgPosition: 12.3,
    totalImpressions: 5000,
    totalClicks: 200,
    avgCtr: 4.0,
    totalOrders: 15,
  },
  {
    searchQuery: 'платье красное',
    avgPosition: 8.1,
    totalImpressions: 8000,
    totalClicks: 350,
    avgCtr: 4.4,
    totalOrders: 25,
  },
  {
    searchQuery: 'платье вечернее',
    avgPosition: 20.5,
    totalImpressions: 3000,
    totalClicks: 100,
    avgCtr: 3.3,
    totalOrders: 8,
  },
]

describe('SearchByProductTable', () => {
  // Story 91.1-FE: 'Выручка ₽' column removed (was 7, now 6)
  it('renders 6 column headers', () => {
    render(<SearchByProductTable queries={mockQueries} />)
    expect(screen.getByText('Запрос')).toBeInTheDocument()
    expect(screen.getByText('Ср. позиция')).toBeInTheDocument()
    expect(screen.getByText('Показы')).toBeInTheDocument()
    expect(screen.getByText('Клики')).toBeInTheDocument()
    expect(screen.getByText('CTR %')).toBeInTheDocument()
    expect(screen.getByText('Заказы')).toBeInTheDocument()
  })

  it('renders query items in rows', () => {
    render(<SearchByProductTable queries={mockQueries} />)
    expect(screen.getByText('платье летнее')).toBeInTheDocument()
    expect(screen.getByText('платье красное')).toBeInTheDocument()
    expect(screen.getByText('платье вечернее')).toBeInTheDocument()
  })

  // iter-59: pin the Russian-locale CTR % (avgCtr 4.0 → "4,0 %", comma + separator, NOT "4.0%").
  it('formats CTR % in Russian locale (comma, not dot)', () => {
    render(<SearchByProductTable queries={mockQueries} />)
    const ctr = screen.getByText(/4,0\s%/)
    expect(ctr).toBeInTheDocument()
    expect(ctr.textContent ?? '').not.toMatch(/4\.0/)
  })

  it('default sort is totalImpressions descending', () => {
    render(<SearchByProductTable queries={mockQueries} />)
    const rows = screen.getAllByRole('row')
    // First data row (index 1) = highest impressions = 8000 (платье красное)
    expect(rows[1]).toHaveTextContent('платье красное')
    // Second = 5000 (платье летнее)
    expect(rows[2]).toHaveTextContent('платье летнее')
    // Third = 3000 (платье вечернее)
    expect(rows[3]).toHaveTextContent('платье вечернее')
  })

  it('clicking same header toggles asc/desc', async () => {
    const user = userEvent.setup()
    render(<SearchByProductTable queries={mockQueries} />)

    // Default: desc by totalImpressions → платье красное first
    let rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('платье красное')

    // Click "Показы" to toggle to asc
    await user.click(screen.getByText('Показы'))

    // After asc → платье вечернее first (3000)
    rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('платье вечернее')
  })

  it('clicking different header sorts by that column desc', async () => {
    const user = userEvent.setup()
    render(<SearchByProductTable queries={mockQueries} />)

    // Click "Заказы" header
    await user.click(screen.getByText('Заказы'))

    // Sorted by totalOrders desc → 25 (красное), 15 (летнее), 8 (вечернее)
    const rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('платье красное')
    expect(rows[2]).toHaveTextContent('платье летнее')
    expect(rows[3]).toHaveTextContent('платье вечернее')
  })
})
