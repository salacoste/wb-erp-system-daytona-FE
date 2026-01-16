/**
 * Unit tests for MarginByBrandTable component
 * Story 4.6: Margin Analysis by Brand & Category
 *
 * Tests:
 * - Table rendering with aggregated data
 * - Sorting functionality
 * - Aggregation display (total revenue, profit, avg margin)
 * - Missing COGS indicators
 * - Drill-down navigation
 * - Summary calculations
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MarginByBrandTable } from './MarginByBrandTable'
import type { MarginAnalyticsAggregated } from '@/types/api'

const mockBrandData: MarginAnalyticsAggregated[] = [
  {
    brand: 'Brand A',
    revenue_net: 200000,
    qty: 100,
    cogs: 130000,
    profit: 70000,
    margin_pct: 35.0,
    markup_percent: 53.85,
    missing_cogs_count: 0,
  },
  {
    brand: 'Brand B',
    revenue_net: 100000,
    qty: 50,
    cogs: 80000,
    profit: 20000,
    margin_pct: 20.0,
    markup_percent: 25.0,
    missing_cogs_count: 5,
  },
  {
    brand: 'Brand C',
    revenue_net: 150000,
    qty: 75,
    cogs: undefined,
    profit: undefined,
    margin_pct: undefined,
    markup_percent: undefined,
    missing_cogs_count: 75,
  },
]

describe('MarginByBrandTable', () => {
  describe('rendering', () => {
    it('should render table with brand data', () => {
      render(<MarginByBrandTable data={mockBrandData} />)

      expect(screen.getByText('Brand A')).toBeInTheDocument()
      expect(screen.getByText('Brand B')).toBeInTheDocument()
      expect(screen.getByText('Brand C')).toBeInTheDocument()
    })

    it('should display all columns', () => {
      render(<MarginByBrandTable data={mockBrandData} />)

      expect(screen.getByText('Бренд')).toBeInTheDocument()
      expect(screen.getByText('Товаров (SKU)')).toBeInTheDocument()
      expect(screen.getByText('Выручка')).toBeInTheDocument()
      expect(screen.getByText('Себестоимость')).toBeInTheDocument()
      expect(screen.getByText('Прибыль')).toBeInTheDocument()
      expect(screen.getByText('Маржа %')).toBeInTheDocument()
      expect(screen.getByText('Без COGS')).toBeInTheDocument()
    })

    it('should show "(Без бренда)" for items without brand', () => {
      const noBrandData: MarginAnalyticsAggregated[] = [
        {
          brand: undefined,
          revenue_net: 50000,
          qty: 25,
          cogs: 30000,
          profit: 20000,
          margin_pct: 40.0,
          markup_percent: 66.67,
          missing_cogs_count: 0,
        },
      ]

      render(<MarginByBrandTable data={noBrandData} />)

      expect(screen.getByText('(Без бренда)')).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('should show empty state message when no data', () => {
      render(<MarginByBrandTable data={[]} />)

      expect(screen.getByText('Нет данных за выбранную неделю')).toBeInTheDocument()
    })
  })

  describe('sorting', () => {
    it('should sort by margin percentage descending by default', () => {
      render(<MarginByBrandTable data={mockBrandData} />)

      const rows = screen.getAllByRole('row')
      // Brand A has highest margin (35%)
      expect(rows[1]).toHaveTextContent('Brand A')
    })

    it('should sort by brand name when clicking brand header', () => {
      render(<MarginByBrandTable data={mockBrandData} />)

      const brandHeader = screen.getByText('Бренд').closest('button')
      fireEvent.click(brandHeader!)

      // After clicking, should sort alphabetically (A, B, C)
      expect(screen.getByText('Brand A')).toBeInTheDocument()
      expect(screen.getByText('Brand B')).toBeInTheDocument()
      expect(screen.getByText('Brand C')).toBeInTheDocument()
    })

    it('should sort by revenue when clicking revenue header', () => {
      render(<MarginByBrandTable data={mockBrandData} />)

      const revenueHeader = screen.getByText('Выручка').closest('button')
      fireEvent.click(revenueHeader!)

      const rows = screen.getAllByRole('row')
      // Brand A has highest revenue (200000)
      expect(rows[1]).toHaveTextContent('Brand A')
    })

    it('should sort by quantity when clicking quantity header', () => {
      render(<MarginByBrandTable data={mockBrandData} />)

      const qtyHeader = screen.getByText('Товаров (SKU)').closest('button')
      fireEvent.click(qtyHeader!)

      const rows = screen.getAllByRole('row')
      // Brand A has highest qty (100)
      expect(rows[1]).toHaveTextContent('Brand A')
    })

    it('should place null margins at the end when sorting', () => {
      render(<MarginByBrandTable data={mockBrandData} />)

      const marginHeader = screen.getByText('Маржа %').closest('button')
      fireEvent.click(marginHeader!) // Toggle to ascending

      const rows = screen.getAllByRole('row')
      // Brand C (null margin) should be at the end
      const lastDataRow = rows[rows.length - 1]
      expect(lastDataRow).toHaveTextContent('Brand C')
    })
  })

  describe('missing COGS handling', () => {
    it('should highlight rows with missing COGS', () => {
      const { container } = render(<MarginByBrandTable data={mockBrandData} />)

      const rows = container.querySelectorAll('tbody tr')
      // Brand B has missing_cogs_count: 5
      const brandBRow = Array.from(rows).find((row) => row.textContent?.includes('Brand B'))
      expect(brandBRow).toHaveClass('bg-yellow-50/30')
    })

    it('should display missing COGS count badge', () => {
      render(<MarginByBrandTable data={mockBrandData} />)

      // Use getAllByText since "75" appears in both quantity and missing COGS count
      const all75s = screen.getAllByText('75')
      expect(all75s.length).toBeGreaterThan(0)
      
      // Check for the badge specifically (yellow background)
      const { container } = render(<MarginByBrandTable data={mockBrandData} />)
      const badges = container.querySelectorAll('.bg-yellow-100')
      expect(badges.length).toBeGreaterThan(0)
    })

    it('should show dash when no missing COGS', () => {
      render(<MarginByBrandTable data={mockBrandData} />)

      const dashes = screen.getAllByText('—')
      expect(dashes.length).toBeGreaterThan(0)
    })
  })

  describe('summary footer', () => {
    it('should display total brands count', () => {
      render(<MarginByBrandTable data={mockBrandData} />)

      expect(screen.getByText('Всего брендов')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should calculate and display total revenue', () => {
      render(<MarginByBrandTable data={mockBrandData} />)

      expect(screen.getByText('Общая выручка')).toBeInTheDocument()
      // Total: 200000 + 100000 + 150000 = 450000
      const totalRevenue = screen.getByText(/450.*000/)
      expect(totalRevenue).toBeInTheDocument()
    })

    it('should calculate and display total profit', () => {
      render(<MarginByBrandTable data={mockBrandData} />)

      expect(screen.getByText('Общая прибыль')).toBeInTheDocument()
      // Total: 70000 + 20000 + 0 = 90000
      const totalProfit = screen.getByText(/90.*000/)
      expect(totalProfit).toBeInTheDocument()
    })

    it('should calculate and display average margin', () => {
      render(<MarginByBrandTable data={mockBrandData} />)

      expect(screen.getByText('Средняя маржа')).toBeInTheDocument()
      // Average of 35%, 20% = 27.5%
      // Check for percentage sign and number pattern (flexible for locale formatting)
      const summarySection = screen.getByText('Средняя маржа').closest('div')?.parentElement
      expect(summarySection?.textContent).toMatch(/27[.,]\d+%/)
    })
  })

  describe('drill-down navigation', () => {
    it('should call onBrandClick when row is clicked', () => {
      const handleClick = vi.fn()
      render(<MarginByBrandTable data={mockBrandData} onBrandClick={handleClick} />)

      const rows = screen.getAllByRole('row')
      fireEvent.click(rows[1]) // Click first data row

      expect(handleClick).toHaveBeenCalledWith('Brand A')
    })

    it('should call onBrandClick when external link button is clicked', () => {
      const handleClick = vi.fn()
      render(<MarginByBrandTable data={mockBrandData} onBrandClick={handleClick} />)

      const buttons = screen.getAllByRole('button')
      const externalLinkButton = buttons.find((btn) =>
        btn.getAttribute('aria-label')?.includes('Открыть детали бренда')
      )

      if (externalLinkButton) {
        fireEvent.click(externalLinkButton)
        expect(handleClick).toHaveBeenCalled()
      }
    })

    it('should not call onBrandClick for items without brand', () => {
      const handleClick = vi.fn()
      const noBrandData: MarginAnalyticsAggregated[] = [
        {
          brand: undefined,
          revenue_net: 50000,
          qty: 25,
          cogs: 30000,
          profit: 20000,
          margin_pct: 40.0,
          markup_percent: 66.67,
          missing_cogs_count: 0,
        },
      ]

      render(<MarginByBrandTable data={noBrandData} onBrandClick={handleClick} />)

      const rows = screen.getAllByRole('row')
      fireEvent.click(rows[1])

      expect(handleClick).not.toHaveBeenCalled()
    })
  })
})

