/**
 * TDD Tests for Previous Period Data in DashboardContent
 * Story 61.11-FE: Previous Period Data Integration
 * Epic 61-FE: Dashboard Data Integration
 *
 * Updated for P&L restructuring (Epic 65):
 * - DashboardContent now delegates to usePreviousPeriodData hook
 * - Previous period data comes from finance-summary, fulfillment, and advertising
 * - Legacy fields (ordersCogs, theoreticalProfit) are always null
 * - New fields: cogsTotal, saleGross, wbCommissionsTotal, etc.
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
const mockFinancialSummaryComparison = vi.fn()
const mockAdvertisingComparison = vi.fn()
const mockFulfillmentSummaryComparison = vi.fn()

vi.mock('@/hooks/useFulfillment', () => ({
  useFulfillmentSummaryWithComparison: (_params: unknown) => mockFulfillmentSummaryComparison(),
}))

vi.mock('@/hooks/useFinancialSummary', () => ({
  useFinancialSummaryWithPeriodComparison: () => mockFinancialSummaryComparison(),
  useAvailableWeeks: () => ({
    data: [{ week: '2026-W05' }, { week: '2026-W04' }],
    isLoading: false,
  }),
}))

vi.mock('@/hooks/useAdvertisingAnalytics', () => ({
  useAdvertisingAnalyticsComparison: () => mockAdvertisingComparison(),
}))

vi.mock('@/hooks/useDashboard', () => ({
  dashboardQueryKeys: { all: ['dashboard'] },
}))

// Import component after mocks are set up
import { DashboardContent } from '../DashboardContent'

// =============================================================================
// Mock Data Fixtures (Matching Business Requirements)
// =============================================================================

/**
 * Current period finance summary mock data
 * summary_total fields (used when summary_rus is absent)
 */
const mockCurrentFinanceSummaryTotal = {
  wb_sales_gross_total: 84377,
  cogs_total: 35818,
  logistics_cost_total: 17566.04,
  storage_cost_total: 2024.94,
  sale_gross_total: 70000,
  commission_sales_total: 5000,
  acquiring_fee_total: 1000,
  loyalty_fee_total: 500,
  penalties_total: 200,
  wb_commission_adj_total: 300,
  wb_services_cost_total: 400,
  payout_total: 50000,
  paid_acceptance_cost_total: 100,
  product_transactions: 187,
}

/**
 * Previous period finance summary mock data
 * Used by usePreviousPeriodData hook to build PreviousPeriodData
 */
const mockPreviousFinanceSummaryTotal = {
  wb_sales_gross_total: 95000,
  cogs_total: 43890,
  logistics_cost_total: 20000,
  storage_cost_total: 2500,
  sale_gross_total: 80000,
  commission_sales_total: 6000,
  acquiring_fee_total: 1200,
  loyalty_fee_total: 600,
  penalties_total: 250,
  wb_commission_adj_total: 350,
  wb_services_cost_total: 450,
  payout_total: 55000,
  paid_acceptance_cost_total: 150,
  gross_profit: 10000,
  margin_pct: 12.5,
}

/**
 * Previous period expected values for assertion
 * These match what usePreviousPeriodData computes from the mock data
 */
