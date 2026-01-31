/**
 * Dashboard Content Component
 * Epic 62-FE: Dashboard UI/UX Presentation
 *
 * Main dashboard with 8-card metrics grid, daily breakdown chart/table,
 * advertising widget, and expense chart. Uses hooks from Epic 61-FE.
 *
 * @see docs/epics/epic-62-fe-dashboard-presentation.md
 */

'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useDashboardPeriod } from '@/hooks/useDashboardPeriod'
import { useOrdersVolumeWithComparison } from '@/hooks/useOrdersVolume'
import { useOrdersCogsWithComparison } from '@/hooks/useOrdersCogs'
import { useFinancialSummaryWithPeriodComparison } from '@/hooks/useFinancialSummary'
import { useAdvertisingAnalyticsComparison } from '@/hooks/useAdvertisingAnalytics'
import { useProcessingStatus } from '@/hooks/useProcessingStatus'
import { useProductsCount, useProductsWithCogs } from '@/hooks/useProducts'
import { useDataImportNotification } from '@/hooks/useDataImportNotification'
import { calculateTheoreticalProfit } from '@/lib/theoretical-profit'
import { weekToDateRange, monthToDateRange } from '@/lib/date-utils'
import { ROUTES } from '@/lib/routes'
import { dashboardQueryKeys } from '@/hooks/useDashboard'
import { DashboardMetricsGrid } from '@/components/custom/dashboard'
import { DailyBreakdownSection } from '@/components/custom/dashboard'
import { DashboardPeriodSelector } from '@/components/custom/DashboardPeriodSelector'
import { PeriodContextLabel } from '@/components/custom/PeriodContextLabel'
import { ExpenseChart } from '@/components/custom/ExpenseChart'
import { TrendGraph } from '@/components/custom/TrendGraph'
import { AdvertisingDashboardWidget } from '@/components/custom/AdvertisingDashboardWidget'
import { InitialDataSummary } from '@/components/custom/InitialDataSummary'
import { ProcessingAlert, FailedAlert, ErrorAlert } from './DashboardAlerts'
import type { PreviousPeriodData } from '@/components/custom/dashboard'

/**
 * Dashboard content with Epic 62-FE 8-card metrics grid
 */
export function DashboardContent(): React.ReactElement {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { periodType, selectedWeek, selectedMonth, lastRefresh } = useDashboardPeriod()
  const selectedPeriod = periodType === 'week' ? selectedWeek : selectedMonth

  // Epic 61-FE: Orders Volume (Story 61.3)
  const ordersQuery = useOrdersVolumeWithComparison({
    periodType,
    period: selectedPeriod,
  })

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
  const revenueTotal = summaryRus?.sale_gross ?? summaryTotal?.sale_gross_total

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

  // Initialize data import notification
  const hasFinancialData = ordersQuery.current !== undefined
  useDataImportNotification(!!hasFinancialData, ordersQuery.isLoading)

  // Advertising data with comparison
  const advertisingDateRange = useMemo(() => {
    return periodType === 'week' ? weekToDateRange(selectedWeek) : monthToDateRange(selectedMonth)
  }, [periodType, selectedWeek, selectedMonth])

  const { previousWeek, previousMonth } = useDashboardPeriod()
  const prevAdRange = useMemo(() => {
    return periodType === 'week' ? weekToDateRange(previousWeek) : monthToDateRange(previousMonth)
  }, [periodType, previousWeek, previousMonth])

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
  const previousPeriodData = useMemo<PreviousPeriodData | undefined>(() => {
    // Check if we have any previous period data
    const hasPrevFinancial = prevSummaryRus || prevSummaryTotal
    if (
      !ordersQuery.previous &&
      !advertisingQuery.previous &&
      !ordersCogs.previous &&
      !hasPrevFinancial
    ) {
      return undefined
    }

    // Get previous period values
    const prevOrdersAmount = ordersQuery.previous?.totalAmount ?? null
    const prevOrdersCogs = ordersCogs.previous?.cogsTotal ?? null
    const prevAdvertisingSpend = advertisingQuery.previous?.summary?.total_spend ?? null
    const prevCogsTotal = prevSummaryRus?.cogs_total ?? prevSummaryTotal?.cogs_total ?? null

    // Calculate theoretical profit for previous period using Sales (not Orders)
    // Formula: Выкупы - COGS - Реклама - Логистика - Хранение
    const prevTheoreticalProfit =
      prevSalesAmount != null &&
      prevCogsTotal != null &&
      prevAdvertisingSpend != null &&
      prevLogisticsCost != null &&
      prevStorageCost != null
        ? calculateTheoreticalProfit({
            salesAmount: prevSalesAmount ?? null,
            cogs: prevCogsTotal ?? null,
            advertisingSpend: prevAdvertisingSpend ?? null,
            logisticsCost: prevLogisticsCost ?? null,
            storageCost: prevStorageCost ?? null,
          })
        : null

    return {
      ordersAmount: prevOrdersAmount,
      ordersCogs: prevOrdersCogs,
      salesAmount: prevSalesAmount ?? null,
      salesCogs: prevSummaryRus?.cogs_total ?? prevSummaryTotal?.cogs_total ?? null,
      advertisingSpend: prevAdvertisingSpend,
      logisticsCost: prevLogisticsCost ?? null,
      storageCost: prevStorageCost ?? null,
      theoreticalProfit: prevTheoreticalProfit?.value ?? null,
    }
  }, [
    ordersQuery.previous,
    advertisingQuery.previous,
    ordersCogs.previous,
    prevSummaryRus,
    prevSummaryTotal,
    prevSalesAmount,
    prevLogisticsCost,
    prevStorageCost,
  ])

  // Combined loading state
  const isLoading = ordersQuery.isLoading || summaryLoading || advertisingQuery.isLoading

  // Combined error state
  const error = ordersQuery.error || ordersCogs.error || null

  const handleRetry = (): void => {
    queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all })
    ordersQuery.current // Trigger refetch
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

      {/* Error State */}
      {error && !isFinancialDataProcessing && <ErrorAlert onRetry={handleRetry} />}

      {/* Epic 62-FE: 8-Card Metrics Grid */}
      <DashboardMetricsGrid
        ordersAmount={ordersQuery.current?.totalAmount}
        ordersCount={ordersQuery.current?.totalOrders}
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
        error={error}
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
      {ordersQuery.isLoading && (
        <div className="fixed bottom-4 right-4 rounded-lg bg-primary/10 px-3 py-2 text-sm">
          <RefreshCw className="mr-2 inline-block h-4 w-4 animate-spin" />
          Обновление данных...
        </div>
      )}
    </div>
  )
}
