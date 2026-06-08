'use client'

/**
 * Comparison period state management hook
 * Extracted from ComparisonPeriodSelector.tsx for file size compliance
 * Story 6.2-FE: Period Comparison Enhancement
 */

import { useMemo } from 'react'
import {
  calculatePreviousPeriod,
  calculateSamePeriodLastYear,
  formatPeriodDisplay,
} from './comparison-period-utils'
import type { ComparisonPreset } from './comparison-period-types'

interface UseComparisonPeriodStateProps {
  enabled: boolean
  preset: ComparisonPreset
  compareStart: string
  compareEnd: string
  currentPeriodStart: string
  currentPeriodEnd: string
  onPresetChange: (preset: ComparisonPreset) => void
  onCompareRangeChange: (start: string, end: string) => void
}

export function useComparisonPeriodState({
  enabled,
  preset,
  compareStart,
  compareEnd,
  currentPeriodStart,
  currentPeriodEnd,
  onPresetChange,
  onCompareRangeChange,
}: UseComparisonPeriodStateProps) {
  const previousPeriod = useMemo(
    () => calculatePreviousPeriod(currentPeriodStart, currentPeriodEnd),
    [currentPeriodStart, currentPeriodEnd]
  )

  const samePeriodLastYear = useMemo(
    () => calculateSamePeriodLastYear(currentPeriodStart, currentPeriodEnd),
    [currentPeriodStart, currentPeriodEnd]
  )

  const comparisonPeriodLabel = useMemo(() => {
    if (!enabled) return ''
    if (preset === 'previous') {
      return formatPeriodDisplay(previousPeriod.start, previousPeriod.end)
    }
    if (preset === 'same_last_year') {
      return formatPeriodDisplay(samePeriodLastYear.start, samePeriodLastYear.end)
    }
    return formatPeriodDisplay(compareStart, compareEnd)
  }, [enabled, preset, previousPeriod, samePeriodLastYear, compareStart, compareEnd])

  function handlePresetChange(newPreset: ComparisonPreset) {
    onPresetChange(newPreset)
    if (newPreset === 'previous') {
      onCompareRangeChange(previousPeriod.start, previousPeriod.end)
    } else if (newPreset === 'same_last_year') {
      onCompareRangeChange(samePeriodLastYear.start, samePeriodLastYear.end)
    }
  }

  function handleEnabledChange(newEnabled: boolean) {
    if (newEnabled && preset === 'previous') {
      onCompareRangeChange(previousPeriod.start, previousPeriod.end)
    }
  }

  return {
    previousPeriod,
    samePeriodLastYear,
    comparisonPeriodLabel,
    handlePresetChange,
    handleEnabledChange,
  }
}
