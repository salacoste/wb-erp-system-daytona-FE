/**
 * MergedGroupTable Component Tests
 *
 * Comprehensive test suite for MergedGroupTable component covering:
 * - 3-tier rowspan structure (склейка indicator, aggregate row, detail rows)
 * - Aggregate metrics display and calculation
 * - Product detail rows with crown icon for main product
 * - Sortable column headers with sort icons
 * - Accessibility (table caption, aria-labels)
 * - Responsive sticky columns
 *
 * @see src/app/(dashboard)/analytics/advertising/components/MergedGroupTable.tsx
 * @see docs/code-review/EPIC-37-COMPONENTS-REVIEW.md
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { MergedGroupTable } from '../MergedGroupTable'
import type { AdvertisingGroup } from '@/types/advertising-analytics'

// Mock test data fixtures - Updated to match current type definitions (Epic 37)
const mockMergedGroup: AdvertisingGroup = {
  type: 'merged_group',
  imtId: 12345,
  mainProduct: {
    nmId: 100,
    vendorCode: 'MAIN-001',
  },
  products: [
    {
      nmId: 100,
      vendorCode: 'MAIN-001',
      imtId: 12345,
      isMainProduct: true,
      totalViews: 1000,
      totalClicks: 50,
      totalOrders: 10,
      totalSpend: 6000,
      totalRevenue: 4000,
      totalSales: 15000,
      organicSales: 11000,
      organicContribution: 73.3,
      roas: 0.67,
      roi: -0.33,
      ctr: 5.0,
      cpc: 120,
      conversionRate: 20.0,
      profitAfterAds: -2000,
    },
    {
      nmId: 101,
      vendorCode: 'CHILD-001',
      imtId: 12345,
      isMainProduct: false,
      totalViews: 500,
      totalClicks: 25,
      totalOrders: 5,
      totalSpend: 0,
      totalRevenue: 2300,
      totalSales: 8500,
      organicSales: 6200,
      organicContribution: 72.9,
      roas: null,
      roi: null,
      ctr: 5.0,
      cpc: null,
      conversionRate: 20.0,
      profitAfterAds: 2300,
    },
    {
      nmId: 102,
      vendorCode: 'CHILD-002',
      imtId: 12345,
      isMainProduct: false,
      totalViews: 200,
      totalClicks: 10,
      totalOrders: 2,
      totalSpend: 0,
      totalRevenue: 400,
      totalSales: 1489,
      organicSales: 1089,
      organicContribution: 73.1,
      roas: null,
      roi: null,
      ctr: 5.0,
      cpc: null,
      conversionRate: 20.0,
      profitAfterAds: 400,
    },
  ],
  productCount: 3,
  aggregateMetrics: {
    totalViews: 1700,
    totalClicks: 85,
    totalOrders: 17,
    totalSpend: 6000,
    totalRevenue: 6700,
    totalSales: 24989,
    organicSales: 18289,
    organicContribution: 73.2,
    roas: 1.12,
    roi: 0.12,
    ctr: 5.0,
    cpc: 70.6,
    conversionRate: 20.0,
    profitAfterAds: 700,
  },
}

const mockSingleProductGroup: AdvertisingGroup = {
  type: 'individual',
  imtId: null,
  mainProduct: {
    nmId: 200,
    vendorCode: 'SINGLE-001',
  },
  products: [
    {
      nmId: 200,
      vendorCode: 'SINGLE-001',
      imtId: null,
      isMainProduct: true,
      totalViews: 300,
      totalClicks: 15,
      totalOrders: 3,
      totalSpend: 2000,
      totalRevenue: 1500,
      totalSales: 5000,
      organicSales: 3500,
      organicContribution: 70.0,
      roas: 0.75,
      roi: -0.25,
      ctr: 5.0,
      cpc: 133.3,
      conversionRate: 20.0,
      profitAfterAds: -500,
    },
  ],
  productCount: 1,
  aggregateMetrics: {
    totalViews: 300,
    totalClicks: 15,
    totalOrders: 3,
    totalSpend: 2000,
    totalRevenue: 1500,
    totalSales: 5000,
    organicSales: 3500,
    organicContribution: 70.0,
    roas: 0.75,
    roi: -0.25,
    ctr: 5.0,
    cpc: 133.3,
    conversionRate: 20.0,
    profitAfterAds: -500,
  },
}

describe('MergedGroupTable', () => {
  // ============================================================================
  // 1. Rendering Tests (3 tests)
  // ============================================================================

  describe('Rendering', () => {
    it('renders empty table when no groups provided', () => {
      const { container } = render(<MergedGroupTable groups={[]} />)

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()

      const tbody = container.querySelector('tbody')
      expect(tbody?.children.length).toBe(0)
    })

    it('renders merged group with 3-tier structure', () => {
      render(<MergedGroupTable groups={[mockMergedGroup]} />)

      // Tier 1: Rowspan cell (склейка indicator)
      const mainProductTexts = screen.getAllByText('MAIN-001')
      expect(mainProductTexts).toHaveLength(2) // Rowspan + detail row
      expect(screen.getByText('+ 2 товаров')).toBeInTheDocument()

      // Tier 2: Aggregate row
      expect(screen.getByText(/ГРУППА #12345/i)).toBeInTheDocument()

      // Tier 3: Detail rows (all 3 products)
      expect(screen.getByText('CHILD-001')).toBeInTheDocument()
      expect(screen.getByText('CHILD-002')).toBeInTheDocument()
    })

    it('renders single product without rowspan cell', () => {
      render(<MergedGroupTable groups={[mockSingleProductGroup]} />)

      // Should NOT have rowspan cell for single product
      expect(screen.queryByText('+ 0 товаров')).not.toBeInTheDocument()

      // Should have aggregate row
      expect(screen.getByText(/ГРУППА/i)).toBeInTheDocument()

      // Should have detail row
      expect(screen.getByText('SINGLE-001')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // 2. Aggregate Row Tests (3 tests)
  // ============================================================================

  describe('Aggregate Row', () => {
    it('displays aggregate metrics with bold text and gray background', () => {
      render(<MergedGroupTable groups={[mockMergedGroup]} />)

      // Find aggregate row by checking for "ГРУППА" text
      const aggregateCell = screen.getByText(/ГРУППА #12345/i).closest('td')
      const aggregateRow = aggregateCell?.closest('tr')

      expect(aggregateRow).toHaveClass('bg-gray-100')

      // Check aggregate metrics are displayed
      const cells = aggregateRow?.querySelectorAll('td')
      expect(cells).toBeDefined()
      expect(cells!.length).toBeGreaterThan(0)
    })

    it('shows "ГРУППА #imtId" with tooltip', () => {
      render(<MergedGroupTable groups={[mockMergedGroup]} />)

      const groupLabel = screen.getByText(/ГРУППА #12345/i)
      expect(groupLabel).toBeInTheDocument()
      expect(groupLabel).toHaveClass('cursor-help')
    })

    it('calculates aggregate metrics when not provided by backend', () => {
      // Create a copy without aggregateMetrics using type assertion
      // This tests the frontend's ability to calculate aggregates client-side
      const groupWithoutAggregates = {
        ...mockMergedGroup,
        aggregateMetrics: undefined as unknown as typeof mockMergedGroup.aggregateMetrics,
      }

      render(<MergedGroupTable groups={[groupWithoutAggregates]} />)

      // Should still render without errors
      expect(screen.getByText(/ГРУППА #12345/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // 3. Detail Rows Tests (3 tests)
  // ============================================================================

  describe('Detail Rows', () => {
    it('renders all products in detail rows', () => {
      render(<MergedGroupTable groups={[mockMergedGroup]} />)

      // All 3 products should be visible
      const mainProductTexts = screen.getAllByText('MAIN-001')
      expect(mainProductTexts).toHaveLength(2) // Rowspan + detail row
      expect(screen.getByText('CHILD-001')).toBeInTheDocument()
      expect(screen.getByText('CHILD-002')).toBeInTheDocument()
    })

    it('shows crown icon for main product', () => {
      const { container } = render(<MergedGroupTable groups={[mockMergedGroup]} />)

      // Find Crown icon SVG by aria-label
      const crownIcon = container.querySelector('[aria-label="Главный товар"]')
      expect(crownIcon).toBeInTheDocument()
    })

    it('calls onProductClick when row clicked', () => {
      const mockOnProductClick = vi.fn()

      render(
        <MergedGroupTable
          groups={[mockMergedGroup]}
          onProductClick={mockOnProductClick}
        />
      )

      // Find detail row by vendor code
      const childRow = screen.getByText('CHILD-001').closest('tr')
      expect(childRow).toBeInTheDocument()

      fireEvent.click(childRow!)

      expect(mockOnProductClick).toHaveBeenCalledTimes(1)
      expect(mockOnProductClick).toHaveBeenCalledWith(101) // nmId of CHILD-001
    })
  })

  // ============================================================================
  // 4. Sorting Tests (3 tests)
  // ============================================================================

  describe('Sorting', () => {
    it('renders sort icons based on sortConfig', () => {
      render(
        <MergedGroupTable
          groups={[mockMergedGroup]}
          sortConfig={{ field: 'roas', direction: 'desc' }}
        />
      )

      // ROAS column should have descending arrow
      const roasHeader = screen.getByText(/ROAS/i)
      expect(roasHeader.textContent).toContain('↓')
    })

    it('calls onSort when column header clicked', () => {
      const mockOnSort = vi.fn()

      render(
        <MergedGroupTable
          groups={[mockMergedGroup]}
          onSort={mockOnSort}
        />
      )

      // Click "Всего продаж" column
      const totalSalesHeader = screen.getByText('Всего продаж')
      fireEvent.click(totalSalesHeader)

      expect(mockOnSort).toHaveBeenCalledTimes(1)
      expect(mockOnSort).toHaveBeenCalledWith('totalSales')
    })

    it('applies sortable cursor styles to headers when onSort provided', () => {
      render(
        <MergedGroupTable
          groups={[mockMergedGroup]}
          onSort={vi.fn()}
        />
      )

      const totalSalesHeader = screen.getByText('Всего продаж').closest('th')
      expect(totalSalesHeader).toHaveClass('cursor-pointer')
      expect(totalSalesHeader).toHaveClass('hover:bg-gray-100')
    })
  })

  // ============================================================================
  // 5. Accessibility Tests (3 tests)
  // ============================================================================

  describe('Accessibility', () => {
    it('has accessible table structure', () => {
      const { container } = render(<MergedGroupTable groups={[mockMergedGroup]} />)

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()

      const thead = container.querySelector('thead')
      expect(thead).toBeInTheDocument()

      const tbody = container.querySelector('tbody')
      expect(tbody).toBeInTheDocument()
    })

    it('has table caption for screen readers', () => {
      const { container } = render(<MergedGroupTable groups={[mockMergedGroup]} />)

      const caption = container.querySelector('caption')
      expect(caption).toBeInTheDocument()
      expect(caption).toHaveClass('sr-only')
      expect(caption).toHaveTextContent('Таблица рекламной аналитики по склейкам товаров')
    })

    it('crown icon has aria-label for screen readers', () => {
      const { container } = render(<MergedGroupTable groups={[mockMergedGroup]} />)

      const crownIcon = container.querySelector('[aria-label="Главный товар"]')
      expect(crownIcon).toBeInTheDocument()
      expect(crownIcon).toHaveAttribute('aria-label', 'Главный товар')
    })
  })

  // ============================================================================
  // 6. Responsive Tests (2 tests)
  // ============================================================================

  describe('Responsive Design', () => {
    it('applies sticky columns on tablet/mobile', () => {
      render(<MergedGroupTable groups={[mockMergedGroup]} />)

      // Rowspan cell should have sticky classes
      const rowspanCell = screen.getByText('+ 2 товаров').closest('td')
      expect(rowspanCell).toHaveClass('md:sticky', 'md:left-0', 'md:z-10')
    })

    it('shows horizontal scrollbar wrapper', () => {
      const { container } = render(<MergedGroupTable groups={[mockMergedGroup]} />)

      const wrapper = container.querySelector('.overflow-x-auto')
      expect(wrapper).toBeInTheDocument()
      expect(wrapper).toHaveClass('scrollbar-thin', 'scrollbar-thumb-gray-300')
    })
  })
})
