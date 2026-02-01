/**
 * Dashboard Content Component
 * Epic 62-FE: Dashboard UI/UX Presentation
 * Epic 60: FBO/FBS Order Analytics Separation
 *
 * Main dashboard with 8-card metrics grid (including FBO/FBS card),
 * daily breakdown chart/table, advertising widget, and expense chart.
 *
 * @see docs/epics/epic-62-fe-dashboard-presentation.md
 * @see docs/request-backend/130-DASHBOARD-FBO-ORDERS-API.md
 */

'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useDashboardPeriod } from '@/hooks/useDashboardPeriod'
import { useOrdersCogsWithComparison } from '@/hooks/useOrdersCogs'
import { useFinancialSummaryWithPeriodComparison } from '@/hooks/useFinancialSummary'
import { useAdvertisingAnalyticsComparison } from '@/hooks/useAdvertisingAnalytics'
import {
  useFulfillmentSummaryWithComparison,
  useFulfillmentSyncStatus,
  useStartFulfillmentSync,
} from '@/hooks/useFulfillment'
import { useProcessingStatus } from '@/hooks/useProcessingStatus'
import { useProductsCount, useProductsWithCogs } from '@/hooks/useProducts'
import { useDataImportNotification } from '@/hooks/useDataImportNotification'
import { usePreviousPeriodData } from '@/hooks/usePreviousPeriodData'
import { calculateTheoreticalProfit } from '@/lib/theoretical-profit'
import { weekToDateRange, monthToDateRange } from '@/lib/date-utils'
import { ROUTES } from '@/lib/routes'
import { dashboardQueryKeys } from '@/hooks/useDashboard'
import { DashboardMetricsGrid, DailyBreakdownSection } from '@/components/custom/dashboard'
import { DashboardPeriodSelector } from '@/components/custom/DashboardPeriodSelector'
import { PeriodContextLabel } from '@/components/custom/PeriodContextLabel'
import { ExpenseChart } from '@/components/custom/ExpenseChart'
import { TrendGraph } from '@/components/custom/TrendGraph'
import { AdvertisingDashboardWidget } from '@/components/custom/AdvertisingDashboardWidget'
import { InitialDataSummary } from '@/components/custom/InitialDataSummary'
import { ProcessingAlert, FailedAlert, ErrorAlert } from './DashboardAlerts'

/**
 * Dashboard content with Epic 62-FE 8-card metrics grid and Epic 60 FBO/FBS
 */
