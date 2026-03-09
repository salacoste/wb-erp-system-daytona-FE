'use client'

/**
 * Analytics Week Selector
 * Extracted from analytics/page.tsx - pure structural refactoring
 * Renders appropriate week selector based on view mode
 */

import { WeekSelector, WeekComparisonSelector } from '@/components/custom/WeekSelector'
import { MultiWeekSelector } from '@/components/custom/MultiWeekSelector'
import type { ViewMode } from './useAnalyticsPageState'

interface AnalyticsWeekSelectorProps {
  viewMode: ViewMode
  selectedWeek: string
  selectedWeeks: string[]
  comparisonWeek: string
  onSelectedWeekChange: (week: string) => void
  onSelectedWeeksChange: (weeks: string[]) => void
  onComparisonWeekChange: (week: string) => void
}

export function AnalyticsWeekSelector({
  viewMode,
  selectedWeek,
  selectedWeeks,
  comparisonWeek,
  onSelectedWeekChange,
  onSelectedWeeksChange,
  onComparisonWeekChange,
}: AnalyticsWeekSelectorProps) {
  if (viewMode === 'single') {
    return (
      <WeekSelector value={selectedWeek} onChange={onSelectedWeekChange} label="Выберите период" />
    )
  }

  if (viewMode === 'multi') {
    return (
      <MultiWeekSelector
        value={selectedWeeks}
        onChange={onSelectedWeeksChange}
        label="Выберите периоды для агрегации"
        maxSelection={12}
      />
    )
  }

  return (
    <WeekComparisonSelector
      week1={selectedWeek}
      week2={comparisonWeek}
      onWeek1Change={onSelectedWeekChange}
      onWeek2Change={onComparisonWeekChange}
    />
  )
}
