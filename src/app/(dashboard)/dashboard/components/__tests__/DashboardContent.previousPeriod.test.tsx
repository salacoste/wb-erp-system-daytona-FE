/**
 * TDD Tests for Previous Period Data in DashboardContent
 * Story 61.11-FE: Previous Period Data Integration
 * Epic 61-FE: Dashboard Data Integration
 *
 * BUG: previousPeriodData object only fills 2 of 8 fields:
 * - ordersAmount - WORKS (via useOrdersVolumeWithComparison)
 * - ordersCogs - ALWAYS null (no previous period query)
 * - advertisingSpend - WORKS (via useAdvertisingAnalyticsComparison)
 * - logisticsCost - ALWAYS null (no previous period finance summary)
 * - storageCost - ALWAYS null (no previous period finance summary)
 * - theoreticalProfit - ALWAYS null (not calculated for previous period)
 *
 * These tests are written to FAIL (TDD Red phase) until implementation
 *
 * @see docs/stories/epic-61/story-61.11-fe-previous-period-data.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'

// =============================================================================
// Hook Mocks (must be at top level for vi.mock hoisting)
// =============================================================================

// Default mock implementations
const mockOrdersVolumeComparison = vi.fn()
const mockOrdersCogsComparison = vi.fn()
const mockFinancialSummaryComparison = vi.fn()
const mockAdvertisingComparison = vi.fn()
const mockFulfillmentSummaryComparison = vi.fn()
const mockFulfillmentSyncStatus = vi.fn()
const mockStartFulfillmentSync = vi.fn()

vi.mock('@/hooks/useOrdersVolume', () => ({
  useOrdersVolumeWithComparison: () => mockOrdersVolumeComparison(),
}))

vi.mock('@/hooks/useFulfillment', () => ({
  useFulfillmentSummaryWithComparison: () => mockFulfillmentSummaryComparison(),
  useFulfillmentSyncStatus: () => mockFulfillmentSyncStatus(),
  useStartFulfillmentSync: () => mockStartFulfillmentSync(),
}))

vi.mock('@/hooks/useOrdersCogs', () => ({
  useOrdersCogsWithComparison: () => mockOrdersCogsComparison(),
}))

vi.mock('@/hooks/useFinancialSummary', () => ({
  useFinancialSummaryWithPeriodComparison: () => mockFinancialSummaryComparison(),
  // Also export useAvailableWeeks needed by DashboardPeriodSelector
  useAvailableWeeks: () => ({ data: [], isLoading: false }),
}))

vi.mock('@/hooks/useAdvertisingAnalytics', () => ({
  useAdvertisingAnalyticsComparison: () => mockAdvertisingComparison(),
}))

// Import component after mocks are set up
import { DashboardContent } from '../DashboardContent'

// =============================================================================
// Mock Data Fixtures (Matching Business Requirements)
// =============================================================================

/**
 * Current period mock data
 * All 8 metrics populated with realistic values
 */
const mockCurrentPeriodData = {
  ordersAmount: 100000,
  ordersCount: 250,
  ordersCogs: 35818,
  salesAmount: 84377, // wb_sales_gross (actual sales, not orders)
  salesCogs: 35818, // cogs_total from finance summary
  advertisingSpend: 12131,
  logisticsCost: 17566.04,
  storageCost: 2024.94,
  // theoreticalProfit = sales - salesCogs - ads - logistics - storage
  // = 84377 - 35818 - 12131 - 17566.04 - 2024.94 = 16837.02
  theoreticalProfit: 16837.02,
}

/**
 * Previous period mock data
 * All 8 metrics for comparison (week/month prior)
 * Theoretical profit uses SALES (not orders) per QA report 128
 */
const mockPreviousPeriodData = {
  ordersAmount: 116077.27,
  ordersCount: 280,
  ordersCogs: 43890,
  salesAmount: 95000, // wb_sales_gross (actual sales for previous period)
  salesCogs: 43890, // cogs_total from finance summary
  advertisingSpend: 15000,
  logisticsCost: 20000,
  storageCost: 2500,
  // theoreticalProfit = sales - salesCogs - ads - logistics - storage
  // = 95000 - 43890 - 15000 - 20000 - 2500 = 13610
  theoreticalProfit: 13610,
}

// =============================================================================
// Mock Setup
// =============================================================================

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