export function DashboardContent(): React.ReactElement {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { periodType, selectedWeek, selectedMonth, lastRefresh } = useDashboardPeriod()
  const selectedPeriod = periodType === 'week' ? selectedWeek : selectedMonth

  // Calculate date ranges for fulfillment
  const fulfillmentDateRange = useMemo(() => {
    return periodType === 'week' ? weekToDateRange(selectedWeek) : monthToDateRange(selectedMonth)
  }, [periodType, selectedWeek, selectedMonth])

  const { previousWeek, previousMonth } = useDashboardPeriod()
  const prevFulfillmentRange = useMemo(() => {
    return periodType === 'week' ? weekToDateRange(previousWeek) : monthToDateRange(previousMonth)
  }, [periodType, previousWeek, previousMonth])

  // Epic 60: FBO/FBS Fulfillment metrics
  const fulfillmentQuery = useFulfillmentSummaryWithComparison({
    from: fulfillmentDateRange.from,
    to: fulfillmentDateRange.to,
    previousFrom: prevFulfillmentRange.from,
    previousTo: prevFulfillmentRange.to,
  })
  const { data: syncStatus } = useFulfillmentSyncStatus()
  const startSyncMutation = useStartFulfillmentSync()

  // Epic 61-FE: Orders with COGS (Story 61.4) with comparison (Story 61.11)
  const ordersCogs = useOrdersCogsWithComparison({ periodType, period: selectedPeriod })

  // Finance summary for logistics/storage with previous period comparison (Story 61.11-FE)
  const financialComparison = useFinancialSummaryWithPeriodComparison({
    periodType,
    period: selectedPeriod,
  })
  const summaryLoading = financialComparison.isLoading

  // Prefer summary_rus (standard field names), fallback to summary_total (_total suffix)
  const summaryRus = financialComparison.current?.summary_rus
  const summaryTotal = financialComparison.current?.summary_total
  const prevSummaryRus = financialComparison.previous?.summary_rus
  const prevSummaryTotal = financialComparison.previous?.summary_total

  // Extract values with correct field names (summary_rus vs summary_total)
  const salesAmount = summaryRus?.wb_sales_gross ?? summaryTotal?.wb_sales_gross_total
  const logisticsCost = summaryRus?.logistics_cost ?? summaryTotal?.logistics_cost_total
  const storageCost = summaryRus?.storage_cost ?? summaryTotal?.storage_cost_total
  const cogsTotal = summaryRus?.cogs_total ?? summaryTotal?.cogs_total
  // Issue #3 Fix: Use wb_sales_gross (Выкупы) as base for expense percentages
  // This ensures consistency with the "Выкупы" card value (84,377₽ vs sale_gross 128,487₽)
  const revenueTotal = summaryRus?.wb_sales_gross ?? summaryTotal?.wb_sales_gross_total

  // Previous period values
  const prevSalesAmount = prevSummaryRus?.wb_sales_gross ?? prevSummaryTotal?.wb_sales_gross_total
  const prevLogisticsCost = prevSummaryRus?.logistics_cost ?? prevSummaryTotal?.logistics_cost_total
  const prevStorageCost = prevSummaryRus?.storage_cost ?? prevSummaryTotal?.storage_cost_total

  // Products count for COGS coverage
  const { data: processingStatus } = useProcessingStatus()
  const { data: productCount, isLoading: productsLoading } = useProductsCount()
  const { data: productsWithCogsData, isLoading: cogsLoading } = useProductsWithCogs({ limit: 1 })
  const inventoryWithCogs = productsWithCogsData?.pagination?.total ?? 0

  // COGS coverage calculation
  const cogsCoverage =
    productCount && productCount > 0 ? (inventoryWithCogs / productCount) * 100 : 0

  // Initialize data import notification (use fulfillment data availability)
  const hasFinancialData = fulfillmentQuery.current !== undefined
  useDataImportNotification(!!hasFinancialData, fulfillmentQuery.isLoading)

  // Advertising data with comparison (reuse fulfillment date ranges)
  const advertisingDateRange = fulfillmentDateRange
  const prevAdRange = prevFulfillmentRange

  const advertisingQuery = useAdvertisingAnalyticsComparison(
    { from: advertisingDateRange.from, to: advertisingDateRange.to, limit: 1 },
    { from: prevAdRange.from, to: prevAdRange.to, limit: 1 },
    { refetchInterval: undefined }
  )

  // Epic 61-FE: Theoretical Profit (Story 61.10)
  // Formula: Выкупы - COGS - Реклама - Логистика - Хранение
  // Uses salesAmount (wb_sales_gross) NOT ordersAmount per QA report 128
  const theoreticalProfit = useMemo(() => {
    return calculateTheoreticalProfit({
      salesAmount: salesAmount ?? null,
      cogs: cogsTotal ?? null,
      advertisingSpend: advertisingQuery.current?.summary?.total_spend ?? null,
      logisticsCost: logisticsCost ?? null,
      storageCost: storageCost ?? null,
    })
  }, [salesAmount, cogsTotal, advertisingQuery.current, logisticsCost, storageCost])

  // Previous period data for comparison (Story 61.11-FE)
  const previousPeriodData = usePreviousPeriodData({
    fulfillmentPrevious: fulfillmentQuery.previous,
    advertisingPrevious: advertisingQuery.previous,
    ordersCogsTotal: ordersCogs.previous?.cogsTotal,
    prevSummaryRus,
    prevSummaryTotal,
    prevSalesAmount,
    prevLogisticsCost,
    prevStorageCost,
  })

  // Combined loading state (without fulfillment - it's independent)
  const isLoading = summaryLoading || advertisingQuery.isLoading || ordersCogs.isLoading

  // Separate error states - fulfillment errors don't affect other cards
  const fulfillmentError = fulfillmentQuery.error || null
  const otherError = ordersCogs.error || null

  const handleRetry = (): void => {
    queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all })
  }

  // Processing status alerts
  const isFinancialDataProcessing =
    !hasFinancialData &&
    (processingStatus?.reportLoading?.status === 'in_progress' ||
      processingStatus?.reportLoading?.status === 'pending')

  const isFinancialDataFailed = processingStatus?.reportLoading?.status === 'failed'

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Главная страница</h2>
          <PeriodContextLabel
            periodType={periodType}
            week={selectedWeek}
            month={selectedMonth}
            lastRefresh={lastRefresh}
          />
        </div>
        <DashboardPeriodSelector />
      </div>

      {/* Processing Status Alerts */}
      {isFinancialDataProcessing && <ProcessingAlert processingStatus={processingStatus} />}
      {isFinancialDataFailed && <FailedAlert />}

      {/* Error State - only show for non-fulfillment errors */}
      {otherError && !isFinancialDataProcessing && <ErrorAlert onRetry={handleRetry} />}

      {/* Epic 62-FE: 8-Card Metrics Grid with Epic 60 FBO/FBS */}
      <DashboardMetricsGrid
        // FBO/FBS Fulfillment (Epic 60)
        fboOrdersCount={fulfillmentQuery.current?.summary.fbo.ordersCount}
        fboOrdersRevenue={fulfillmentQuery.current?.summary.fbo.ordersRevenue}
        fbsOrdersCount={fulfillmentQuery.current?.summary.fbs.ordersCount}
        fbsOrdersRevenue={fulfillmentQuery.current?.summary.fbs.ordersRevenue}
        fboShare={fulfillmentQuery.current?.summary.total.fboShare}
        fbsShare={fulfillmentQuery.current?.summary.total.fbsShare}
        previousFulfillmentRevenue={fulfillmentQuery.previous?.summary.total.ordersRevenue}
        isFulfillmentDataAvailable={syncStatus?.isDataAvailable ?? false}
        onStartFulfillmentSync={() => startSyncMutation.mutate({ dataSource: 'both' })}
        isFulfillmentSyncLoading={startSyncMutation.isPending}
        fulfillmentError={fulfillmentError}
        // Other metrics
        ordersCogs={ordersCogs.current?.cogsTotal}
        salesAmount={salesAmount}
        salesCogs={cogsTotal ?? undefined}
        advertisingSpend={advertisingQuery.current?.summary?.total_spend}
        logisticsCost={logisticsCost}
        storageCost={storageCost}
        revenueTotal={revenueTotal}
        theoreticalProfit={theoreticalProfit}
        productsWithCogs={inventoryWithCogs}
        totalProducts={productCount ?? 0}
        cogsCoverage={cogsCoverage}
        previousPeriodData={previousPeriodData}
        isLoading={isLoading || productsLoading || cogsLoading}
        isFulfillmentLoading={fulfillmentQuery.isLoading}
        error={otherError}
        onRetry={handleRetry}
        onAssignCogs={() => router.push(ROUTES.COGS.ROOT)}
      />

      {/* Epic 62-FE: Daily Breakdown Section (Chart + Table) */}
      <DailyBreakdownSection className="mt-8" />

      {/* Advertising Widget */}
      <AdvertisingDashboardWidget dateRange={advertisingDateRange} hideLocalSelector />

      {/* Expense Chart */}
      <ExpenseChart weekOverride={periodType === 'week' ? selectedWeek : undefined} />

      {/* Trend Graphs */}
      <TrendGraph />

      {/* COGS CTA - only shows when COGS < 100% */}
      <InitialDataSummary
        cogsCoverage={cogsCoverage}
        totalProducts={productCount ?? 0}
        productsWithCogs={inventoryWithCogs}
      />

      {/* Refetching indicator */}
      {fulfillmentQuery.isLoading && (
        <div className="fixed bottom-4 right-4 rounded-lg bg-primary/10 px-3 py-2 text-sm">
          <RefreshCw className="mr-2 inline-block h-4 w-4 animate-spin" />
          Обновление данных...
        </div>
      )}
    </div>
  )
}
