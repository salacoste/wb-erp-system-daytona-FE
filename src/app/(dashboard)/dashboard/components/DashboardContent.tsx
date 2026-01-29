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
import { useDashboardPeriod } from '@/hooks/useDashboardPeriod'
import { useDashboardMetricsWithComparison } from '@/hooks/useDashboardMetricsWithPeriod'
import { useProcessingStatus } from '@/hooks/useProcessingStatus'
import { useProductsCount } from '@/hooks/useProducts'
import { useFinancialSummary } from '@/hooks/useFinancialSummary'
import { useDataImportNotification } from '@/hooks/useDataImportNotification'
import { useAdvertisingAnalytics } from '@/hooks/useAdvertisingAnalytics'
import { weekToDateRange, monthToDateRange } from '@/lib/date-utils'
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
  const queryClient = useQueryClient()
  const { periodType, selectedWeek, selectedMonth, lastRefresh } = useDashboardPeriod()
  const { current, previous, isLoading, isFetching, isError, error, refetch } =
    useDashboardMetricsWithComparison()
  const { data: processingStatus } = useProcessingStatus()
  const { data: productCount, isLoading: productsLoading } = useProductsCount()

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

  // Fetch advertising analytics for ROAS display
  const { data: advertisingData, isLoading: advertisingLoading } = useAdvertisingAnalytics(
    {
      from: advertisingDateRange.from,
      to: advertisingDateRange.to,
      limit: 1, // Only need summary
    },
    {
      refetchInterval: undefined,
    }
  )

  // COGS coverage data from finance summary
  const cogsCoverage = summary?.cogs_coverage_pct ?? 0
  const productsWithCogs = summary?.products_with_cogs ?? 0
  const totalProducts = summary?.products_total ?? productCount ?? 0

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
          format="percentage"
          icon={Percent}
          tooltip="Валовая маржа = (Выручка - COGS) / Выручка"
          isLoading={summaryLoading}
        />

        {/* Card 4: Товаров (AC2) */}
        <ProductCountMetricCard
          count={totalProducts}
          isLoading={productsLoading || summaryLoading}
        />

        {/* Card 5: COGS покрытие (AC5) */}
        <CogsCoverageMetricCard
          productsWithCogs={productsWithCogs}
          totalProducts={totalProducts}
          coverage={cogsCoverage}
          isLoading={summaryLoading}
        />

        {/* Card 6: ROAS (optional - AC7) */}
        <MetricCardEnhanced
          title="ROAS рекламы"
          value={advertisingData?.summary?.overall_roas ?? null}
          format="roas"
          tooltip="Окупаемость рекламных расходов (Revenue / Ad Spend)"
          isLoading={advertisingLoading}
        />
      </div>

      {/* Advertising Widget - Story 60.6-FE: Synced with global period */}
      <AdvertisingDashboardWidget dateRange={advertisingDateRange} hideLocalSelector />

      {/* Expense Chart with week from context */}
      <ExpenseChart weekOverride={selectedWeek} />

      {/* Trend Graphs */}
      <TrendGraph />

      {/* Conditional CTA (AC3) - only shows when COGS < 100% */}
      <InitialDataSummary
        cogsCoverage={cogsCoverage}
        totalProducts={totalProducts}
        productsWithCogs={productsWithCogs}
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
  if (!grossProfit || !revenue || revenue === 0) return null
  return (grossProfit / revenue) * 100
}