// Mock dashboard period hook
vi.mock('@/hooks/useDashboardPeriod', () => ({
  useDashboardPeriod: () => ({
    periodType: 'week',
    selectedWeek: '2026-W05',
    selectedMonth: '2026-01',
    previousWeek: '2026-W04',
    previousMonth: '2025-12',
    lastRefresh: new Date(),
  }),
}))

// Mock processing status
vi.mock('@/hooks/useProcessingStatus', () => ({
  useProcessingStatus: () => ({ data: null }),
}))

// Mock products hooks
vi.mock('@/hooks/useProducts', () => ({
  useProductsCount: () => ({ data: 100, isLoading: false }),
  useProductsWithCogs: () => ({
    data: { pagination: { total: 80 } },
    isLoading: false,
  }),
}))

// Mock data import notification
vi.mock('@/hooks/useDataImportNotification', () => ({
  useDataImportNotification: () => {},
}))

// Mock visual components
vi.mock('@/components/custom/ExpenseChart', () => ({
  ExpenseChart: () => <div data-testid="expense-chart">Expense Chart</div>,
}))

vi.mock('@/components/custom/TrendGraph', () => ({
  TrendGraph: () => <div data-testid="trend-graph">Trend Graph</div>,
}))

vi.mock('@/components/custom/AdvertisingDashboardWidget', () => ({
  AdvertisingDashboardWidget: () => <div data-testid="advertising-widget">Ads Widget</div>,
}))

vi.mock('@/components/custom/dashboard', () => ({
  DashboardMetricsGrid: vi.fn(({ previousPeriodData }) => (
    <div data-testid="metrics-grid" data-previous={JSON.stringify(previousPeriodData)}>
      Metrics Grid
    </div>
  )),
  DailyBreakdownSection: () => <div data-testid="daily-breakdown">Daily Breakdown</div>,
}))

// =============================================================================
// Test Helper Functions
// =============================================================================

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  })
}

function renderWithProviders(component: React.ReactElement) {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{component}</TooltipProvider>
    </QueryClientProvider>
  )
}

/**
 * Extract previousPeriodData from rendered DashboardMetricsGrid
 */
function getPreviousPeriodDataFromRender() {
  const grid = screen.getByTestId('metrics-grid')
  const dataAttr = grid.getAttribute('data-previous')
  return dataAttr ? JSON.parse(dataAttr) : null
}

/**
 * Setup default mock implementations for all hooks
 */
function setupDefaultMocks() {
  mockOrdersVolumeComparison.mockReturnValue({
    current: { totalAmount: mockCurrentPeriodData.ordersAmount, totalOrders: 250 },
    previous: { totalAmount: mockPreviousPeriodData.ordersAmount, totalOrders: 280 },
    isLoading: false,
    isError: false,
    error: null,
  })

  mockOrdersCogsComparison.mockReturnValue({
    current: { cogsTotal: mockCurrentPeriodData.ordersCogs },
    previous: { cogsTotal: mockPreviousPeriodData.ordersCogs },
    isLoading: false,
    isError: false,
    error: null,
  })

  mockFinancialSummaryComparison.mockReturnValue({
    current: {
      summary_total: {
        wb_sales_gross_total: mockCurrentPeriodData.salesAmount,
        cogs_total: mockCurrentPeriodData.salesCogs,
        logistics_cost_total: mockCurrentPeriodData.logisticsCost,
        storage_cost_total: mockCurrentPeriodData.storageCost,
      },
    },
    previous: {
      summary_total: {
        wb_sales_gross_total: mockPreviousPeriodData.salesAmount,
        cogs_total: mockPreviousPeriodData.salesCogs,
        logistics_cost_total: mockPreviousPeriodData.logisticsCost,
        storage_cost_total: mockPreviousPeriodData.storageCost,
      },
    },
    isLoading: false,
  })

  mockAdvertisingComparison.mockReturnValue({
    current: { summary: { total_spend: mockCurrentPeriodData.advertisingSpend } },
    previous: { summary: { total_spend: mockPreviousPeriodData.advertisingSpend } },
    isLoading: false,
  })

  // Epic 60: Fulfillment mocks (FBO/FBS)
  mockFulfillmentSummaryComparison.mockReturnValue({
    current: {
      summary: {
        fbo: { ordersCount: 150, ordersRevenue: 60000 },
        fbs: { ordersCount: 100, ordersRevenue: 40000 },
        total: { ordersCount: 250, ordersRevenue: 100000, fboShare: 60, fbsShare: 40 },
      },
    },
    previous: {
      summary: {
        fbo: { ordersCount: 170, ordersRevenue: 70000 },
        fbs: { ordersCount: 110, ordersRevenue: 46077 },
        total: {
          ordersCount: 280,
          ordersRevenue: mockPreviousPeriodData.ordersAmount,
          fboShare: 60,
          fbsShare: 40,
        },
      },
    },
    isLoading: false,
    error: null,
  })

  mockFulfillmentSyncStatus.mockReturnValue({
    data: { isDataAvailable: true },
    isLoading: false,
  })

  mockStartFulfillmentSync.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  })
}

