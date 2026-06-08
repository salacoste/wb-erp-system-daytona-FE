/**
 * DashboardContent — no_data processing-alert suppression
 *
 * Regression for the cross-consumer bug: a terminal `status: 'no_data'` still
 * carries `reportLoading.status: 'pending'`, but polling has STOPPED. The dashboard
 * must NOT show the "Обработка финансовых данных" alert for a genuinely-empty cabinet,
 * otherwise it stays stuck visible forever.
 *
 * @see src/app/(dashboard)/dashboard/components/DashboardContent.tsx (isProcessing guard)
 * @see src/hooks/useProcessingStatus.ts (no_data terminal state)
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DashboardContent } from '../DashboardContent'

// Processing status drives the alert under test — return terminal no_data with the
// historically-load-bearing reportLoading.status: 'pending'.
vi.mock('@/hooks/useProcessingStatus', () => ({
  useProcessingStatus: () => ({
    data: {
      status: 'no_data',
      productParsing: { progress: 0, status: 'pending' },
      reportLoading: { progress: 0, status: 'pending' },
    },
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}))

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

// No financial data → hasFinancialData false (fulfillment current === undefined),
// so the only thing keeping the alert away is the no_data guard.
vi.mock('@/hooks/useFinancialSummary', () => ({
  useFinancialSummaryWithPeriodComparison: () => ({
    current: undefined,
    previous: undefined,
    isLoading: false,
    error: null,
  }),
  useAvailableWeeks: () => ({ data: [] }),
}))

vi.mock('@/hooks/useDataAvailability', () => ({
  useDataAvailability: () => ({ isFinanceAvailable: false, latestAvailableWeek: undefined }),
}))

vi.mock('@/hooks/useFulfillment', () => ({
  useFulfillmentSummaryWithComparison: () => ({
    current: undefined,
    previous: undefined,
    isLoading: false,
    error: null,
  }),
}))

vi.mock('@/hooks/useAdvertisingAnalytics', () => ({
  useAdvertisingAnalyticsComparison: () => ({
    current: undefined,
    previous: undefined,
    isLoading: false,
  }),
}))

vi.mock('@/hooks/useProducts', () => ({
  useProductsCount: () => ({ data: 0, isLoading: false, isError: false }),
  useProductsWithCogs: () => ({ data: { pagination: { total: 0 } }, isLoading: false }),
}))

vi.mock('@/hooks/useDataImportNotification', () => ({ useDataImportNotification: () => {} }))
vi.mock('@/hooks/usePreviousPeriodData', () => ({ usePreviousPeriodData: () => null }))
vi.mock('@/hooks/usePreliminaryTax', () => ({ usePreliminaryTax: () => null }))

// Stub heavy visual children — irrelevant to the alert assertion.
vi.mock('@/components/custom/ExpenseChart', () => ({ ExpenseChart: () => null }))
vi.mock('@/components/custom/TrendGraph', () => ({ TrendGraph: () => null }))
vi.mock('@/components/custom/AdvertisingDashboardWidget', () => ({
  AdvertisingDashboardWidget: () => null,
}))
vi.mock('@/components/custom/DashboardPeriodSelector', () => ({
  DashboardPeriodSelector: () => null,
}))
vi.mock('@/components/custom/PeriodContextLabel', () => ({ PeriodContextLabel: () => null }))
vi.mock('@/components/custom/InitialDataSummary', () => ({ InitialDataSummary: () => null }))
vi.mock('./ReportPendingBanner', () => ({ ReportPendingBanner: () => null }))
vi.mock('@/components/custom/dashboard', () => ({
  DashboardMetricsGrid: () => null,
  DailyBreakdownSection: () => null,
  IncompleteWeekBanner: () => null,
  TaxWarningBanner: () => null,
  InventorySummaryWidget: () => null,
}))
// NOTE: DashboardAlerts is intentionally NOT mocked — we assert the real
// ProcessingAlert is absent.

function renderWithProviders(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{component}</TooltipProvider>
    </QueryClientProvider>
  )
}

describe('DashboardContent — no_data processing-alert suppression', () => {
  it('does NOT render the processing alert when status is "no_data"', () => {
    renderWithProviders(<DashboardContent />)
    // The ProcessingAlert headline must be absent — no_data is terminal, not processing.
    expect(screen.queryByText(/обработка финансовых данных/i)).not.toBeInTheDocument()
  })
})
