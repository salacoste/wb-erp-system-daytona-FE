/**
 * Dashboard Content Component
 * Story 60.4-FE: Connect Dashboard to Period State
 * Story 60.5-FE: Remove Data Duplication - 6-card metric grid
 * Story 60.6-FE: Sync Advertising Widget with Global Period
 *
 * Renders dashboard with period selector and enhanced metric cards.
 * Uses DashboardPeriodContext for period state management.
 *
 * @see docs/stories/epic-60/story-60.4-fe-connect-dashboard-period.md
 * @see docs/stories/epic-60/story-60.5-fe-remove-data-duplication.md
 * @see docs/stories/epic-60/story-60.6-fe-sync-advertising-widget.md
 */

'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useDashboardPeriod } from '@/hooks/useDashboardPeriod'
import { useDashboardMetricsWithComparison } from '@/hooks/useDashboardMetricsWithPeriod'
import { useProcessingStatus } from '@/hooks/useProcessingStatus'
import { useProductsCount, useProductsWithCogs } from '@/hooks/useProducts'
import { useFinancialSummary } from '@/hooks/useFinancialSummary'
import { useDataImportNotification } from '@/hooks/useDataImportNotification'
import { useAdvertisingAnalyticsComparison } from '@/hooks/useAdvertisingAnalytics'
import { weekToDateRange, monthToDateRange } from '@/lib/date-utils'
import { ROUTES } from '@/lib/routes'
import { MetricCardEnhanced } from '@/components/custom/MetricCardEnhanced'
import { ProductCountMetricCard } from '@/components/custom/ProductCountMetricCard'
import { CogsCoverageMetricCard } from '@/components/custom/CogsCoverageMetricCard'
import { ExpenseChart } from '@/components/custom/ExpenseChart'
import { TrendGraph } from '@/components/custom/TrendGraph'
import { AdvertisingDashboardWidget } from '@/components/custom/AdvertisingDashboardWidget'
import { InitialDataSummary } from '@/components/custom/InitialDataSummary'
import { DashboardPeriodSelector } from '@/components/custom/DashboardPeriodSelector'
import { PeriodContextLabel } from '@/components/custom/PeriodContextLabel'
import { Percent, RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { dashboardQueryKeys } from '@/hooks/useDashboard'
import { ProcessingAlert, FailedAlert, ErrorAlert } from './DashboardAlerts'

/**
 * Dashboard content component with 6-card metric grid
 * Story 60.5-FE: Remove data duplication
 */
export function DashboardContent(): React.ReactElement {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { periodType, selectedWeek, selectedMonth, lastRefresh } = useDashboardPeriod()
  const { current, previous, isLoading, isFetching, isError, error, refetch } =
    useDashboardMetricsWithComparison()
  const { data: processingStatus } = useProcessingStatus()
  const { data: productCount, isLoading: productsLoading } = useProductsCount()

  // Fetch count of products that have COGS assigned (for Inventory Coverage)
  // We only need the total count from pagination, so limit=1 is enough
  const { data: productsWithCogsData, isLoading: cogsLoading } = useProductsWithCogs({ limit: 1 })
  const inventoryWithCogs = productsWithCogsData?.pagination?.total ?? 0

  // Fetch COGS coverage data from finance summary (supports both week and month periods)
  const { data: financeSummary, isLoading: summaryLoading } = useFinancialSummary(
    periodType === 'week' ? selectedWeek : selectedMonth,
    periodType
  )
  const summary = financeSummary?.summary_total || financeSummary?.summary_rus

  // Initialize data import toast notification (AC4)
  const hasFinancialData =
    current !== undefined && (current.totalPayable !== undefined || current.revenue !== undefined)
  useDataImportNotification(!!hasFinancialData, isLoading)

  const handleRetry = (): void => {
    queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all })
    refetch()
  }

  // Show processing window only if no data AND processing in progress
  const isFinancialDataProcessing =
    !hasFinancialData &&
    (processingStatus?.reportLoading?.status === 'in_progress' ||
      processingStatus?.reportLoading?.status === 'pending')

  const isFinancialDataFailed = processingStatus?.reportLoading?.status === 'failed'

  // Story 60.6-FE: Convert period to date range for advertising widget
  const advertisingDateRange = useMemo(() => {
    if (periodType === 'week') {
      return weekToDateRange(selectedWeek)
    }
    return monthToDateRange(selectedMonth)
  }, [periodType, selectedWeek, selectedMonth])

  // Calculate previous period date range for comparison
  const { previousWeek, previousMonth } = useDashboardPeriod()

  const prevAdRange = useMemo(() => {
    if (periodType === 'week') {
      return weekToDateRange(previousWeek)
    }
    return monthToDateRange(previousMonth)
  }, [periodType, previousWeek, previousMonth])

  // Fetch advertising analytics comparison
  const {
    current: advertisingData,
    previous: previousAdvertisingData,
    isLoading: advertisingLoading,
  } = useAdvertisingAnalyticsComparison(
    {
      from: advertisingDateRange.from,
      to: advertisingDateRange.to,
      limit: 1,
    },
    {
      from: prevAdRange.from,
      to: prevAdRange.to,
      limit: 1,
    },
    {
      refetchInterval: undefined,
    }
  )

  // COGS Inventory Coverage
  // Use inventoryWithCogs (from products API) / productCount (total inventory)
  const cogsCoverage =
    productCount && productCount > 0 ? (inventoryWithCogs / productCount) * 100 : 0

  // For card display
  const displayProductsWithCogs = inventoryWithCogs
  const displayTotalProducts = productCount ?? 0

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
      {isError && !isFinancialDataProcessing && <ErrorAlert onRetry={handleRetry} />}

      {/* Story 60.5-FE: 6-card metric grid (AC6: 3 columns on lg, 2 on md, 1 on sm) */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: К перечислению */}
        <MetricCardEnhanced
          title="К перечислению за товар"
          value={current?.totalPayable}
          previousValue={previous?.totalPayable}
          format="currency"
          isLoading={isLoading}
          error={error ? 'Ошибка загрузки' : null}
        />

        {/* Card 2: Реализовано */}
        <MetricCardEnhanced
          title="Вайлдберриз реализовал Товар"
          value={current?.revenue}
          previousValue={previous?.revenue}
          format="currency"
          isLoading={isLoading}
          error={error ? 'Ошибка загрузки' : null}
        />

        {/* Card 3: Маржа % */}
        <MetricCardEnhanced
          title="Маржа %"
          value={calculateMarginPercentage(summary?.gross_profit, summary?.sale_gross_total)}
          previousValue={calculateMarginPercentage(previous?.grossProfit, previous?.revenue)}
          format="percentage"
          icon={Percent}
          tooltip="Валовая маржа = (Выручка - COGS) / Выручка"
          isLoading={summaryLoading}
          showCogsWarning={summary?.cogs_total === null}
          productsWithCogs={displayProductsWithCogs}
          totalProducts={displayTotalProducts}
          cogsCoverage={cogsCoverage}
          onAssignCogs={() => router.push(ROUTES.COGS.ROOT)}
        />

        {/* Card 4: Товаров (AC2) */}
        <ProductCountMetricCard count={productCount ?? 0} isLoading={productsLoading} />

        {/* Card 5: COGS покрытие (AC5) */}
        <CogsCoverageMetricCard
          productsWithCogs={displayProductsWithCogs}
          totalProducts={displayTotalProducts}
          coverage={cogsCoverage}
          isLoading={summaryLoading || cogsLoading}
          onClick={() => router.push(ROUTES.COGS.ROOT)}
          className="cursor-pointer hover:shadow-md transition-shadow"
        />

        {/* Card 6: ROAS рекламы (AC6) */}
        <MetricCardEnhanced
          title="ROAS рекламы"
          value={advertisingLoading ? undefined : advertisingData?.summary?.overall_roas}
          previousValue={
            advertisingLoading ? undefined : previousAdvertisingData?.summary?.overall_roas
          }
          format="roas"
          tooltip="Return on Ad Spend = Выручка с рекламы / Расходы"
          isLoading={advertisingLoading}
        />
      </div>

      {/* Advertising Widget - Story 60.6-FE: Synced with global period */}
      <AdvertisingDashboardWidget dateRange={advertisingDateRange} hideLocalSelector />

      {/* Expense Chart - only use week override in week mode */}
      <ExpenseChart weekOverride={periodType === 'week' ? selectedWeek : undefined} />

      {/* Trend Graphs */}
      <TrendGraph />

      {/* Conditional CTA (AC3) - only shows when COGS < 100% */}
      <InitialDataSummary
        cogsCoverage={cogsCoverage}
        totalProducts={displayTotalProducts}
        productsWithCogs={displayProductsWithCogs}
      />

      {/* Refetching indicator */}
      {isFetching && !isLoading && (
        <div className="fixed bottom-4 right-4 rounded-lg bg-primary/10 px-3 py-2 text-sm">
          <RefreshCw className="mr-2 inline-block h-4 w-4 animate-spin" />
          Обновление данных...
        </div>
      )}
    </div>
  )
}

/** Calculate margin percentage from gross profit and revenue */
function calculateMarginPercentage(
  grossProfit: number | null | undefined,
  revenue: number | null | undefined
): number | null {
  if (grossProfit == null || revenue == null || revenue === 0) return null
  return (grossProfit / revenue) * 100
}
