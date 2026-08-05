'use client'

/**
 * SKU Page State Hook
 * Extracts URL param parsing, state initialization, and handlers
 * from the SKU analytics page (Epic 31).
 */

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAvailableWeeks } from '@/hooks/useFinancialSummary'
import { useCabinetLevelExpenses, useMarginAnalyticsBySku } from '@/hooks/useMarginAnalytics'
import { useSkuFinancials } from '@/hooks/useSkuFinancials'
import type { MarginAnalyticsSku } from '@/types/api'
import type { SkuFinancialParity } from '@/types/sku-financials'
import { readHistoricalSppEnabled, setHistoricalSppSearchParam } from './historical-spp-state'

export function useSkuPageState() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Fetch available weeks from API (latest with actual data)
  const {
    data: availableWeeks,
    isLoading: isLoadingWeeks,
    isError: isErrorWeeks,
    error: errorWeeks,
  } = useAvailableWeeks()

  // Week state - Epic 31 uses single week (weekEnd)
  const [weekStart, setWeekStart] = useState<string>('')
  const [weekEnd, setWeekEnd] = useState<string>('')
  const [isInitialized, setIsInitialized] = useState(false)

  // Story 4.9: Read nm_id filter from URL query params
  const nmIdFilter = searchParams.get('nm_id')
  const historicalSppEnabled = readHistoricalSppEnabled(searchParams)

  // Story 6.5-FE: Export dialog state
  const [showExportDialog, setShowExportDialog] = useState(false)

  // Initialize week selection from URL params or first available week
  useEffect(() => {
    if (isInitialized) return

    const weekStartParam = searchParams.get('weekStart')
    const weekEndParam = searchParams.get('weekEnd')
    const weekParam = searchParams.get('week')

    if (weekStartParam && weekEndParam) {
      setWeekStart(weekStartParam)
      setWeekEnd(weekEndParam)
      setIsInitialized(true)
    } else if (weekParam) {
      setWeekStart(weekParam)
      setWeekEnd(weekParam)
      setIsInitialized(true)
    } else if (availableWeeks && availableWeeks.length > 0 && !isLoadingWeeks) {
      const latestWeek = availableWeeks[0].week
      setWeekStart(latestWeek)
      setWeekEnd(latestWeek)
      setIsInitialized(true)
    }
  }, [searchParams, availableWeeks, isLoadingWeeks, isInitialized])

  // Fetch cabinet-level expenses for Cashflow section
  const { data: cabinetExpenses, isLoading: isLoadingCabinetExpenses } = useCabinetLevelExpenses({
    weekStart,
    weekEnd,
  })

  // Epic 31: Fetch SKU financials from the detailed endpoint with correct storage and visibility.
  const {
    data: baseSkuFinancialsData,
    isLoading: isLoadingBaseSkuFinancials,
    isError: isErrorSkuFinancials,
    error: errorSkuFinancials,
    refetch,
  } = useSkuFinancials(
    {
      week: weekEnd, // Use single week for Epic 31
      nm_ids: nmIdFilter ?? undefined,
      sortBy: 'operating_profit',
      order: 'desc',
      limit: 500,
    },
    isInitialized && !!weekEnd
  )

  const parityPeriodParams = weekStart === weekEnd ? { week: weekEnd } : { weekStart, weekEnd }

  // Contract #219: FR-2..FR-5 fields live on /weekly/by-sku behind include flags.
  // Single-week mode returns live values; range-mode is still requested for shape parity
  // but backend v1 may return null for the new fields (documented boundary).
  const {
    data: skuParityData,
    isLoading: isLoadingSkuParity,
    refetch: refetchSkuParity,
  } = useMarginAnalyticsBySku(
    {
      ...parityPeriodParams,
      includeCogs: historicalSppEnabled,
      includeAds: true,
      includeStock: true,
      limit: 500,
      nmId: nmIdFilter ?? undefined,
    },
    isInitialized && !!weekEnd
  )

  const skuFinancialsData = useMemo(() => {
    if (!baseSkuFinancialsData) return baseSkuFinancialsData

    const parityByNmId = new Map(
      (skuParityData?.data ?? []).map(item => [
        String(item.nm_id),
        toSkuParity(item, historicalSppEnabled),
      ])
    )

    return {
      ...baseSkuFinancialsData,
      data: baseSkuFinancialsData.data.map(item => ({
        ...item,
        parity: parityByNmId.get(String(item.nmId)) ?? item.parity,
      })),
    }
  }, [baseSkuFinancialsData, historicalSppEnabled, skuParityData])

  // Handle week change — preserve existing params (e.g. group_by) so FR-7 variant
  // mode survives a week change; only weekStart/weekEnd/nm_id are re-scoped.
  const handleRangeChange = (newStart: string, newEnd: string) => {
    setWeekStart(newStart)
    setWeekEnd(newEnd)
    const params = new URLSearchParams(searchParams)
    params.set('weekStart', newStart)
    params.set('weekEnd', newEnd)
    // Range selected → by-variant mode is single-week-only; drop group_by so the URL
    // matches the (sku) view instead of lying about the active mode.
    if (newStart !== newEnd) params.delete('group_by')
    router.push(`/analytics/sku?${params.toString()}`)
  }

  // Story 4.9: Clear nm_id filter — preserve group_by (FR-7) and other params.
  const handleClearFilter = () => {
    const params = new URLSearchParams(searchParams)
    params.delete('nm_id')
    params.set('weekStart', weekStart)
    params.set('weekEnd', weekEnd)
    router.push(`/analytics/sku?${params.toString()}`)
  }

  const handleHistoricalSppChange = (enabled: boolean) => {
    const params = setHistoricalSppSearchParam(searchParams, enabled)
    router.replace(`/analytics/sku?${params.toString()}`, { scroll: false })
  }

  // Check if using date range (multiple weeks)
  const isRangeMode = weekStart !== weekEnd

  // Get filtered product name for display
  const filteredProductName = nmIdFilter && (skuFinancialsData?.data?.[0]?.productName ?? null)

  return {
    // Week & filter state
    weekStart,
    weekEnd,
    isInitialized,
    nmIdFilter,
    historicalSppEnabled,
    isRangeMode,
    filteredProductName,
    // Export dialog
    showExportDialog,
    setShowExportDialog,
    // Loading / error states
    isLoadingWeeks,
    isErrorWeeks,
    errorWeeks,
    isLoadingSkuFinancials: isLoadingBaseSkuFinancials || isLoadingSkuParity,
    isErrorSkuFinancials,
    errorSkuFinancials,
    // Data
    skuFinancialsData,
    cabinetExpenses,
    isLoadingCabinetExpenses,
    // Handlers
    handleRangeChange,
    handleClearFilter,
    handleHistoricalSppChange,
    refetch: () => {
      void refetch()
      void refetchSkuParity()
    },
    router,
  }
}

/** Return type helper for consumers */
export type SkuPageState = ReturnType<typeof useSkuPageState>

function toSkuParity(item: MarginAnalyticsSku, historicalSppEnabled: boolean): SkuFinancialParity {
  return {
    advertisingCost: item.advertising_cost ?? null,
    drrPct: item.drr_pct ?? null,
    adCostPerUnit: item.ad_cost_per_unit ?? null,
    taxAllocated: item.tax_allocated ?? null,
    netProfitAfterTax: item.net_profit_after_tax ?? null,
    netMarginAfterTaxPct: item.net_margin_after_tax_pct ?? null,
    // Do not carry enabled-cache values into the disabled view, even if a caller
    // accidentally supplies a stale object while the false-key query is loading.
    sppRub: historicalSppEnabled ? (item.spp_rub ?? null) : null,
    sppPct: historicalSppEnabled ? (item.spp_pct ?? null) : null,
    cancellationsQty: item.cancellations_qty ?? null,
    stockFbs: item.stock_fbs ?? null,
    stockFbo: item.stock_fbo ?? null,
    stockTotal: item.stock_total ?? null,
    stockValueRub: item.stock_value_rub ?? null,
    stockValueSharePct: item.stock_value_share_pct ?? null,
  }
}
