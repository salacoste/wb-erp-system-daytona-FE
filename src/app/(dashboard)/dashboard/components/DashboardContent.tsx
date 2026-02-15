/**
 * Dashboard Content Component
 * P&L Narrative Dashboard with 10-card metrics grid
 *
 * 5 sections: Выручка → Расходы WB → К перечислению → Себестоимость → Прибыль
 *
 * @see docs/briefs/dashboard-restructuring-v2.md
 */

'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useDashboardPeriod } from '@/hooks/useDashboardPeriod'
import {
  useFinancialSummaryWithPeriodComparison,
  useAvailableWeeks,
} from '@/hooks/useFinancialSummary'
import { useAdvertisingAnalyticsComparison } from '@/hooks/useAdvertisingAnalytics'
import { useFulfillmentSummaryWithComparison } from '@/hooks/useFulfillment'
import { useProcessingStatus } from '@/hooks/useProcessingStatus'
import { useProductsCount, useProductsWithCogs } from '@/hooks/useProducts'
import { useDataImportNotification } from '@/hooks/useDataImportNotification'
import { usePreviousPeriodData } from '@/hooks/usePreviousPeriodData'
import { weekToDateRange, monthToDateRange } from '@/lib/date-utils'
import { ROUTES } from '@/lib/routes'
import { dashboardQueryKeys } from '@/hooks/useDashboard'
import {
  DashboardMetricsGrid,
  DailyBreakdownSection,
  IncompleteWeekBanner,
} from '@/components/custom/dashboard'
import { DashboardPeriodSelector } from '@/components/custom/DashboardPeriodSelector'
import { ReportPendingBanner } from './ReportPendingBanner'
import { PeriodContextLabel } from '@/components/custom/PeriodContextLabel'
import { ExpenseChart } from '@/components/custom/ExpenseChart'
import { TrendGraph } from '@/components/custom/TrendGraph'
import { AdvertisingDashboardWidget } from '@/components/custom/AdvertisingDashboardWidget'
import { InitialDataSummary } from '@/components/custom/InitialDataSummary'
import { ProcessingAlert, FailedAlert, ErrorAlert } from './DashboardAlerts'

/**
 * Dashboard content with P&L narrative 10-card metrics grid
 */
