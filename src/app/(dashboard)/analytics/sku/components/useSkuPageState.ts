'use client'

/**
 * SKU Page State Hook
 * Extracts URL param parsing, state initialization, and handlers
 * from the SKU analytics page (Epic 31).
 */

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAvailableWeeks } from '@/hooks/useFinancialSummary'
import { useCabinetLevelExpenses } from '@/hooks/useMarginAnalytics'
import { useSkuFinancials } from '@/hooks/useSkuFinancials'

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

  // Epic 31: Fetch SKU financials from new endpoint with correct storage and visibility
  const {
    data: skuFinancialsData,
    isLoading: isLoadingSkuFinancials,
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

  // Handle week change
  const handleRangeChange = (newStart: string, newEnd: string) => {
    setWeekStart(newStart)
    setWeekEnd(newEnd)
    const params = new URLSearchParams()
    params.set('weekStart', newStart)
    params.set('weekEnd', newEnd)
    if (nmIdFilter) {
      params.set('nm_id', nmIdFilter)
    }
    router.push(`/analytics/sku?${params.toString()}`)
  }

  // Story 4.9: Clear nm_id filter
  const handleClearFilter = () => {
    router.push(`/analytics/sku?weekStart=${weekStart}&weekEnd=${weekEnd}`)
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
    isRangeMode,
    filteredProductName,
    // Export dialog
    showExportDialog,
    setShowExportDialog,
    // Loading / error states
    isLoadingWeeks,
    isErrorWeeks,
    errorWeeks,
    isLoadingSkuFinancials,
    isErrorSkuFinancials,
    errorSkuFinancials,
    // Data
    skuFinancialsData,
    cabinetExpenses,
    isLoadingCabinetExpenses,
    // Handlers
    handleRangeChange,
    handleClearFilter,
    refetch,
    router,
  }
}

/** Return type helper for consumers */
export type SkuPageState = ReturnType<typeof useSkuPageState>
