'use client'

import { useMemo } from 'react'
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
import { usePreliminaryTax } from '@/hooks/usePreliminaryTax'
import { usePreviousPeriodData } from '@/hooks/usePreviousPeriodData'
import { useCabinetTaxSettings } from '@/hooks/useCabinetTaxSettings'
import { weekToDateRange, monthToDateRange } from '@/lib/date-utils'
import { invalidateDashboardDataQueries } from '@/hooks/dashboard-query-invalidation'
import { useAuthStore } from '@/stores/authStore'
import {
  isDashboardTaxConfigured,
  shouldShowDashboardMetricsSkeleton,
} from './useDashboardData.helpers'
export {
  isDashboardTaxConfigured,
  shouldShowDashboardMetricsSkeleton,
} from './useDashboardData.helpers'
export type {
  DashboardMetricsLoadingState,
  DashboardTaxConfigurationState,
} from './useDashboardData.helpers'

/**
 * Aggregated data hook for DashboardContent.
 */
export function useDashboardData() {
  const queryClient = useQueryClient()
  const cabinetId = useAuthStore(state => state.cabinetId)
  const { periodType, selectedWeek, selectedMonth, previousWeek, previousMonth, lastRefresh } =
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
    // `available-weeks` is an availability/status hint, not an authoritative gate for the
    // selected period request. If it is stale or incomplete, disabling this query leaves the
    // dashboard stuck with `—` values even when finance-summary exists for the chosen week.
    enabled: !!selectedPeriod,
  })
  const advertisingQuery = useAdvertisingAnalyticsComparison(
    { from: dateRange.from, to: dateRange.to, limit: 1 },
    { from: prevDateRange.from, to: prevDateRange.to, limit: 1 },
    { refetchInterval: undefined }
  )

  const { data: processingStatus } = useProcessingStatus()
  const {
    data: productCount,
    isLoading: productsLoading,
    isError: productsError,
  } = useProductsCount()
  const { data: productsWithCogsData, isLoading: cogsLoading } = useProductsWithCogs({ limit: 1 })
  const inventoryWithCogs = productsWithCogsData?.pagination?.total ?? 0
  const totalProducts = productsError ? undefined : (productCount ?? 0)
  const cogsCoverage =
    totalProducts && totalProducts > 0 ? (inventoryWithCogs / totalProducts) * 100 : 0

  const summary = financialComparison.current?.summary_total ?? null
  const hasActualFinanceSummary = Boolean(financialComparison.current?.summary_total)
  const isFinanceReportPending =
    !isFinanceAvailable &&
    !hasActualFinanceSummary &&
    !financialComparison.isLoading &&
    !financialComparison.error
  const effectiveIsFinanceAvailable = !isFinanceReportPending
  const fSummary = fulfillmentQuery.current?.summary
  const salesCount = summary?.product_transactions ?? undefined
  const returnsCount = fSummary
    ? (fSummary.fbo.returnsCount ?? 0) + (fSummary.fbs.returnsCount ?? 0)
    : undefined

  // Request #159: Preliminary tax for incomplete weeks
  const prelimTax = usePreliminaryTax({
    from: dateRange.from,
    to: dateRange.to,
    enabled: isFinanceReportPending,
  })
  const effectiveTaxMetrics = summary?.tax ?? prelimTax
  const taxSettingsQuery = useCabinetTaxSettings(cabinetId ?? '')
  const taxConfigured = isDashboardTaxConfigured({
    effectiveTaxMetrics,
    cabinetTaxSettings: taxSettingsQuery.data,
    taxSettingsLoading: taxSettingsQuery.isLoading || taxSettingsQuery.fetchStatus === 'fetching',
    taxSettingsError: taxSettingsQuery.isError,
    cabinetId,
  })

  const previousPeriodData = usePreviousPeriodData({
    prevSummary: financialComparison.previous?.summary_total ?? null,
    fulfillmentPrevious: fulfillmentQuery.previous,
    advertisingPrevious: advertisingQuery.previous,
  })

  const hasFinancialData = financialComparison.current !== undefined
  const hasFulfillmentData = fulfillmentQuery.current !== undefined
  const hasAdvertisingData = advertisingQuery.current !== undefined
  const isFinanceTransitionLoading =
    financialComparison.isLoading && !hasFinancialData && !financialComparison.isError
  const isLoading =
    isFinanceTransitionLoading ||
    shouldShowDashboardMetricsSkeleton({
      isFinanceAvailable: true,
      financialLoading: financialComparison.isLoading,
      fulfillmentLoading: fulfillmentQuery.isLoading,
      advertisingLoading: advertisingQuery.isLoading,
      hasFinancialData,
      hasFulfillmentData,
      hasAdvertisingData,
    })
  const error = financialComparison.error || null
  const handleRetry = (): void => {
    invalidateDashboardDataQueries(queryClient)
  }

  const reportStatus = processingStatus?.reportLoading?.status
  const isProcessing =
    processingStatus?.status !== 'no_data' &&
    !hasFinancialData &&
    (reportStatus === 'in_progress' || reportStatus === 'pending')
  const isFailed = reportStatus === 'failed'
  const failedBatchCount = processingStatus?.failedBatchCount ?? 0

  return {
    periodType,
    selectedWeek,
    selectedMonth,
    selectedPeriod,
    lastRefresh,
    isFinanceAvailable: effectiveIsFinanceAvailable,
    latestAvailableWeek,
    summary,
    fSummary,
    salesCount,
    returnsCount,
    effectiveTaxMetrics,
    taxConfigured,
    logisticsBreakdown: summary?.logistics_breakdown ?? null,
    fboShare: fSummary?.total?.fboShare ?? 0,
    fbsShare: fSummary?.total?.fbsShare ?? 0,
    previousPeriodData,
    inventoryWithCogs,
    totalProducts,
    cogsCoverage,
    advertisingQuery,
    isLoading,
    productsLoading,
    cogsLoading,
    error,
    handleRetry,
    isProcessing,
    isFailed,
    failedBatchCount,
    hasFinancialData,
    processingStatus,
    dateRange,
  }
}