export function DashboardContent(): React.ReactElement {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { periodType, selectedWeek, selectedMonth, lastRefresh, previousWeek, previousMonth } =
    useDashboardPeriod()
  const selectedPeriod = periodType === 'week' ? selectedWeek : selectedMonth

  // Date ranges for fulfillment and advertising
  const dateRange = useMemo(
    () => (periodType === 'week' ? weekToDateRange(selectedWeek) : monthToDateRange(selectedMonth)),
    [periodType, selectedWeek, selectedMonth]
  )
  const prevDateRange = useMemo(
    () => (periodType === 'week' ? weekToDateRange(previousWeek) : monthToDateRange(previousMonth)),
    [periodType, previousWeek, previousMonth]
  )

  // Available weeks — used to detect "report not ready" vs real errors
  const { data: availableWeeks } = useAvailableWeeks()
  const isWeekNotAvailable = useMemo(() => {
    if (periodType !== 'week' || !availableWeeks) return false
    return !availableWeeks.some(w => w.week === selectedWeek)
  }, [periodType, availableWeeks, selectedWeek])

  // Latest available week for fallback suggestion
  const latestAvailableWeek = availableWeeks?.[0]?.week ?? null

  // Skip week-dependent API calls when the selected week has no WB report yet
  const weekDataEnabled = !isWeekNotAvailable

  // Data queries
  const fulfillmentQuery = useFulfillmentSummaryWithComparison({
    from: weekDataEnabled ? dateRange.from : '',
    to: weekDataEnabled ? dateRange.to : '',
    previousFrom: weekDataEnabled ? prevDateRange.from : '',
    previousTo: weekDataEnabled ? prevDateRange.to : '',
  })

  const financialComparison = useFinancialSummaryWithPeriodComparison({
    periodType,
    period: selectedPeriod,
    enabled: weekDataEnabled,
  })

  const advertisingQuery = useAdvertisingAnalyticsComparison(
    { from: dateRange.from, to: dateRange.to, limit: 1 },
    { from: prevDateRange.from, to: prevDateRange.to, limit: 1 },
    { refetchInterval: undefined, enabled: weekDataEnabled }
  )

  // Products count for COGS coverage
  const { data: processingStatus } = useProcessingStatus()
  const { data: productCount, isLoading: productsLoading } = useProductsCount()
  const { data: productsWithCogsData, isLoading: cogsLoading } = useProductsWithCogs({ limit: 1 })
  const inventoryWithCogs = productsWithCogsData?.pagination?.total ?? 0
  const cogsCoverage =
    productCount && productCount > 0 ? (inventoryWithCogs / productCount) * 100 : 0

  // Extract finance-summary fields (prefer summary_rus, fallback to summary_total)
  const s = financialComparison.current?.summary_rus
  const st = financialComparison.current?.summary_total

  // Previous period data for comparison badges
  const previousPeriodData = usePreviousPeriodData({
    prevSummaryRus: financialComparison.previous?.summary_rus,
    prevSummaryTotal: financialComparison.previous?.summary_total,
    fulfillmentPrevious: fulfillmentQuery.previous,
    advertisingPrevious: advertisingQuery.previous,
  })

  // Data import notification
  const hasFinancialData = fulfillmentQuery.current !== undefined
  useDataImportNotification(!!hasFinancialData, fulfillmentQuery.isLoading)

  // Loading & error states
  const isLoading = financialComparison.isLoading || advertisingQuery.isLoading
  const error = financialComparison.error || null
  const handleRetry = (): void => {
    queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all })
  }

  const isProcessing =
    !hasFinancialData &&
    (processingStatus?.reportLoading?.status === 'in_progress' ||
      processingStatus?.reportLoading?.status === 'pending')
  const isFailed = processingStatus?.reportLoading?.status === 'failed'

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
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

      <IncompleteWeekBanner period={selectedPeriod} periodType={periodType} />
      {isWeekNotAvailable && !isProcessing && (
        <ReportPendingBanner week={selectedWeek} latestAvailableWeek={latestAvailableWeek} />
      )}
      {isProcessing && <ProcessingAlert processingStatus={processingStatus} />}
      {isFailed && <FailedAlert />}
      {error && !isProcessing && !isWeekNotAvailable && <ErrorAlert onRetry={handleRetry} />}

      {/* P&L Metrics Grid — hidden when selected week has no WB report */}
      {!isWeekNotAvailable && (
        <>
          <DashboardMetricsGrid
            totalOrders={fulfillmentQuery.current?.summary.total.ordersCount}
            saleGross={s?.sale_gross ?? st?.sale_gross_total}
            wbSalesGross={s?.wb_sales_gross ?? st?.wb_sales_gross_total}
            wbReturnsGross={s?.wb_returns_gross ?? st?.wb_returns_gross_total}
            commissionSales={s?.commission_sales ?? st?.commission_sales_total}
            acquiringFee={s?.acquiring_fee ?? st?.acquiring_fee_total}
            loyaltyFee={s?.loyalty_fee ?? st?.loyalty_fee_total}
            penaltiesTotal={s?.penalties_total ?? st?.penalties_total}
            wbCommissionAdj={s?.wb_commission_adj ?? st?.wb_commission_adj_total}
            wbServicesCost={s?.wb_services_cost ?? st?.wb_services_cost_total}
            logisticsCost={s?.logistics_cost ?? st?.logistics_cost_total}
            payoutTotal={s?.payout_total ?? st?.payout_total}
            storageCost={s?.storage_cost ?? st?.storage_cost_total}
            paidAcceptanceCost={s?.paid_acceptance_cost ?? st?.paid_acceptance_cost_total}
            cogsTotal={s?.cogs_total ?? st?.cogs_total ?? undefined}
            cogsCoverage={cogsCoverage}
            productsWithCogs={inventoryWithCogs}
            totalProducts={productCount ?? 0}
            advertisingSpend={advertisingQuery.current?.summary?.total_spend}
            advertisingRoas={advertisingQuery.current?.summary?.overall_roas}
            grossProfit={s?.gross_profit ?? st?.gross_profit ?? undefined}
            marginPct={s?.margin_pct ?? st?.margin_pct ?? undefined}
            previousPeriodData={previousPeriodData}
            isLoading={isLoading || productsLoading || cogsLoading}
            error={error}
            onRetry={handleRetry}
            onAssignCogs={() => router.push(ROUTES.COGS.ROOT)}
          />

          <DailyBreakdownSection className="mt-4" />
          <AdvertisingDashboardWidget dateRange={dateRange} hideLocalSelector />
          <ExpenseChart weekOverride={periodType === 'week' ? selectedWeek : undefined} />

          {fulfillmentQuery.isLoading && (
            <div className="fixed bottom-4 right-4 rounded-lg bg-primary/10 px-3 py-2 text-sm">
              <RefreshCw className="mr-2 inline-block h-4 w-4 animate-spin" />
              Обновление данных...
            </div>
          )}
        </>
      )}

      <TrendGraph />

      <InitialDataSummary
        cogsCoverage={cogsCoverage}
        totalProducts={productCount ?? 0}
        productsWithCogs={inventoryWithCogs}
      />
    </div>
  )
}