// =============================================================================
// Tests for Story 61.11-FE: Previous Period Data
// =============================================================================

describe('DashboardContent - Previous Period Data (Story 61.11-FE)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set default mock implementations
    setupDefaultMocks()
  })

  // ===========================================================================
  // COGS for Previous Period (Currently ALWAYS null)
  // ===========================================================================

  describe('Previous Period COGS (ordersCogs)', () => {
    it('should provide previous period COGS data (NOT null)', async () => {
      // Default mocks already set up in beforeEach via setupDefaultMocks()
      // The mocks return both current and previous period data

      renderWithProviders(<DashboardContent />)

      await waitFor(() => {
        const prevData = getPreviousPeriodDataFromRender()
        expect(prevData?.ordersCogs).not.toBeNull()
        expect(prevData?.ordersCogs).toBe(mockPreviousPeriodData.ordersCogs)
      })
    })

    it('should return null for ordersCogs when previous period has no data', async () => {
      mockOrdersCogsComparison.mockReturnValue({
        current: { cogsTotal: mockCurrentPeriodData.ordersCogs },
        previous: null, // No previous period data
        isLoading: false,
        isError: false,
        error: null,
      })

      renderWithProviders(<DashboardContent />)

      await waitFor(() => {
        const prevData = getPreviousPeriodDataFromRender()
        expect(prevData?.ordersCogs).toBeNull()
      })
    })
  })

  // ===========================================================================
  // Logistics Cost for Previous Period (Currently ALWAYS null)
  // ===========================================================================

  describe('Previous Period Logistics Cost (logisticsCost)', () => {
    it('should provide previous period logistics cost (NOT null)', async () => {
      // Default mocks already set up in beforeEach via setupDefaultMocks()
      renderWithProviders(<DashboardContent />)

      await waitFor(() => {
        const prevData = getPreviousPeriodDataFromRender()
        expect(prevData?.logisticsCost).not.toBeNull()
        expect(prevData?.logisticsCost).toBe(mockPreviousPeriodData.logisticsCost)
      })
    })
  })

  // ===========================================================================
  // Storage Cost for Previous Period (Currently ALWAYS null)
  // ===========================================================================

  describe('Previous Period Storage Cost (storageCost)', () => {
    it('should provide previous period storage cost (NOT null)', async () => {
      // Default mocks already set up in beforeEach via setupDefaultMocks()
      renderWithProviders(<DashboardContent />)

      await waitFor(() => {
        const prevData = getPreviousPeriodDataFromRender()
        expect(prevData?.storageCost).not.toBeNull()
        expect(prevData?.storageCost).toBe(mockPreviousPeriodData.storageCost)
      })
    })
  })

  // ===========================================================================
  // Theoretical Profit for Previous Period (Currently ALWAYS null)
  // ===========================================================================

  describe('Previous Period Theoretical Profit (theoreticalProfit)', () => {
    it('should calculate previous period theoretical profit (NOT null)', async () => {
      // Default mocks already set up in beforeEach via setupDefaultMocks()
      renderWithProviders(<DashboardContent />)

      await waitFor(() => {
        const prevData = getPreviousPeriodDataFromRender()
        expect(prevData?.theoreticalProfit).not.toBeNull()

        // Verify calculation: sales - salesCogs - ads - logistics - storage
        // Uses SALES (not orders) per QA report 128
        const expectedProfit =
          mockPreviousPeriodData.salesAmount -
          mockPreviousPeriodData.salesCogs -
          mockPreviousPeriodData.advertisingSpend -
          mockPreviousPeriodData.logisticsCost -
          mockPreviousPeriodData.storageCost

        expect(prevData?.theoreticalProfit).toBeCloseTo(expectedProfit, 2)
      })
    })

    it('should return null for theoreticalProfit when any component is missing', async () => {
      // Override financial summary to have missing cogs_total for previous period
      // Theoretical profit uses cogs_total from finance summary, not orders COGS
      mockFinancialSummaryComparison.mockReturnValue({
        current: {
          summary_total: {
            wb_sales_gross_total: mockCurrentPeriodData.salesAmount,
            cogs_total: mockCurrentPeriodData.salesCogs,
            logistics_cost_total: mockCurrentPeriodData.logisticsCost,
            storage_cost_total: mockCurrentPeriodData.storageCost,
          },
        },
        previous: {
          summary_total: {
            wb_sales_gross_total: mockPreviousPeriodData.salesAmount,
            // Missing cogs_total - this should cause theoreticalProfit to be null
            logistics_cost_total: mockPreviousPeriodData.logisticsCost,
            storage_cost_total: mockPreviousPeriodData.storageCost,
          },
        },
        isLoading: false,
      })

      renderWithProviders(<DashboardContent />)

      await waitFor(() => {
        const prevData = getPreviousPeriodDataFromRender()
        // When COGS is missing, theoreticalProfit should be null (not 0)
        expect(prevData?.theoreticalProfit).toBeNull()
      })
    })
  })

  // ===========================================================================
  // Full Integration - All 8 Metrics with Comparison
  // ===========================================================================

  describe('Full Previous Period Data Integration', () => {
    it('should provide all 8 metrics for previous period comparison', async () => {
      // Default mocks already set up in beforeEach via setupDefaultMocks()
      renderWithProviders(<DashboardContent />)

      await waitFor(() => {
        const prevData = getPreviousPeriodDataFromRender()

        // All metrics should be populated
        expect(prevData?.ordersAmount).toBe(mockPreviousPeriodData.ordersAmount)
        expect(prevData?.advertisingSpend).toBe(mockPreviousPeriodData.advertisingSpend)
        expect(prevData?.ordersCogs).toBe(mockPreviousPeriodData.ordersCogs)
        expect(prevData?.logisticsCost).toBe(mockPreviousPeriodData.logisticsCost)
        expect(prevData?.storageCost).toBe(mockPreviousPeriodData.storageCost)
        expect(prevData?.theoreticalProfit).toBeCloseTo(mockPreviousPeriodData.theoreticalProfit, 2)

        // salesAmount and salesCogs from finance summary
        expect(prevData?.salesAmount).toBe(mockPreviousPeriodData.salesAmount)
        expect(prevData?.salesCogs).toBe(mockPreviousPeriodData.salesCogs)
      })
    })

    it('should handle mixed availability - some previous period data missing', async () => {
      // Override mocks for this test: Orders and Advertising available, but no COGS
      mockOrdersVolumeComparison.mockReturnValue({
        current: { totalAmount: 100000, totalOrders: 250 },
        previous: { totalAmount: 116077, totalOrders: 280 },
        isLoading: false,
        isError: false,
        error: null,
      })

      mockOrdersCogsComparison.mockReturnValue({
        current: { cogsTotal: 35818 },
        previous: null, // No COGS for previous period
        isLoading: false,
        isError: false,
        error: null,
      })

      mockAdvertisingComparison.mockReturnValue({
        current: { summary: { total_spend: 12131 } },
        previous: { summary: { total_spend: 15000 } },
        isLoading: false,
      })

      mockFinancialSummaryComparison.mockReturnValue({
        current: { summary_total: { logistics_cost_total: 17566, storage_cost_total: 2025 } },
        previous: null, // No financial summary for previous period
        isLoading: false,
      })

      renderWithProviders(<DashboardContent />)

      await waitFor(() => {
        const prevData = getPreviousPeriodDataFromRender()

        // Available data should be filled (mockPreviousPeriodData.ordersAmount = 116077.27)
        expect(prevData?.ordersAmount).toBe(116077.27)
        expect(prevData?.advertisingSpend).toBe(15000)

        // Missing data should be null (not 0)
        expect(prevData?.ordersCogs).toBeNull()
        expect(prevData?.logisticsCost).toBeNull()
        expect(prevData?.storageCost).toBeNull()

        // Theoretical profit null when any component missing
        expect(prevData?.theoreticalProfit).toBeNull()
      })
    })
  })
})
