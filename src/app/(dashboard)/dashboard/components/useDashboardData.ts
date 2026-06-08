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
import { weekToDateRange, monthToDateRange } from '@/lib/date-utils'
import { dashboardQueryKeys } from '@/hooks/useDashboard'

/**
 * Aggregated data hook for DashboardContent.
 * Extracted for file-size compliance (212 → ~150 lines).
 */
export function useDashboardData() {
  const queryClient = useQueryClient()
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
    enabled: isFinanceAvailable,
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

  const isLoading =
    (isFinanceAvailable && financialComparison.isLoading) || advertisingQuery.isLoading
  const error = (isFinanceAvailable && financialComparison.error) || null
  const handleRetry = (): void => {
    void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all })
  }

  const reportStatus = processingStatus?.reportLoading?.status
  const hasFinancialData = fulfillmentQuery.current !== undefined
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
    isFinanceAvailable,
    latestAvailableWeek,
    summary,
    fSummary,
    salesCount,
    returnsCount,
    effectiveTaxMetrics,
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
