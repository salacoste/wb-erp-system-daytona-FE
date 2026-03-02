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
import { useDataAvailability } from '@/hooks/useDataAvailability'
import { useAdvertisingAnalyticsComparison } from '@/hooks/useAdvertisingAnalytics'
import { useFulfillmentSummaryWithComparison } from '@/hooks/useFulfillment'
import { useProcessingStatus } from '@/hooks/useProcessingStatus'
import { useProductsCount, useProductsWithCogs } from '@/hooks/useProducts'
import { useDataImportNotification } from '@/hooks/useDataImportNotification'
import { usePreviousPeriodData } from '@/hooks/usePreviousPeriodData'
import { usePreliminaryTax } from '@/hooks/usePreliminaryTax'
import { weekToDateRange, monthToDateRange } from '@/lib/date-utils'
import { ROUTES } from '@/lib/routes'
import { dashboardQueryKeys } from '@/hooks/useDashboard'
import {
  DashboardMetricsGrid,
  DailyBreakdownSection,
  IncompleteWeekBanner,
  TaxWarningBanner,
} from '@/components/custom/dashboard'
import { DashboardPeriodSelector } from '@/components/custom/DashboardPeriodSelector'
import { ReportPendingBanner } from './ReportPendingBanner'
import { PeriodContextLabel } from '@/components/custom/PeriodContextLabel'
import { ExpenseChart } from '@/components/custom/ExpenseChart'
import { TrendGraph } from '@/components/custom/TrendGraph'
import { AdvertisingDashboardWidget } from '@/components/custom/AdvertisingDashboardWidget'
import { InitialDataSummary } from '@/components/custom/InitialDataSummary'
import { ProcessingAlert, FailedAlert, ErrorAlert } from './DashboardAlerts'

