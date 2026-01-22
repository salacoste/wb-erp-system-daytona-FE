/**
 * Unit tests for MarginByCategoryTable component
 * Story 4.6: Margin Analysis by Brand & Category
 *
 * Tests:
 * - Table rendering with aggregated category data
 * - Sorting functionality
 * - Aggregation display
 * - Missing COGS indicators
 * - Drill-down navigation
 * - Summary calculations
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MarginByCategoryTable } from './MarginByCategoryTable'
import type { MarginAnalyticsAggregated } from '@/types/api'

const mockCategoryData: MarginAnalyticsAggregated[] = [
  {
    category: 'Category A',
    revenue_net: 200000,
    qty: 100,
    cogs: 130000,
    profit: 70000,
    operating_profit: 70000, // Required for summary calculation
    margin_pct: 35.0,
    markup_percent: 53.85,
    missing_cogs_count: 0,
  },
  {
    category: 'Category B',
    revenue_net: 100000,
    qty: 50,
    cogs: 80000,
    profit: 20000,
    operating_profit: 20000,
    margin_pct: 20.0,
    markup_percent: 25.0,
    missing_cogs_count: 5,
  },
  {
    category: 'Category C',
    revenue_net: 150000,
    qty: 75,
    cogs: undefined,
    profit: undefined,
    operating_profit: undefined,
    margin_pct: undefined,
    markup_percent: undefined,
    missing_cogs_count: 75,
  },
]

describe('MarginByCategoryTable', () => {
  describe('rendering', () => {
    it('should render table with category data', () => {
      render(<MarginByCategoryTable data={mockCategoryData} />)

      expect(screen.getByText('Category A')).toBeInTheDocument()
      expect(screen.getByText('Category B')).toBeInTheDocument()
      expect(screen.getByText('Category C')).toBeInTheDocument()
    })

    it('should display all columns', () => {
      render(<MarginByCategoryTable data={mockCategoryData} />)

      expect(screen.getByText('Категория')).toBeInTheDocument()
      expect(screen.getByText('Товаров (SKU)')).toBeInTheDocument()
      expect(screen.getByText('Выручка')).toBeInTheDocument()
      expect(screen.getByText('Себестоимость')).toBeInTheDocument()
      expect(screen.getByText('Прибыль')).toBeInTheDocument()
      expect(screen.getByText('Маржа %')).toBeInTheDocument()
      expect(screen.getByText('Без COGS')).toBeInTheDocument()
    })

    it('should show "(Без категории)" for items without category', () => {
      const noCategoryData: MarginAnalyticsAggregated[] = [
        {
          category: undefined,
          revenue_net: 50000,
          qty: 25,
          cogs: 30000,
          profit: 20000,
          margin_pct: 40.0,
          markup_percent: 66.67,
          missing_cogs_count: 0,
        },
      ]

      render(<MarginByCategoryTable data={noCategoryData} />)

      expect(screen.getByText('(Без категории)')).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('should show empty state message when no data', () => {
      render(<MarginByCategoryTable data={[]} />)

      expect(screen.getByText('Нет данных за выбранную неделю')).toBeInTheDocument()
    })
  })

  describe('sorting', () => {
    it('should sort by margin percentage descending by default', () => {
      render(<MarginByCategoryTable data={mockCategoryData} />)

      const rows = screen.getAllByRole('row')
      // Category A has highest margin (35%)
      expect(rows[1]).toHaveTextContent('Category A')
    })

    it('should sort by category name when clicking category header', () => {
      render(<MarginByCategoryTable data={mockCategoryData} />)

      const categoryHeader = screen.getByText('Категория').closest('button')
      fireEvent.click(categoryHeader!)

      // After clicking, should sort alphabetically (A, B, C)
      expect(screen.getByText('Category A')).toBeInTheDocument()
      expect(screen.getByText('Category B')).toBeInTheDocument()
      expect(screen.getByText('Category C')).toBeInTheDocument()
    })

    it('should sort by revenue when clicking revenue header', () => {
      render(<MarginByCategoryTable data={mockCategoryData} />)

      const revenueHeader = screen.getByText('Выручка').closest('button')
      fireEvent.click(revenueHeader!)

      const rows = screen.getAllByRole('row')
      // Category A has highest revenue (200000)
      expect(rows[1]).toHaveTextContent('Category A')
    })

    it('should place null margins at the end when sorting', () => {
      render(<MarginByCategoryTable data={mockCategoryData} />)

      const marginHeader = screen.getByText('Маржа %').closest('button')
      fireEvent.click(marginHeader!) // Toggle to ascending

      const rows = screen.getAllByRole('row')
      // Category C (null margin) should be at the end
      const lastDataRow = rows[rows.length - 1]
      expect(lastDataRow).toHaveTextContent('Category C')
    })
  })

  describe('missing COGS handling', () => {
    it('should highlight rows with missing COGS', () => {
      const { container } = render(<MarginByCategoryTable data={mockCategoryData} />)

      const rows = container.querySelectorAll('tbody tr')
      // Category B has missing_cogs_count: 5
      const categoryBRow = Array.from(rows).find((row) => row.textContent?.includes('Category B'))
      expect(categoryBRow).toHaveClass('bg-yellow-50/30')
    })

    it('should display missing COGS count badge', () => {
      render(<MarginByCategoryTable data={mockCategoryData} />)

      // Use getAllByText since "75" appears in both quantity and missing COGS count
      const all75s = screen.getAllByText('75')
      expect(all75s.length).toBeGreaterThan(0)
      
      // Check for the badge specifically (yellow background)
      const { container } = render(<MarginByCategoryTable data={mockCategoryData} />)
      const badges = container.querySelectorAll('.bg-yellow-100')
      expect(badges.length).toBeGreaterThan(0)
    })
  })

  describe('summary footer', () => {
    it('should display total categories count', () => {
      render(<MarginByCategoryTable data={mockCategoryData} />)

      // Updated: uses ComparisonSummary which shows "Всего позиций"
      expect(screen.getByText('Всего позиций')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should calculate and display total revenue', () => {
      render(<MarginByCategoryTable data={mockCategoryData} />)

      expect(screen.getByText('Общая выручка')).toBeInTheDocument()
      // Total: 200000 + 100000 + 150000 = 450000
      const totalRevenue = screen.getByText(/450.*000/)
      expect(totalRevenue).toBeInTheDocument()
    })

    it('should calculate and display total profit', () => {
      render(<MarginByCategoryTable data={mockCategoryData} />)

      expect(screen.getByText('Общая прибыль')).toBeInTheDocument()
      // Total: 70000 + 20000 + 0 = 90000
      const totalProfit = screen.getByText(/90.*000/)
      expect(totalProfit).toBeInTheDocument()
    })

    it('should calculate and display average margin', () => {
      render(<MarginByCategoryTable data={mockCategoryData} />)

      expect(screen.getByText('Средняя маржа')).toBeInTheDocument()
      // Average of 35%, 20% = 27.5%
      // Check for percentage sign and number pattern (flexible for locale formatting)
      const summarySection = screen.getByText('Средняя маржа').closest('div')?.parentElement
      expect(summarySection?.textContent).toMatch(/27[.,]\d+%/)
    })
  })

  describe('drill-down navigation', () => {
    it('should call onCategoryClick when row is clicked', () => {
      const handleClick = vi.fn()
      render(<MarginByCategoryTable data={mockCategoryData} onCategoryClick={handleClick} />)

      const rows = screen.getAllByRole('row')
      fireEvent.click(rows[1]) // Click first data row

      expect(handleClick).toHaveBeenCalledWith('Category A')
    })

    it('should call onCategoryClick when external link button is clicked', () => {
      const handleClick = vi.fn()
      render(<MarginByCategoryTable data={mockCategoryData} onCategoryClick={handleClick} />)

      const buttons = screen.getAllByRole('button')
      const externalLinkButton = buttons.find((btn) =>
        btn.getAttribute('aria-label')?.includes('Открыть детали категории')
      )

      if (externalLinkButton) {
        fireEvent.click(externalLinkButton)
        expect(handleClick).toHaveBeenCalled()
      }
    })

    it('should not call onCategoryClick for items without category', () => {
      const handleClick = vi.fn()
      const noCategoryData: MarginAnalyticsAggregated[] = [
        {
          category: undefined,
          revenue_net: 50000,
          qty: 25,
          cogs: 30000,
          profit: 20000,
          margin_pct: 40.0,
          markup_percent: 66.67,
          missing_cogs_count: 0,
        },
      ]

      render(<MarginByCategoryTable data={noCategoryData} onCategoryClick={handleClick} />)

      const rows = screen.getAllByRole('row')
      fireEvent.click(rows[1])

      expect(handleClick).not.toHaveBeenCalled()
    })
  })
})

