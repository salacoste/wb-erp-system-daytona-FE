'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getLastCompletedWeek } from '@/lib/margin-helpers'
import {
  ComparisonPreset,
  getEffectiveComparisonPeriod,
} from '@/components/custom/ComparisonPeriodSelector'

interface MarginPageStateOptions {
  drillDownPath: string
  drillDownParam: string
}

/**
 * Shared state management hook for brand/category margin analysis pages.
 * Extracted from brand/page.tsx and category/page.tsx (Story 4.6, 6.1-FE, 6.2-FE, 6.5-FE).
 */
export function useMarginPageState(options: MarginPageStateOptions) {
  const router = useRouter()

  // Story 6.1-FE: Date range state
  const lastCompletedWeek = useMemo(() => getLastCompletedWeek(), [])
  const [weekStart, setWeekStart] = useState(lastCompletedWeek)
  const [weekEnd, setWeekEnd] = useState(lastCompletedWeek)

  // Story 6.2-FE: Comparison mode state
  const [comparisonEnabled, setComparisonEnabled] = useState(false)
  const [comparisonPreset, setComparisonPreset] = useState<ComparisonPreset>('previous')
  const [customCompareStart, setCustomCompareStart] = useState(lastCompletedWeek)
  const [customCompareEnd, setCustomCompareEnd] = useState(lastCompletedWeek)

  // Story 6.5-FE: Export dialog state
  const [showExportDialog, setShowExportDialog] = useState(false)

  // Story 6.2-FE: Calculate effective comparison period based on preset
  const effectiveComparisonPeriod = useMemo(() => {
    if (!comparisonEnabled) return null
    return getEffectiveComparisonPeriod(
      comparisonPreset,
      weekStart,
      weekEnd,
      customCompareStart,
      customCompareEnd
    )
  }, [
    comparisonEnabled,
    comparisonPreset,
    weekStart,
    weekEnd,
    customCompareStart,
    customCompareEnd,
  ])

  // Story 6.2-FE: Handle custom comparison range change
  const handleCompareRangeChange = useCallback((start: string, end: string) => {
    setCustomCompareStart(start)
    setCustomCompareEnd(end)
  }, [])

  // Story 6.1-FE: Handle date range change
  const handleRangeChange = useCallback((newStart: string, newEnd: string) => {
    setWeekStart(newStart)
    setWeekEnd(newEnd)
  }, [])

  // Handle drill-down navigation to SKU level
  const handleDrillDown = useCallback(
    (value: string) => {
      router.push(
        `${options.drillDownPath}?weekStart=${weekStart}&weekEnd=${weekEnd}&${options.drillDownParam}=${encodeURIComponent(value)}`
      )
    },
    [router, options.drillDownPath, options.drillDownParam, weekStart, weekEnd]
  )

  // Story 6.1-FE: Check if using date range (multiple weeks)
  const isRangeMode = weekStart !== weekEnd

  // Build comparison query params for data hooks
  const comparisonParams = useMemo(
    () => ({
      compareTo:
        effectiveComparisonPeriod?.start === effectiveComparisonPeriod?.end
          ? effectiveComparisonPeriod?.start
          : undefined,
      compareToStart:
        effectiveComparisonPeriod?.start !== effectiveComparisonPeriod?.end
          ? effectiveComparisonPeriod?.start
          : undefined,
      compareToEnd:
        effectiveComparisonPeriod?.start !== effectiveComparisonPeriod?.end
          ? effectiveComparisonPeriod?.end
          : undefined,
    }),
    [effectiveComparisonPeriod]
  )

  return {
    weekStart,
    weekEnd,
    comparisonEnabled,
    setComparisonEnabled,
    comparisonPreset,
    setComparisonPreset,
    customCompareStart,
    customCompareEnd,
    showExportDialog,
    setShowExportDialog,
    effectiveComparisonPeriod,
    handleCompareRangeChange,
    handleRangeChange,
    handleDrillDown,
    isRangeMode,
    comparisonParams,
  }
}
