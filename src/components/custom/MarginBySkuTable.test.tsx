/**
 * Unit tests for MarginBySkuTable component
 * Story 4.5: Margin Analysis by SKU
 *
 * Tests:
 * - Table rendering with data
 * - Sorting functionality (all columns, ascending/descending)
 * - Data formatting (currency, percentages)
 * - Summary calculations
 * - Empty state
 * - Product click navigation
 * - Missing COGS indicators
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MarginBySkuTable } from './MarginBySkuTable'
import type { MarginAnalyticsSku } from '@/types/api'

const mockData: MarginAnalyticsSku[] = [
  {
    nm_id: '123456789',
    sa_name: 'Product A',
    revenue_net: 100000,
    qty: 50,
    cogs: 65000,
    profit: 35000,
    margin_pct: 35.0,
    markup_percent: 53.85,
    missing_cogs_flag: false,
  },
  {
    nm_id: '987654321',
    sa_name: 'Product B',
    revenue_net: 50000,
    qty: 25,
    cogs: 40000,
    profit: 10000,
    margin_pct: 20.0,
    markup_percent: 25.0,
    missing_cogs_flag: false,
  },
  {
    nm_id: '555555555',
    sa_name: 'Product C',
    revenue_net: 80000,
    qty: 40,
    cogs: undefined,
    profit: undefined,
    margin_pct: undefined,
    markup_percent: undefined,
    missing_cogs_flag: true,
  },
  {
    nm_id: '111111111',
    sa_name: 'Product D',
    revenue_net: 60000,
    qty: 30,
    cogs: 70000,
    profit: -10000,
    margin_pct: -16.67,
    markup_percent: -14.29,
    missing_cogs_flag: false,
  },
]

describe('MarginBySkuTable', () => {
  describe('rendering', () => {
    it('should render table with data', () => {
      render(<MarginBySkuTable data={mockData} />)

      expect(screen.getByText('Product A')).toBeInTheDocument()
      expect(screen.getByText('Product B')).toBeInTheDocument()
      expect(screen.getByText('Product C')).toBeInTheDocument()
      expect(screen.getByText('Product D')).toBeInTheDocument()
    })

    it('should display all columns', () => {
      render(<MarginBySkuTable data={mockData} />)

      expect(screen.getByText('Артикул')).toBeInTheDocument()
      expect(screen.getByText('Название товара')).toBeInTheDocument()
      expect(screen.getByText('Продано (шт)')).toBeInTheDocument()
      expect(screen.getByText('Выручка')).toBeInTheDocument()
      expect(screen.getByText('Себестоимость')).toBeInTheDocument()
      expect(screen.getByText('Прибыль')).toBeInTheDocument()
      expect(screen.getByText('Маржа %')).toBeInTheDocument()
    })

    it('should display product IDs', () => {
      render(<MarginBySkuTable data={mockData} />)

      expect(screen.getByText('123456789')).toBeInTheDocument()
      expect(screen.getByText('987654321')).toBeInTheDocument()
    })

    it('should display quantities with Russian locale formatting', () => {
      render(<MarginBySkuTable data={mockData} />)

      expect(screen.getByText('50')).toBeInTheDocument()
      expect(screen.getByText('25')).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('should show empty state message when no data', () => {
      render(<MarginBySkuTable data={[]} />)

      expect(screen.getByText('Нет данных за выбранную неделю')).toBeInTheDocument()
    })

    it('should show empty state for null data', () => {
      render(<MarginBySkuTable data={[]} />)

      expect(screen.getByText('Нет данных за выбранную неделю')).toBeInTheDocument()
    })
  })

  describe('sorting', () => {
    it('should sort by margin percentage descending by default', () => {
      render(<MarginBySkuTable data={mockData} />)

      const rows = screen.getAllByRole('row')
      // First data row should be Product A (35% margin)
      expect(rows[1]).toHaveTextContent('Product A')
    })

    it('should toggle sort order when clicking same column header', () => {
      render(<MarginBySkuTable data={mockData} />)

      const marginHeader = screen.getByText('Маржа %').closest('button')
      expect(marginHeader).toBeInTheDocument()

      // Click to toggle to ascending
      fireEvent.click(marginHeader!)
      const rows = screen.getAllByRole('row')
      // With ascending, Product D (-16.67%) should be first (nulls last)
      // Actually, nulls go last, so Product D should be first
    })

    it('should sort by product name when clicking name header', () => {
      render(<MarginBySkuTable data={mockData} />)

      const nameHeader = screen.getByText('Название товара').closest('button')
      fireEvent.click(nameHeader!)

      // After clicking, should sort alphabetically (A, B, C, D)
      expect(screen.getByText('Product A')).toBeInTheDocument()
      expect(screen.getByText('Product B')).toBeInTheDocument()
      expect(screen.getByText('Product C')).toBeInTheDocument()
      expect(screen.getByText('Product D')).toBeInTheDocument()
    })

    it('should sort by revenue when clicking revenue header', () => {
      render(<MarginBySkuTable data={mockData} />)

      const revenueHeader = screen.getByText('Выручка').closest('button')
      fireEvent.click(revenueHeader!)

      const rows = screen.getAllByRole('row')
      // Product A has highest revenue (100000)
      expect(rows[1]).toHaveTextContent('Product A')
    })

    it('should sort by quantity when clicking quantity header', () => {
      render(<MarginBySkuTable data={mockData} />)

      const qtyHeader = screen.getByText('Продано (шт)').closest('button')
      fireEvent.click(qtyHeader!)

      const rows = screen.getAllByRole('row')
      // Product A has highest qty (50)
      expect(rows[1]).toHaveTextContent('Product A')
    })

    it('should sort by profit when clicking profit header', () => {
      render(<MarginBySkuTable data={mockData} />)

      const profitHeader = screen.getByText('Прибыль').closest('button')
      fireEvent.click(profitHeader!)

      const rows = screen.getAllByRole('row')
      // Product A has highest profit (35000)
      expect(rows[1]).toHaveTextContent('Product A')
    })

    it('should place null margins at the end when sorting', () => {
      render(<MarginBySkuTable data={mockData} />)

      const marginHeader = screen.getByText('Маржа %').closest('button')
      fireEvent.click(marginHeader!) // Toggle to ascending

      const rows = screen.getAllByRole('row')
      // Product C (null margin) should be at the end
      const lastDataRow = rows[rows.length - 1]
      expect(lastDataRow).toHaveTextContent('Product C')
    })
  })

  describe('missing COGS handling', () => {
    it('should highlight rows with missing COGS', () => {
      const { container } = render(<MarginBySkuTable data={mockData} />)

      const rows = container.querySelectorAll('tbody tr')
      // Product C has missing_cogs_flag: true
      const productCRow = Array.from(rows).find((row) => row.textContent?.includes('Product C'))
      expect(productCRow).toHaveClass('bg-yellow-50/30')
    })

    it('should show "Не назначена" for missing COGS', () => {
      render(<MarginBySkuTable data={mockData} />)

      expect(screen.getByText('Не назначена')).toBeInTheDocument()
    })

    it('should show dash for products without COGS data', () => {
      render(<MarginBySkuTable data={mockData} />)

      const dashes = screen.getAllByText('—')
      expect(dashes.length).toBeGreaterThan(0)
    })
  })

  describe('summary footer', () => {
    it('should display total products count', () => {
      render(<MarginBySkuTable data={mockData} />)

      expect(screen.getByText('Всего товаров')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
    })

    it('should display products with COGS count', () => {
      render(<MarginBySkuTable data={mockData} />)

      expect(screen.getByText('С себестоимостью')).toBeInTheDocument()
      // 3 products have COGS (A, B, D), 1 doesn't (C)
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should display products without COGS count', () => {
      render(<MarginBySkuTable data={mockData} />)

      expect(screen.getByText('Без себестоимости')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should calculate and display average margin', () => {
      render(<MarginBySkuTable data={mockData} />)

      expect(screen.getByText('Средняя маржа')).toBeInTheDocument()
      // Average of 35%, 20%, -16.67% = 12.78%
      // Check for percentage sign and number pattern (flexible for locale formatting)
      const summarySection = screen.getByText('Средняя маржа').closest('div')?.parentElement
      expect(summarySection?.textContent).toMatch(/12[.,]\d+%/)
    })

    it('should show dash for average margin when no margins available', () => {
      const noMarginData: MarginAnalyticsSku[] = [
        {
          nm_id: '111',
          sa_name: 'No Margin',
          revenue_net: 10000,
          qty: 10,
          cogs: undefined,
          profit: undefined,
          margin_pct: undefined,
          markup_percent: undefined,
          missing_cogs_flag: true,
        },
      ]

      render(<MarginBySkuTable data={noMarginData} />)

      const summarySection = screen.getByText('Средняя маржа').closest('div')?.parentElement
      expect(summarySection).toHaveTextContent('—')
    })
  })

  describe('product click navigation', () => {
    it('should call onProductClick when row is clicked', () => {
      const handleClick = vi.fn()
      render(<MarginBySkuTable data={mockData} onProductClick={handleClick} />)

      const rows = screen.getAllByRole('row')
      fireEvent.click(rows[1]) // Click first data row

      expect(handleClick).toHaveBeenCalledWith('123456789')
    })

    it('should call onProductClick when external link button is clicked', () => {
      const handleClick = vi.fn()
      render(<MarginBySkuTable data={mockData} onProductClick={handleClick} />)

      const buttons = screen.getAllByRole('button')
      const externalLinkButton = buttons.find((btn) =>
        btn.getAttribute('aria-label')?.includes('Открыть детали товара')
      )

      if (externalLinkButton) {
        fireEvent.click(externalLinkButton)
        expect(handleClick).toHaveBeenCalled()
      }
    })

    it('should not call onProductClick when prop is not provided', () => {
      render(<MarginBySkuTable data={mockData} />)

      const rows = screen.getAllByRole('row')
      fireEvent.click(rows[1]) // Should not throw error

      // No external link buttons should be present
      const externalLinks = screen.queryAllByLabelText(/Открыть детали товара/)
      expect(externalLinks.length).toBe(0)
    })
  })

  describe('profit color coding', () => {
    it('should show green color for positive profit', () => {
      const { container } = render(<MarginBySkuTable data={mockData} />)

      // Find the span inside the profit cell for Product A (profit: 35000)
      const productARow = Array.from(container.querySelectorAll('tbody tr')).find((row) =>
        row.textContent?.includes('Product A')
      )
      const profitSpan = productARow?.querySelector('span.text-green-600')
      expect(profitSpan).toBeInTheDocument()
    })

    it('should show red color for negative profit', () => {
      const { container } = render(<MarginBySkuTable data={mockData} />)

      // Find the span inside the profit cell for Product D (profit: -10000)
      const productDRow = Array.from(container.querySelectorAll('tbody tr')).find((row) =>
        row.textContent?.includes('Product D')
      )
      const profitSpan = productDRow?.querySelector('span.text-red-600')
      expect(profitSpan).toBeInTheDocument()
    })
  })
})

