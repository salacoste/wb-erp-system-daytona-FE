'use client'

import { DateRangePicker } from '@/components/custom/DateRangePicker'
import {
  ComparisonPeriodSelector,
  ComparisonPreset,
} from '@/components/custom/ComparisonPeriodSelector'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface MarginFilterSectionProps {
  weekStart: string
  weekEnd: string
  onRangeChange: (start: string, end: string) => void
  comparisonEnabled: boolean
  onComparisonEnabledChange: (enabled: boolean) => void
  comparisonPreset: ComparisonPreset
  onPresetChange: (preset: ComparisonPreset) => void
  customCompareStart: string
  customCompareEnd: string
  onCompareRangeChange: (start: string, end: string) => void
}

/**
 * Shared filter section for margin analysis pages (brand/category).
 * Contains DateRangePicker and ComparisonPeriodSelector.
 * Story 6.1-FE, 6.2-FE.
 */
export function MarginFilterSection({
  weekStart,
  weekEnd,
  onRangeChange,
  comparisonEnabled,
  onComparisonEnabledChange,
  comparisonPreset,
  onPresetChange,
  customCompareStart,
  customCompareEnd,
  onCompareRangeChange,
}: MarginFilterSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Период анализа</CardTitle>
        <CardDescription>Выберите диапазон недель для анализа</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <DateRangePicker
          weekStart={weekStart}
          weekEnd={weekEnd}
          onRangeChange={onRangeChange}
          maxWeeks={52}
        />
        {/* Story 6.2-FE: Comparison Period Selector */}
        <ComparisonPeriodSelector
          enabled={comparisonEnabled}
          onEnabledChange={onComparisonEnabledChange}
          preset={comparisonPreset}
          onPresetChange={onPresetChange}
          compareStart={customCompareStart}
          compareEnd={customCompareEnd}
          onCompareRangeChange={onCompareRangeChange}
          currentPeriodStart={weekStart}
          currentPeriodEnd={weekEnd}
        />
      </CardContent>
    </Card>
  )
}
