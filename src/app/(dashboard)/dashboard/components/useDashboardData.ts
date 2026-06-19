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
import { dashboardQueryKeys } from '@/hooks/useDashboard'
import { useAuthStore } from '@/stores/authStore'
import type { Cabinet } from '@/types/cabinet'
import type { TaxMetrics } from '@/types/finance-summary-sub-types'

/**
 * Aggregated data hook for DashboardContent.
 * Extracted for file-size compliance (212 → ~150 lines).
 */
export interface DashboardMetricsLoadingState {
  isFinanceAvailable: boolean
  financialLoading: boolean
  fulfillmentLoading: boolean
  advertisingLoading: boolean
  hasFinancialData: boolean
  hasFulfillmentData: boolean
  hasAdvertisingData: boolean
}

export function shouldShowDashboardMetricsSkeleton({
  isFinanceAvailable,
  financialLoading,
  fulfillmentLoading,
  advertisingLoading,
  hasFinancialData,
  hasFulfillmentData,
  hasAdvertisingData,
}: DashboardMetricsLoadingState): boolean {
  const hasPrimaryMetricsData = hasFinancialData || hasFulfillmentData || hasAdvertisingData
  const isPrimaryMetricsLoading =
    (isFinanceAvailable && financialLoading) || fulfillmentLoading || advertisingLoading

  return isPrimaryMetricsLoading && !hasPrimaryMetricsData
}

export interface DashboardTaxConfigurationState {
  effectiveTaxMetrics: TaxMetrics | null | undefined
  cabinetTaxSettings: Pick<Cabinet, 'taxSystem'> | null | undefined
  taxSettingsLoading: boolean
  taxSettingsError: boolean
  cabinetId: string | null
}

export function isDashboardTaxConfigured({
  effectiveTaxMetrics,
  cabinetTaxSettings,
  taxSettingsLoading,
  taxSettingsError,
  cabinetId,
}: DashboardTaxConfigurationState): boolean {
  if (effectiveTaxMetrics != null) return true
  if (cabinetTaxSettings != null) return cabinetTaxSettings.taxSystem != null

  // Do not show "not configured" while the configuration state is still unknown.
  // The banner is only valid after a successful settings response proves taxSystem is null.
  if (!cabinetId || taxSettingsLoading || taxSettingsError) return true

  return false
}

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

  const isLoading = shouldShowDashboardMetricsSkeleton({
    isFinanceAvailable,
    financialLoading: financialComparison.isLoading,
    fulfillmentLoading: fulfillmentQuery.isLoading,
    advertisingLoading: advertisingQuery.isLoading,
    hasFinancialData: Boolean(financialComparison.current),
    hasFulfillmentData: Boolean(fulfillmentQuery.current),
    hasAdvertisingData: Boolean(advertisingQuery.current),
  })
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
