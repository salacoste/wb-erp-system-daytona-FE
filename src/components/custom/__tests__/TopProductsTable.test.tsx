/**
 * Unit tests for TopProductsTable component
 * Story 6.4-FE: Cabinet Summary Dashboard (DEFER-003)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TopProductsTable } from '../TopProductsTable'
import type { TopProductItem } from '@/types/analytics'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

const mockProducts: TopProductItem[] = [
  {
    nm_id: '123456',
    sa_name: 'Футболка мужская',
    revenue_net: 50000,
    profit: 15000,
    margin_pct: 30,
    contribution_pct: 25.5,
  },
  {
    nm_id: '789012',
    sa_name: 'Джинсы женские',
    revenue_net: 35000,
    profit: 7000,
    margin_pct: 20,
    contribution_pct: 17.8,
  },
  {
    nm_id: '345678',
    sa_name: 'Куртка детская',
    revenue_net: 28000,
    profit: -2000,
    margin_pct: -7.1,
    contribution_pct: 14.3,
  },
]

describe('TopProductsTable', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  describe('Rendering', () => {
    it('should render table with products', () => {
      render(<TopProductsTable products={mockProducts} />)

      expect(screen.getByText('Топ-10 товаров')).toBeInTheDocument()
      expect(screen.getByText('Футболка мужская')).toBeInTheDocument()
      expect(screen.getByText('Джинсы женские')).toBeInTheDocument()
      expect(screen.getByText('Куртка детская')).toBeInTheDocument()
    })

    it('should render table headers correctly', () => {
      render(<TopProductsTable products={mockProducts} />)

      expect(screen.getByText('#')).toBeInTheDocument()
      expect(screen.getByText('Товар')).toBeInTheDocument()
      expect(screen.getByText('Выручка')).toBeInTheDocument()
      expect(screen.getByText('Прибыль')).toBeInTheDocument()
      expect(screen.getByText('Маржа')).toBeInTheDocument()
      expect(screen.getByText('Доля')).toBeInTheDocument()
    })

    it('should display product nm_id as secondary info', () => {
      render(<TopProductsTable products={mockProducts} />)

      expect(screen.getByText('123456')).toBeInTheDocument()
      expect(screen.getByText('789012')).toBeInTheDocument()
    })

    it('should show ranking numbers', () => {
      render(<TopProductsTable products={mockProducts} />)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should show empty state when no products', () => {
      render(<TopProductsTable products={[]} />)

      expect(screen.getByText('Нет данных о товарах')).toBeInTheDocument()
    })

    it('should show fallback name when sa_name is empty', () => {
      const productsWithEmptyName: TopProductItem[] = [
        {
          nm_id: '999999',
          sa_name: '',
          revenue_net: 10000,
          profit: 3000,
          margin_pct: 30,
          contribution_pct: 5,
        },
      ]

      render(<TopProductsTable products={productsWithEmptyName} />)

      expect(screen.getByText('Артикул 999999')).toBeInTheDocument()
    })
  })

  describe('Value formatting', () => {
    it('should format revenue as currency', () => {
      render(<TopProductsTable products={mockProducts} />)

      // Russian currency format
      expect(screen.getByText(/50.*000.*₽/)).toBeInTheDocument()
      expect(screen.getByText(/35.*000.*₽/)).toBeInTheDocument()
    })

    it('should format margin as percentage', () => {
      render(<TopProductsTable products={mockProducts} />)

      expect(screen.getByText('30.0%')).toBeInTheDocument()
      expect(screen.getByText('20.0%')).toBeInTheDocument()
    })

    it('should format contribution percentage', () => {
      render(<TopProductsTable products={mockProducts} />)

      expect(screen.getByText('25.5%')).toBeInTheDocument()
      expect(screen.getByText('17.8%')).toBeInTheDocument()
    })

    it('should show dash for null profit', () => {
      const productsWithNullProfit: TopProductItem[] = [
        {
          nm_id: '111111',
          sa_name: 'Test Product',
          revenue_net: 10000,
          profit: null,
          margin_pct: null,
          contribution_pct: 5,
        },
      ]

      render(<TopProductsTable products={productsWithNullProfit} />)

      // Multiple dashes for null values
      const dashes = screen.getAllByText('—')
      expect(dashes.length).toBeGreaterThan(0)
    })
  })

  describe('Color coding', () => {
    it('should show positive profit in green', () => {
      render(<TopProductsTable products={mockProducts} />)

      // Find profit cells with positive values
      const profitCells = screen.getAllByText(/15.*000.*₽/)
      expect(profitCells[0]).toHaveClass('text-green-600')
    })

    it('should show negative profit in red', () => {
      render(<TopProductsTable products={mockProducts} />)

      // Find profit cell with negative value
      const negativeProfit = screen.getByText(/-2.*000.*₽/)
      expect(negativeProfit).toHaveClass('text-red-600')
    })

    it('should apply margin color based on value', () => {
      render(<TopProductsTable products={mockProducts} />)

      // High margin (30%) should be green
      const highMargin = screen.getByText('30.0%')
      expect(highMargin).toHaveClass('text-green-600')

      // Negative margin should be red
      const negativeMargin = screen.getByText('-7.1%')
      expect(negativeMargin).toHaveClass('text-red-600')
    })
  })

  describe('Navigation', () => {
    it('should navigate to COGS page on row click', () => {
      render(<TopProductsTable products={mockProducts} />)

      const row = screen.getByText('Футболка мужская').closest('tr')
      fireEvent.click(row!)

      expect(mockPush).toHaveBeenCalledWith('/cogs?search=123456')
    })

    it('should navigate on Enter key press', () => {
      render(<TopProductsTable products={mockProducts} />)

      const row = screen.getByText('Футболка мужская').closest('tr')
      fireEvent.keyDown(row!, { key: 'Enter' })

      expect(mockPush).toHaveBeenCalledWith('/cogs?search=123456')
    })

    it('should navigate on Space key press', () => {
      render(<TopProductsTable products={mockProducts} />)

      const row = screen.getByText('Джинсы женские').closest('tr')
      fireEvent.keyDown(row!, { key: ' ' })

      expect(mockPush).toHaveBeenCalledWith('/cogs?search=789012')
    })
  })

  describe('Loading state', () => {
    it('should show skeleton when loading', () => {
      render(<TopProductsTable products={[]} isLoading={true} />)

      expect(screen.getByText('Топ-10 товаров')).toBeInTheDocument()
      // Empty state should not be shown when loading
      expect(screen.queryByText('Нет данных о товарах')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible row labels', () => {
      render(<TopProductsTable products={mockProducts} />)

      const row = screen.getByLabelText('Перейти к товару Футболка мужская')
      expect(row).toBeInTheDocument()
    })

    it('should have role="button" on rows', () => {
      render(<TopProductsTable products={mockProducts} />)

      // Check that interactive rows exist (each product row should be clickable)
      // Component may have other buttons too, so just verify product rows have button role
      const productRow = screen.getByLabelText('Перейти к товару Футболка мужская')
      expect(productRow).toHaveAttribute('role', 'button')
    })

    it('should have tabIndex for keyboard navigation', () => {
      render(<TopProductsTable products={mockProducts} />)

      const row = screen.getByText('Футболка мужская').closest('tr')
      expect(row).toHaveAttribute('tabindex', '0')
    })
  })

  describe('Limiting to 10 items', () => {
    it('should only display first 10 products', () => {
      const manyProducts: TopProductItem[] = Array.from({ length: 15 }, (_, i) => ({
        nm_id: `${100000 + i}`,
        sa_name: `Product ${i + 1}`,
        revenue_net: 50000 - i * 1000,
        profit: 10000 - i * 500,
        margin_pct: 20 - i,
        contribution_pct: 10 - i * 0.5,
      }))

      render(<TopProductsTable products={manyProducts} />)

      // First 10 should be visible
      expect(screen.getByText('Product 1')).toBeInTheDocument()
      expect(screen.getByText('Product 10')).toBeInTheDocument()

      // 11th and beyond should not be visible
      expect(screen.queryByText('Product 11')).not.toBeInTheDocument()
      expect(screen.queryByText('Product 15')).not.toBeInTheDocument()
    })
  })
})
