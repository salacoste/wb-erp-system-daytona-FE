/**
 * Unit tests for TopBrandsTable component
 * Story 6.4-FE: Cabinet Summary Dashboard (DEFER-003)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TopBrandsTable } from '../TopBrandsTable'
import type { TopBrandItem } from '@/types/analytics'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

const mockBrands: TopBrandItem[] = [
  {
    brand: 'Nike',
    revenue_net: 150000,
    profit: 45000,
    margin_pct: 30,
  },
  {
    brand: 'Adidas',
    revenue_net: 120000,
    profit: 24000,
    margin_pct: 20,
  },
  {
    brand: 'Puma',
    revenue_net: 80000,
    profit: -4000,
    margin_pct: -5,
  },
]

describe('TopBrandsTable', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  describe('Rendering', () => {
    it('should render table with brands', () => {
      render(<TopBrandsTable brands={mockBrands} />)

      expect(screen.getByText('Топ-5 брендов')).toBeInTheDocument()
      expect(screen.getByText('Nike')).toBeInTheDocument()
      expect(screen.getByText('Adidas')).toBeInTheDocument()
      expect(screen.getByText('Puma')).toBeInTheDocument()
    })

    it('should render table headers correctly', () => {
      render(<TopBrandsTable brands={mockBrands} />)

      expect(screen.getByText('#')).toBeInTheDocument()
      expect(screen.getByText('Бренд')).toBeInTheDocument()
      expect(screen.getByText('Выручка')).toBeInTheDocument()
      expect(screen.getByText('Прибыль')).toBeInTheDocument()
      expect(screen.getByText('Маржа')).toBeInTheDocument()
    })

    it('should show ranking numbers', () => {
      render(<TopBrandsTable brands={mockBrands} />)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should show empty state when no brands', () => {
      render(<TopBrandsTable brands={[]} />)

      expect(screen.getByText('Нет данных о брендах')).toBeInTheDocument()
    })

    it('should show fallback for empty brand name', () => {
      const brandsWithEmptyName: TopBrandItem[] = [
        {
          brand: '',
          revenue_net: 10000,
          profit: 3000,
          margin_pct: 30,
        },
      ]

      render(<TopBrandsTable brands={brandsWithEmptyName} />)

      expect(screen.getByText('Без бренда')).toBeInTheDocument()
    })
  })

  describe('Value formatting', () => {
    it('should format revenue as currency', () => {
      render(<TopBrandsTable brands={mockBrands} />)

      // Russian currency format
      expect(screen.getByText(/150.*000.*₽/)).toBeInTheDocument()
      expect(screen.getByText(/120.*000.*₽/)).toBeInTheDocument()
    })

    it('should format margin as percentage', () => {
      render(<TopBrandsTable brands={mockBrands} />)

      expect(screen.getByText('30.0%')).toBeInTheDocument()
      expect(screen.getByText('20.0%')).toBeInTheDocument()
    })

    it('should show dash for null profit', () => {
      const brandsWithNullProfit: TopBrandItem[] = [
        {
          brand: 'TestBrand',
          revenue_net: 10000,
          profit: null,
          margin_pct: null,
        },
      ]

      render(<TopBrandsTable brands={brandsWithNullProfit} />)

      // Dashes for null values
      const dashes = screen.getAllByText('—')
      expect(dashes.length).toBeGreaterThan(0)
    })
  })

  describe('Color coding', () => {
    it('should show positive profit in green', () => {
      render(<TopBrandsTable brands={mockBrands} />)

      // Find profit cells with positive values
      const profitCells = screen.getAllByText(/45.*000.*₽/)
      expect(profitCells[0]).toHaveClass('text-green-600')
    })

    it('should show negative profit in red', () => {
      render(<TopBrandsTable brands={mockBrands} />)

      // Find profit cell with negative value
      const negativeProfit = screen.getByText(/-4.*000.*₽/)
      expect(negativeProfit).toHaveClass('text-red-600')
    })

    it('should apply margin color based on value', () => {
      render(<TopBrandsTable brands={mockBrands} />)

      // High margin (30%) should be green
      const highMargin = screen.getByText('30.0%')
      expect(highMargin).toHaveClass('text-green-600')

      // Negative margin should be red
      const negativeMargin = screen.getByText('-5.0%')
      expect(negativeMargin).toHaveClass('text-red-600')
    })
  })

  describe('Navigation', () => {
    it('should navigate to brand analytics page on row click', () => {
      render(<TopBrandsTable brands={mockBrands} />)

      const row = screen.getByText('Nike').closest('tr')
      fireEvent.click(row!)

      expect(mockPush).toHaveBeenCalledWith('/analytics/brand?brand=Nike')
    })

    it('should URL-encode brand names with special characters', () => {
      const brandsWithSpecialChars: TopBrandItem[] = [
        {
          brand: 'Brand & Co',
          revenue_net: 50000,
          profit: 10000,
          margin_pct: 20,
        },
      ]

      render(<TopBrandsTable brands={brandsWithSpecialChars} />)

      const row = screen.getByText('Brand & Co').closest('tr')
      fireEvent.click(row!)

      expect(mockPush).toHaveBeenCalledWith('/analytics/brand?brand=Brand%20%26%20Co')
    })

    it('should navigate on Enter key press', () => {
      render(<TopBrandsTable brands={mockBrands} />)

      const row = screen.getByText('Nike').closest('tr')
      fireEvent.keyDown(row!, { key: 'Enter' })

      expect(mockPush).toHaveBeenCalledWith('/analytics/brand?brand=Nike')
    })

    it('should navigate on Space key press', () => {
      render(<TopBrandsTable brands={mockBrands} />)

      const row = screen.getByText('Adidas').closest('tr')
      fireEvent.keyDown(row!, { key: ' ' })

      expect(mockPush).toHaveBeenCalledWith('/analytics/brand?brand=Adidas')
    })
  })

  describe('Loading state', () => {
    it('should show skeleton when loading', () => {
      render(<TopBrandsTable brands={[]} isLoading={true} />)

      expect(screen.getByText('Топ-5 брендов')).toBeInTheDocument()
      // Empty state should not be shown when loading
      expect(screen.queryByText('Нет данных о брендах')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible row labels', () => {
      render(<TopBrandsTable brands={mockBrands} />)

      const row = screen.getByLabelText('Фильтровать по бренду Nike')
      expect(row).toBeInTheDocument()
    })

    it('should have role="button" on rows', () => {
      render(<TopBrandsTable brands={mockBrands} />)

      const rows = screen.getAllByRole('button')
      expect(rows.length).toBe(mockBrands.length)
    })

    it('should have tabIndex for keyboard navigation', () => {
      render(<TopBrandsTable brands={mockBrands} />)

      const row = screen.getByText('Nike').closest('tr')
      expect(row).toHaveAttribute('tabindex', '0')
    })
  })

  describe('Limiting to 5 items', () => {
    it('should only display first 5 brands', () => {
      const manyBrands: TopBrandItem[] = Array.from({ length: 10 }, (_, i) => ({
        brand: `Brand ${i + 1}`,
        revenue_net: 50000 - i * 1000,
        profit: 10000 - i * 500,
        margin_pct: 20 - i,
      }))

      render(<TopBrandsTable brands={manyBrands} />)

      // First 5 should be visible
      expect(screen.getByText('Brand 1')).toBeInTheDocument()
      expect(screen.getByText('Brand 5')).toBeInTheDocument()

      // 6th and beyond should not be visible
      expect(screen.queryByText('Brand 6')).not.toBeInTheDocument()
      expect(screen.queryByText('Brand 10')).not.toBeInTheDocument()
    })
  })
})
