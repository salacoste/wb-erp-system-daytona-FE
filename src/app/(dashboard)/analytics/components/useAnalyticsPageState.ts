'use client'

/**
 * Analytics Page State Hook
 * Extracted from analytics/page.tsx - pure structural refactoring
 * Manages all state, data fetching, and derived values for the analytics hub
 */

import { useState, useEffect } from 'react'
import {
  useFinancialSummary,
  useFinancialSummaryComparison,
  useMultiWeekFinancialSummary,
  useAvailableWeeks,
} from '@/hooks/useFinancialSummary'
import { getLastCompletedWeek } from '@/lib/margin-helpers'

export type ViewMode = 'single' | 'multi' | 'comparison'

export function useAnalyticsPageState() {
  const { data: availableWeeks, isLoading: isLoadingWeeks } = useAvailableWeeks()

  // Get latest week or last completed week as default (Epic 19: only completed weeks have data)
  const defaultWeek = availableWeeks?.[0]?.week || getLastCompletedWeek()

  // State for week selection (default: multi-week mode)
  const [viewMode, setViewMode] = useState<ViewMode>('multi')
  const [selectedWeek, setSelectedWeek] = useState(defaultWeek)
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([defaultWeek])
  const [comparisonWeek, setComparisonWeek] = useState(
    availableWeeks?.[1]?.week || getLastCompletedWeek()
  )

  // Update selected week when availableWeeks loads for the first time
  // This ensures we use a week that actually has data (Epic 19: completed weeks only)
  useEffect(() => {
    if (availableWeeks && availableWeeks.length > 0) {
      const firstAvailableWeek = availableWeeks[0].week
      // Only update if selectedWeek is not in the available weeks list
      const isSelectedWeekAvailable = availableWeeks.some(w => w.week === selectedWeek)
      if (!isSelectedWeekAvailable) {
        setSelectedWeek(firstAvailableWeek)
        setSelectedWeeks([firstAvailableWeek])
      }
      // Also update comparison week if needed
      const isComparisonWeekAvailable = availableWeeks.some(w => w.week === comparisonWeek)
      if (!isComparisonWeekAvailable && availableWeeks.length > 1) {
        setComparisonWeek(availableWeeks[1].week)
      }
    }
  }, [availableWeeks, selectedWeek, comparisonWeek])

  // Check if selectedWeek is in availableWeeks (to avoid 404 errors for non-existent weeks)
  const isWeekAvailable = availableWeeks?.some(w => w.week === selectedWeek) ?? false

  // Check if comparison week is available
  const isComparisonWeekAvailable = availableWeeks?.some(w => w.week === comparisonWeek) ?? false

  // Filter selectedWeeks to only include available weeks
  const availableSelectedWeeks = selectedWeeks.filter(
    w => availableWeeks?.some(aw => aw.week === w) ?? false
  )

  // Fetch data based on mode - only when weeks are confirmed available
  const singleWeekQuery = useFinancialSummary(isWeekAvailable ? selectedWeek : '')
  const multiWeekQuery = useMultiWeekFinancialSummary(
    availableSelectedWeeks.length > 0 ? availableSelectedWeeks : []
  )
  const comparisonQuery = useFinancialSummaryComparison(
    isWeekAvailable ? selectedWeek : '',
    isComparisonWeekAvailable ? comparisonWeek : ''
  )

  // Determine loading/error states based on mode
  // Include isLoadingWeeks to prevent 404 errors when availableWeeks hasn't loaded yet
  const isLoading =
    isLoadingWeeks ||
    (viewMode === 'multi'
      ? multiWeekQuery.isLoading
      : viewMode === 'comparison'
        ? comparisonQuery.isLoading
        : singleWeekQuery.isLoading)

  const isError =
    viewMode === 'multi'
      ? multiWeekQuery.isError
      : viewMode === 'comparison'
        ? comparisonQuery.isError
        : singleWeekQuery.isError

  const error =
    viewMode === 'multi'
      ? multiWeekQuery.error
      : viewMode === 'comparison'
        ? comparisonQuery.error
        : singleWeekQuery.error

  // Get summary data based on mode
  const primarySummary =
    viewMode === 'multi'
      ? multiWeekQuery.data || undefined
      : viewMode === 'comparison'
        ? comparisonQuery.week1.data?.summary_total ||
          comparisonQuery.week1.data?.summary_rus ||
          undefined
        : singleWeekQuery.data?.summary_total || singleWeekQuery.data?.summary_rus || undefined

  const secondarySummary =
    viewMode === 'comparison'
      ? comparisonQuery.week2.data?.summary_total ||
        comparisonQuery.week2.data?.summary_rus ||
        undefined
      : undefined

  const handleRetry = () => {
    if (viewMode === 'multi') {
      multiWeekQuery.refetch()
    } else if (viewMode === 'comparison') {
      comparisonQuery.week1.refetch()
      comparisonQuery.week2.refetch()
    } else {
      singleWeekQuery.refetch()
    }
  }

  const cycleViewMode = () => {
    if (viewMode === 'single') {
      setViewMode('multi')
      // Initialize multi-select with current single week
      setSelectedWeeks([selectedWeek])
    } else if (viewMode === 'multi') {
      setViewMode('comparison')
    } else {
      setViewMode('single')
    }
  }

  return {
    viewMode,
    selectedWeek,
    selectedWeeks,
    comparisonWeek,
    setSelectedWeek,
    setSelectedWeeks,
    setComparisonWeek,
    isLoading,
    isError,
    error,
    primarySummary,
    secondarySummary,
    handleRetry,
    cycleViewMode,
  }
}
