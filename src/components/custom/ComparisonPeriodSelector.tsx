/**
 * Comparison Period Selector Component
 * Story 6.2-FE: Period Comparison Enhancement
 *
 * Allows users to enable comparison mode and select a comparison period.
 * Supports preset options (previous period, same period last year) and custom ranges.
 */

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { DateRangePicker } from './DateRangePicker'
import { GitCompare, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPeriodDisplay } from './comparison-period/comparison-period-utils'
import { useComparisonPeriodState } from './comparison-period/useComparisonPeriodState'
import type {
  ComparisonPeriodSelectorProps,
  ComparisonPreset,
} from './comparison-period/comparison-period-types'

// Re-export public types and functions for backward compatibility
export type {
  ComparisonPreset,
  ComparisonPeriodSelectorProps,
} from './comparison-period/comparison-period-types'
export { getEffectiveComparisonPeriod } from './comparison-period/comparison-period-utils'

export function ComparisonPeriodSelector({
  enabled,
  onEnabledChange,
  preset,
  onPresetChange,
  compareStart,
  compareEnd,
  onCompareRangeChange,
  currentPeriodStart,
  currentPeriodEnd,
  className,
}: ComparisonPeriodSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const {
    previousPeriod,
    samePeriodLastYear,
    comparisonPeriodLabel,
    handlePresetChange,
    handleEnabledChange,
  } = useComparisonPeriodState({
    enabled,
    preset,
    compareStart,
    compareEnd,
    currentPeriodStart,
    currentPeriodEnd,
    onPresetChange,
    onCompareRangeChange,
  })

  const onEnabledToggle = (newEnabled: boolean) => {
    onEnabledChange(newEnabled)
    handleEnabledChange(newEnabled)
  }

  return (
    <Card className={cn('border-dashed', enabled && 'border-blue-300 bg-blue-50/50', className)}>
      <CardContent className="py-3 px-4">
        {/* Toggle Row */}
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => enabled && setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <Switch
              id="comparison-mode"
              checked={enabled}
              onCheckedChange={onEnabledToggle}
              onClick={e => e.stopPropagation()}
            />
            <Label
              htmlFor="comparison-mode"
              className="flex items-center gap-2 cursor-pointer text-sm font-medium"
              onClick={e => e.stopPropagation()}
            >
              <GitCompare className="h-4 w-4 text-blue-600" />
              Сравнить с периодом
            </Label>
          </div>

          {enabled && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{comparisonPeriodLabel}</span>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          )}
        </div>

        {/* Expanded Options */}
        {enabled && isExpanded && (
          <div className="mt-4 pt-4 border-t border-blue-200 space-y-4">
            {/* Preset Selector */}
            <div className="flex items-center gap-3">
              <Label className="text-sm text-gray-600 min-w-[100px]">Сравнить с:</Label>
              <Select value={preset} onValueChange={v => handlePresetChange(v as ComparisonPreset)}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="previous">
                    <div className="flex flex-col items-start">
                      <span>Предыдущий период</span>
                      <span className="text-xs text-gray-500">
                        {formatPeriodDisplay(previousPeriod.start, previousPeriod.end)}
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="same_last_year">
                    <div className="flex flex-col items-start">
                      <span>Тот же период прошлого года</span>
                      <span className="text-xs text-gray-500">
                        {formatPeriodDisplay(samePeriodLastYear.start, samePeriodLastYear.end)}
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="custom">Выбрать период...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Range Picker */}
            {preset === 'custom' && (
              <div className="pl-[112px]">
                <DateRangePicker
                  weekStart={compareStart}
                  weekEnd={compareEnd}
                  onRangeChange={onCompareRangeChange}
                  maxWeeks={52}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
