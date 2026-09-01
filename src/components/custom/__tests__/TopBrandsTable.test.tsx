/**
 * Unit tests for TopBrandsTable component
 * Story 6.4-FE: Cabinet Summary Dashboard (DEFER-003)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
  {
    brand: 'Reebok',
    revenue_net: 40000,
    profit: 2000,
    margin_pct: 5,
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
      expect(screen.getByRole('button', { name: 'Подробнее о топ-5 брендах' })).toBeVisible()
      expect(screen.getByRole('table', { name: 'Топ-5 брендов по прибыли' })).toBeVisible()
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

      expect(screen.getByText('30,0 %')).toBeInTheDocument()
      expect(screen.getByText('20,0 %')).toBeInTheDocument()
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
    it('should show positive profit in financial-positive tone', () => {
      render(<TopBrandsTable brands={mockBrands} />)

      // Find profit cells with positive values
      const profitCells = screen.getAllByText(/45.*000.*₽/)
      expect(profitCells[0]).toHaveClass('text-financial-positive')
    })

    it('should show negative profit in financial-negative tone', () => {
      render(<TopBrandsTable brands={mockBrands} />)

      // Find profit cell with negative value
      const negativeProfit = screen.getByText(/-4.*000.*₽/)
      expect(negativeProfit).toHaveClass('text-financial-negative')
    })

    it('should apply margin color based on value', () => {
      render(<TopBrandsTable brands={mockBrands} />)

      // High margin (30%) should be green
      const highMargin = screen.getByText('30,0 %')
      expect(highMargin).toHaveClass('text-financial-positive')

      // Negative margin should be red
      const negativeMargin = screen.getByText('-5,0 %')
      expect(negativeMargin).toHaveClass('text-financial-negative')

      // Mid-tier margin (20%) should be warning tone (15-30% band)
      const midMargin = screen.getByText('20,0 %')
      expect(midMargin).toHaveClass('text-status-warning')

      // Low positive margin (5%) shares the warning valence (0-15% band; 174.2 canon: /80 text opacity banned)
      const lowMargin = screen.getByText('5,0 %')
      expect(lowMargin).toHaveClass('text-status-warning')
    })

    it('should show muted tone for null margin', () => {
      // 168.3 pass-1: pin the null tier of the 4-tier margin mapping
      render(
        <TopBrandsTable
          brands={[
            {
              brand: 'Asics',
              revenue_net: 60000,
              profit: 6000,
              margin_pct: null,
            },
          ]}
        />
      )

      const nullMargin = screen.getByText('—')
      expect(nullMargin).toHaveClass('text-muted-foreground')
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

    it('should navigate from the native brand button on Enter', async () => {
      const user = userEvent.setup()
      render(<TopBrandsTable brands={mockBrands} />)

      const button = screen.getByRole('button', { name: 'Фильтровать по бренду Nike' })
      button.focus()
      await user.keyboard('{Enter}')

      expect(mockPush).toHaveBeenCalledWith('/analytics/brand?brand=Nike')
    })

    it('should navigate from the native brand button on Space', async () => {
      const user = userEvent.setup()
      render(<TopBrandsTable brands={mockBrands} />)

      const button = screen.getByRole('button', { name: 'Фильтровать по бренду Adidas' })
      button.focus()
      await user.keyboard(' ')

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
    it('should expose an accessible brand filter button', () => {
      render(<TopBrandsTable brands={mockBrands} />)

      expect(screen.getByRole('button', { name: 'Фильтровать по бренду Nike' })).toBeInTheDocument()
    })

    it('should preserve native row and cell semantics', () => {
      render(<TopBrandsTable brands={mockBrands} />)

      const button = screen.getByRole('button', { name: 'Фильтровать по бренду Nike' })
      const row = button.closest('tr')!
      expect(row).toHaveRole('row')
      expect(row).not.toHaveAttribute('role')
      expect(row).not.toHaveAttribute('tabindex')
      expect(row.querySelectorAll('td')).toHaveLength(5)
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

describe('TopBrandsTable — semantic tokens guard (168.3)', () => {
  it('renders no legacy palette classes in the DOM', () => {
    const { container } = render(<TopBrandsTable brands={mockBrands} />)
    const LEGACY_PALETTE_RE =
      /((bg|text|border|ring|divide|fill|stroke|outline)-(red|yellow|blue|green|gray|rose|amber|emerald|sky|orange|slate|zinc|neutral|stone|lime|teal|cyan|indigo|violet|purple|fuchsia|pink)(-\d+)?)/
    expect(container.innerHTML).not.toMatch(LEGACY_PALETTE_RE)
  })
})
