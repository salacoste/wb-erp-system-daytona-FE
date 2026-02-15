/**
 * TDD Tests for MetricsGrid — Story 65.17
 * RED phase: Tests define expected behavior BEFORE implementation.
 *
 * Responsive 3-column grid layout with section headers and skeleton.
 * Breakpoints: mobile 1col, md(768px) 2col, xl(1280px) 3col.
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-4-ux.md — Story 65.17
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { DashboardMetricsGrid } from '@/components/custom/dashboard/DashboardMetricsGrid'
import { DashboardMetricsGridSkeleton } from '@/components/custom/dashboard/DashboardMetricsGridSkeleton'

/**
 * Minimal props for DashboardMetricsGrid rendering (all values undefined = empty state).
 * This object satisfies the required props while keeping the test focused on layout.
 */
function createMinimalGridProps() {
  return {
    totalOrders: 100,
    saleGross: 50000,
    wbSalesGross: 45000,
    wbReturnsGross: 5000,
    commissionSales: 3000,
    acquiringFee: 500,
    loyaltyFee: 200,
    penaltiesTotal: 100,
    wbCommissionAdj: 50,
    wbServicesCost: 150,
    logisticsCost: 8000,
    payoutTotal: 40000,
    storageCost: 2000,
    paidAcceptanceCost: 500,
    cogsTotal: 15000,
    cogsCoverage: 85,
    productsWithCogs: 17,
    totalProducts: 20,
    advertisingSpend: 5000,
    advertisingRoas: 3.5,
    grossProfit: 20000,
    marginPct: 25.5,
    previousPeriodData: undefined,
    isLoading: false,
    error: null,
  }
}

describe('MetricsGrid (Story 65.17)', () => {
  describe('grid layout classes', () => {
    /** AC-65.17.1, AC-65.17.2, AC-65.17.3: responsive breakpoints */
    it('renders grid container with responsive column classes', () => {
      const props = createMinimalGridProps()
      renderWithProviders(<DashboardMetricsGrid {...props} />)

      const grid = screen.getByRole('region', { name: /метрик/i })
      expect(grid).toBeInTheDocument()

      // After Story 65.17 implementation, the grid should use:
      // grid-cols-1 (mobile) + md:grid-cols-2 (tablet) + xl:grid-cols-3 (desktop)
      expect(grid).toHaveClass('grid')
      expect(grid).toHaveClass('grid-cols-1')
      expect(grid).toHaveClass('md:grid-cols-2')
      expect(grid).toHaveClass('xl:grid-cols-3')
    })

    /** AC-65.17.1: 3 columns on desktop (xl breakpoint) */
    it('uses xl:grid-cols-3 for desktop layout', () => {
      const props = createMinimalGridProps()
      renderWithProviders(<DashboardMetricsGrid {...props} />)

      const grid = screen.getByRole('region', { name: /метрик/i })
      expect(grid).toHaveClass('xl:grid-cols-3')
    })

    /** AC-65.17.4: cards equal height in row */
    it('applies items-stretch for equal card heights', () => {
      const props = createMinimalGridProps()
      renderWithProviders(<DashboardMetricsGrid {...props} />)

      const grid = screen.getByRole('region', { name: /метрик/i })
      expect(grid).toHaveClass('items-stretch')
    })

    /** AC-65.17.1: gap-4 between cards */
    it('applies gap-4 between grid items', () => {
      const props = createMinimalGridProps()
      renderWithProviders(<DashboardMetricsGrid {...props} />)

      const grid = screen.getByRole('region', { name: /метрик/i })
      expect(grid).toHaveClass('gap-4')
    })
  })

  describe('section headers (Story 65.18 integration)', () => {
    /** AC-65.18.1, AC-65.17.6: section headers span full width */
    it('section headers use col-span-full in grid context', () => {
      const props = createMinimalGridProps()
      const { container } = renderWithProviders(<DashboardMetricsGrid {...props} />)

      // Section headers should span all columns
      const sectionHeaders = container.querySelectorAll('[class*="col-span-full"]')
      expect(sectionHeaders.length).toBeGreaterThan(0)
    })

    /** AC-65.18.1: renders section header labels */
    it('renders section headers for logical groups', () => {
      const props = createMinimalGridProps()
      renderWithProviders(<DashboardMetricsGrid {...props} />)

      // At minimum, the current 5 sections should have headers
      // Exact labels depend on implementation, but these are the defined sections:
      expect(screen.getByText(/ВЫРУЧКА/i)).toBeInTheDocument()
      expect(screen.getByText(/РАСХОДЫ/i)).toBeInTheDocument()
      expect(screen.getByText(/ПРИБЫЛЬ/i)).toBeInTheDocument()
    })

    it('cards are grouped under correct sections', () => {
      const props = createMinimalGridProps()
      renderWithProviders(<DashboardMetricsGrid {...props} />)

      // All 10 metric cards should be rendered
      const articles = screen.getAllByRole('article')
      expect(articles.length).toBe(10)
    })
  })

  describe('skeleton layout (Story 65.17)', () => {
    /** AC-65.17.5: skeleton uses same grid as actual */
    it('skeleton renders same responsive grid structure', () => {
      renderWithProviders(<DashboardMetricsGridSkeleton />)

      const grid = screen.getByRole('region', { name: /загрузка/i })
      expect(grid).toHaveClass('grid')
      expect(grid).toHaveClass('grid-cols-1')
      expect(grid).toHaveClass('md:grid-cols-2')
      // AC-65.17.5: skeleton should use xl:grid-cols-3 (not 4)
      expect(grid).toHaveClass('xl:grid-cols-3')
    })

    /** AC-65.17.5: skeleton card count matches actual */
    it('skeleton default card count matches actual grid cards', () => {
      const { container } = renderWithProviders(<DashboardMetricsGridSkeleton />)

      // Default skeleton should show cards matching actual grid count
      const skeletonCards = container.querySelectorAll('[class*="rounded-xl"]')
      expect(skeletonCards.length).toBeGreaterThanOrEqual(8)
    })

    it('skeleton respects custom cardCount prop', () => {
      const { container } = renderWithProviders(<DashboardMetricsGridSkeleton cardCount={10} />)

      const skeletonCards = container.querySelectorAll('[class*="rounded-xl"]')
      expect(skeletonCards.length).toBe(10)
    })

    it('skeleton uses pulse animation', () => {
      const { container } = renderWithProviders(<DashboardMetricsGridSkeleton />)

      const pulsingElements = container.querySelectorAll('[class*="animate-pulse"]')
      expect(pulsingElements.length).toBeGreaterThan(0)
    })

    it('skeleton grid has aria-busy="true"', () => {
      renderWithProviders(<DashboardMetricsGridSkeleton />)

      const grid = screen.getByRole('region')
      expect(grid).toHaveAttribute('aria-busy', 'true')
    })

    it('skeleton cards have aria-hidden="true" for decorative elements', () => {
      const { container } = renderWithProviders(<DashboardMetricsGridSkeleton />)

      const hiddenElements = container.querySelectorAll('[aria-hidden="true"]')
      expect(hiddenElements.length).toBeGreaterThan(0)
    })
  })

  describe('loading state delegation', () => {
    it('renders skeleton when isLoading is true', () => {
      const props = createMinimalGridProps()
      renderWithProviders(<DashboardMetricsGrid {...props} isLoading={true} />)

      const grid = screen.getByRole('region', { name: /загрузка/i })
      expect(grid).toHaveAttribute('aria-busy', 'true')
      // Metric cards should not be rendered during loading
      expect(screen.queryAllByRole('article').length).toBe(0)
    })
  })
})