export function DashboardContent(): React.ReactElement {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { periodType, selectedWeek, selectedMonth, lastRefresh, previousWeek, previousMonth } =
    useDashboardPeriod()
  const selectedPeriod = periodType === 'week' ? selectedWeek : selectedMonth

  const dateRange = useMemo(
    () => (periodType === 'week' ? weekToDateRange(selectedWeek) : monthToDateRange(selectedMonth)),
    [periodType, selectedWeek, selectedMonth]
  )
  const prevDateRange = useMemo(
    () => (periodType === 'week' ? weekToDateRange(previousWeek) : monthToDateRange(previousMonth)),
    [periodType, previousWeek, previousMonth]
  )

  const { data: availableWeeks } = useAvailableWeeks()
  const { isFinanceAvailable, latestAvailableWeek } = useDataAvailability(
    periodType,
    selectedWeek,
    selectedMonth,
    availableWeeks
  )

  const fulfillmentQuery = useFulfillmentSummaryWithComparison({
    from: dateRange.from,
    to: dateRange.to,
    previousFrom: prevDateRange.from,
    previousTo: prevDateRange.to,
  })
  const financialComparison = useFinancialSummaryWithPeriodComparison({
    periodType,
    period: selectedPeriod,
    enabled: isFinanceAvailable,
  })
  const advertisingQuery = useAdvertisingAnalyticsComparison(
    { from: dateRange.from, to: dateRange.to, limit: 1 },
    { from: prevDateRange.from, to: prevDateRange.to, limit: 1 },
    { refetchInterval: undefined }
  )

  const { data: processingStatus } = useProcessingStatus()
  const { data: productCount, isLoading: productsLoading } = useProductsCount()
  const { data: productsWithCogsData, isLoading: cogsLoading } = useProductsWithCogs({ limit: 1 })
  const inventoryWithCogs = productsWithCogsData?.pagination?.total ?? 0
  const cogsCoverage =
    productCount && productCount > 0 ? (inventoryWithCogs / productCount) * 100 : 0
  const summary = isFinanceAvailable ? (financialComparison.current?.summary_total ?? null) : null
  const fSummary = fulfillmentQuery.current?.summary
  const salesCount = summary?.product_transactions ?? undefined
  const returnsCount = fSummary
    ? (fSummary.fbo.returnsCount ?? 0) + (fSummary.fbs.returnsCount ?? 0)
    : undefined
  // Request #159: Preliminary tax for incomplete weeks
  const prelimTax = usePreliminaryTax({
    from: dateRange.from,
    to: dateRange.to,
    enabled: !isFinanceAvailable,
  })
  const effectiveTaxMetrics = summary?.tax ?? prelimTax
  const previousPeriodData = usePreviousPeriodData({
    prevSummary: financialComparison.previous?.summary_total ?? null,
    fulfillmentPrevious: fulfillmentQuery.previous,
    advertisingPrevious: advertisingQuery.previous,
  })

  const hasFinancialData = fulfillmentQuery.current !== undefined
  useDataImportNotification(!!hasFinancialData, fulfillmentQuery.isLoading)
  const isLoading =
    (isFinanceAvailable && financialComparison.isLoading) || advertisingQuery.isLoading
  const error = (isFinanceAvailable && financialComparison.error) || null
  const handleRetry = (): void => {
    void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all })
  }
  const reportStatus = processingStatus?.reportLoading?.status
  const isProcessing =
    !hasFinancialData && (reportStatus === 'in_progress' || reportStatus === 'pending')
  const isFailed = reportStatus === 'failed'

  return (
    <div className="space-y-4 pb-8">
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
      {!isFinanceAvailable && !isProcessing && (
        <ReportPendingBanner week={selectedWeek} latestAvailableWeek={latestAvailableWeek} />
      )}
      {isProcessing && <ProcessingAlert processingStatus={processingStatus} />}
      {isFailed && <FailedAlert />}
      {error && !isProcessing && isFinanceAvailable && <ErrorAlert onRetry={handleRetry} />}

      <TaxWarningBanner taxConfigured={!!effectiveTaxMetrics} />

      <DashboardMetricsGrid
        totalOrders={fSummary?.total.ordersCount}
        ordersRevenue={fSummary?.total.ordersRevenue}
        ordersRevenueDiscounted={fSummary?.total.ordersRevenueDiscounted}
        salesCount={salesCount}
        returnsCount={returnsCount}
        saleGross={summary?.sale_gross_total}
        wbSalesGross={summary?.wb_sales_gross_total}
        wbReturnsGross={summary?.wb_returns_gross_total}
        commissionSales={summary?.commission_sales_total}
        acquiringFee={summary?.acquiring_fee_total}
        loyaltyFee={summary?.loyalty_fee_total}
        penaltiesTotal={summary?.penalties_total}
        wbCommissionAdj={summary?.wb_commission_adj_total}
        wbServicesCost={undefined}
        logisticsCost={summary?.logistics_cost_total}
        payoutTotal={summary?.payout_total}
        storageCost={summary?.storage_cost_total}
        paidAcceptanceCost={summary?.paid_acceptance_cost_total}
        cogsTotal={summary?.cogs_total ?? undefined}
        cogsCoverage={cogsCoverage}
        productsWithCogs={inventoryWithCogs}
        totalProducts={productCount ?? 0}
        advertisingSpend={advertisingQuery.current?.summary?.total_spend}
        advertisingRoas={advertisingQuery.current?.summary?.overall_roas}
        wbPromotionCost={summary?.wb_promotion_cost_total ?? undefined}
        wbJamCost={summary?.wb_jam_cost_total ?? undefined}
        wbOtherServicesCost={summary?.wb_other_services_cost_total ?? undefined}
        grossProfit={summary?.gross_profit ?? undefined}
        marginPct={summary?.margin_pct ?? undefined}
        grossProfitAnalytical={summary?.gross_profit_analytical ?? undefined}
        operatingProfitAnalytical={summary?.operating_profit_analytical ?? undefined}
        operatingMarginPct={summary?.operating_margin_pct ?? undefined}
        grossMarginPct={summary?.gross_margin_pct ?? undefined}
        taxMetrics={effectiveTaxMetrics ?? null}
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
      <TrendGraph />
      <InitialDataSummary
        cogsCoverage={cogsCoverage}
        totalProducts={productCount ?? 0}
        productsWithCogs={inventoryWithCogs}
      />
    </div>
  )
}