const expectedPreviousPeriod = {
  ordersAmount: 116077.27,
  ordersCount: 280,
  advertisingSpend: 15000,
  logisticsCost: 20000,
  storageCost: 2500, // legacy field, same as storage_cost_total
  cogsTotal: 43890,
  salesAmount: 95000, // legacy field from wb_sales_gross_total
  salesCogs: 43890, // legacy field, same as cogsTotal
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

vi.mock('@/components/custom/DashboardPeriodSelector', () => ({
  DashboardPeriodSelector: () => <div data-testid="period-selector">Period Selector</div>,
}))

vi.mock('@/components/custom/PeriodContextLabel', () => ({
  PeriodContextLabel: () => <span data-testid="period-label">Period Label</span>,
}))

vi.mock('@/components/custom/InitialDataSummary', () => ({
  InitialDataSummary: () => <div data-testid="initial-data-summary">Initial Data Summary</div>,
}))
vi.mock('@/components/custom/MissingCogsAlert', () => ({ MissingCogsAlert: () => null }))
vi.mock('@/components/custom/CogsCoverageMetricCard', () => ({
  CogsCoverageMetricCard: () => null,
}))
vi.mock('@/app/(dashboard)/analytics/components/MarketingKpiCard', () => ({
  MarketingKpiCard: () => null,
}))

vi.mock('./ReportPendingBanner', () => ({
  ReportPendingBanner: () => null,
}))

vi.mock('./DashboardAlerts', () => ({
  ProcessingAlert: () => null,
  FailedAlert: () => null,
  ErrorAlert: () => null,
}))

vi.mock('../UnitEconomicsSection', () => ({
  UnitEconomicsSection: () => null,
}))

vi.mock('../StorageSection', () => ({ StorageSection: () => null }))

vi.mock('@/components/custom/dashboard', () => ({
  DashboardMetricsGrid: vi.fn(({ previousPeriodData }) => (
    <div data-testid="metrics-grid" data-previous={JSON.stringify(previousPeriodData)}>
      Metrics Grid
    </div>
  )),
  DailyBreakdownSection: () => <div data-testid="daily-breakdown">Daily Breakdown</div>,
  IncompleteWeekBanner: () => null,
  TaxWarningBanner: () => null,
  InventorySummaryWidget: () => null,
  PeriodComparisonSection: () => null,
  OrdersSeasonalPatterns: () => null,
  OrdersStatusBreakdown: () => null,
  FulfillmentShareBar: () => null,
  HistoricalTrendsSection: () => null,
  ExpenseStructurePieChart: () => null,
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
  mockFinancialSummaryComparison.mockReturnValue({
    current: {
      summary_total: mockCurrentFinanceSummaryTotal,
    },
    previous: {
      summary_total: mockPreviousFinanceSummaryTotal,
    },
    isLoading: false,
    error: null,
  })

  mockAdvertisingComparison.mockReturnValue({
    current: { summary: { total_spend: 12131 } },
    previous: { summary: { total_spend: expectedPreviousPeriod.advertisingSpend } },
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
          ordersCount: expectedPreviousPeriod.ordersCount,
          ordersRevenue: expectedPreviousPeriod.ordersAmount,
          fboShare: 60,
          fbsShare: 40,
        },
      },
    },
    isLoading: false,
    error: null,
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
  // COGS for Previous Period
  // In P&L restructuring, cogsTotal carries COGS data (ordersCogs is legacy null)
  // ===========================================================================

  describe('Previous Period COGS (cogsTotal)', () => {
    it('should provide previous period COGS data (NOT null)', async () => {
      renderWithProviders(<DashboardContent />)

      await waitFor(() => {
        const prevData = getPreviousPeriodDataFromRender()
        // cogsTotal carries the previous period COGS value
        expect(prevData?.cogsTotal).not.toBeNull()
        expect(prevData?.cogsTotal).toBe(expectedPreviousPeriod.cogsTotal)
        // Legacy ordersCogs is always null in P&L restructuring
        expect(prevData?.ordersCogs).toBeNull()
      })
    })

    it('should return null for ordersCogs when previous period has no data', async () => {
      // Override financial summary to have no cogs_total for previous period
      mockFinancialSummaryComparison.mockReturnValue({
        current: {
          summary_total: mockCurrentFinanceSummaryTotal,
        },
        previous: {
          summary_total: {
            ...mockPreviousFinanceSummaryTotal,
            cogs_total: undefined, // No COGS data
          },
        },
        isLoading: false,
        error: null,
      })

      renderWithProviders(<DashboardContent />)

      await waitFor(() => {
        const prevData = getPreviousPeriodDataFromRender()
        // Legacy ordersCogs is always null
        expect(prevData?.ordersCogs).toBeNull()
        // cogsTotal should also be null when not in summary
        expect(prevData?.cogsTotal).toBeNull()
      })
    })
  })

  // ===========================================================================
  // Logistics Cost for Previous Period
  // ===========================================================================

  describe('Previous Period Logistics Cost (logisticsCost)', () => {
    it('should provide previous period logistics cost (NOT null)', async () => {
      renderWithProviders(<DashboardContent />)

      await waitFor(() => {
        const prevData = getPreviousPeriodDataFromRender()
        expect(prevData?.logisticsCost).not.toBeNull()
        expect(prevData?.logisticsCost).toBe(expectedPreviousPeriod.logisticsCost)
      })
    })
  })

  // ===========================================================================
  // Storage Cost for Previous Period
  // ===========================================================================

  describe('Previous Period Storage Cost (storageCost)', () => {
    it('should provide previous period storage cost (NOT null)', async () => {
      renderWithProviders(<DashboardContent />)

      await waitFor(() => {
        const prevData = getPreviousPeriodDataFromRender()
        expect(prevData?.storageCost).not.toBeNull()
        expect(prevData?.storageCost).toBe(expectedPreviousPeriod.storageCost)
      })
    })
  })

  // ===========================================================================
  // Theoretical Profit for Previous Period
  // In P&L restructuring, theoreticalProfit is a legacy null field.
  // grossProfit from finance summary carries the profit data instead.
  // ===========================================================================

  describe('Previous Period Theoretical Profit (theoreticalProfit / grossProfit)', () => {
    it('should provide previous period gross profit (NOT null)', async () => {
      renderWithProviders(<DashboardContent />)

      await waitFor(() => {
        const prevData = getPreviousPeriodDataFromRender()
        // grossProfit carries the profit data in P&L restructuring
        expect(prevData?.grossProfit).not.toBeNull()
        expect(prevData?.grossProfit).toBe(mockPreviousFinanceSummaryTotal.gross_profit)
        // Legacy theoreticalProfit is always null
        expect(prevData?.theoreticalProfit).toBeNull()
      })
    })

    it('should return null for theoreticalProfit when any component is missing', async () => {
      // Override financial summary to have missing gross_profit for previous period
      mockFinancialSummaryComparison.mockReturnValue({
        current: {
          summary_total: mockCurrentFinanceSummaryTotal,
        },
        previous: {
          summary_total: {
            wb_sales_gross_total: 95000,
            // Missing cogs_total - gross_profit should be null
            logistics_cost_total: 20000,
            storage_cost_total: 2500,
          },
        },
        isLoading: false,
        error: null,
      })

      renderWithProviders(<DashboardContent />)

      await waitFor(() => {
        const prevData = getPreviousPeriodDataFromRender()
        // Legacy theoreticalProfit is always null
        expect(prevData?.theoreticalProfit).toBeNull()
        // grossProfit is null when not in summary
        expect(prevData?.grossProfit).toBeNull()
      })
    })
  })

  // ===========================================================================
  // Full Integration - All Metrics with Comparison
  // Updated for P&L restructuring: uses new field names
  // ===========================================================================

  describe('Full Previous Period Data Integration', () => {
    it('should provide all 8 metrics for previous period comparison', async () => {
      renderWithProviders(<DashboardContent />)

      await waitFor(() => {
        const prevData = getPreviousPeriodDataFromRender()

        // Fulfillment-derived metrics
        expect(prevData?.ordersAmount).toBe(expectedPreviousPeriod.ordersAmount)
        expect(prevData?.ordersCount).toBe(expectedPreviousPeriod.ordersCount)

        // Advertising
        expect(prevData?.advertisingSpend).toBe(expectedPreviousPeriod.advertisingSpend)

        // Finance summary-derived metrics
        expect(prevData?.logisticsCost).toBe(expectedPreviousPeriod.logisticsCost)
        expect(prevData?.storageCost).toBe(expectedPreviousPeriod.storageCost)
        expect(prevData?.cogsTotal).toBe(expectedPreviousPeriod.cogsTotal)

        // salesAmount and salesCogs from finance summary (legacy fields)
        expect(prevData?.salesAmount).toBe(expectedPreviousPeriod.salesAmount)
        expect(prevData?.salesCogs).toBe(expectedPreviousPeriod.salesCogs)
      })
    })

    it('should handle mixed availability - some previous period data missing', async () => {
      // Advertising available, but no financial summary for previous period
      mockAdvertisingComparison.mockReturnValue({
        current: { summary: { total_spend: 12131 } },
        previous: { summary: { total_spend: 15000 } },
        isLoading: false,
      })

      mockFinancialSummaryComparison.mockReturnValue({
        current: {
          summary_total: { logistics_cost_total: 17566, storage_cost_total: 2025 },
        },
        previous: null, // No financial summary for previous period
        isLoading: false,
        error: null,
      })

      // Fulfillment still available
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
            fbs: { ordersCount: 110, ordersRevenue: 46077.27 },
            total: {
              ordersCount: 280,
              ordersRevenue: 116077.27,
              fboShare: 60,
              fbsShare: 40,
            },
          },
        },
        isLoading: false,
        error: null,
      })

      renderWithProviders(<DashboardContent />)

      await waitFor(() => {
        const prevData = getPreviousPeriodDataFromRender()

        // Available data should be filled from fulfillment + advertising
        expect(prevData?.ordersAmount).toBe(116077.27)
        expect(prevData?.advertisingSpend).toBe(15000)

        // Missing data should be null (no financial summary for previous period)
        expect(prevData?.ordersCogs).toBeNull() // legacy field always null
        expect(prevData?.logisticsCost).toBeNull()
        expect(prevData?.storageCost).toBeNull()
        expect(prevData?.cogsTotal).toBeNull()

        // Theoretical profit null (legacy field always null)
        expect(prevData?.theoreticalProfit).toBeNull()
      })
    })
  })
})
