/**
 * Comparison Period Selector Component
 * Story 6.2-FE: Period Comparison Enhancement
 *
 * Allows users to enable comparison mode and select a comparison period.
 * Supports preset options (previous period, same period last year) and custom ranges.
 */

import { useId, useState } from 'react'
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
import { Button } from '@/components/ui/button'
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
  const switchId = useId()
  const contentId = useId()
  const presetId = useId()

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
    <Card className={cn('border-dashed', enabled && 'border-primary/40 bg-accent/30', className)}>
      <CardContent className="py-3 px-4">
        {/* Toggle Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-h-11 items-center gap-3">
            <Switch
              id={switchId}
              checked={enabled}
              onCheckedChange={onEnabledToggle}
              onClick={e => e.stopPropagation()}
              className="min-h-11 min-w-11"
            />
            <Label
              htmlFor={switchId}
              className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium"
              onClick={e => e.stopPropagation()}
            >
              <GitCompare aria-hidden="true" className="h-4 w-4 text-primary" />
              Сравнить с периодом
            </Label>
          </div>

          {enabled && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-controls={contentId}
              className="min-h-11 max-w-full whitespace-normal text-muted-foreground"
            >
              <Calendar aria-hidden="true" className="h-4 w-4" />
              <span className="break-words">{comparisonPeriodLabel}</span>
              {isExpanded ? (
                <ChevronUp aria-hidden="true" className="h-4 w-4" />
              ) : (
                <ChevronDown aria-hidden="true" className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* Expanded Options */}
        {enabled && isExpanded && (
          <div id={contentId} className="mt-4 space-y-4 border-t border-border pt-4">
            {/* Preset Selector */}
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
              <Label htmlFor={presetId} className="text-sm text-muted-foreground sm:min-w-25">
                Сравнить с:
              </Label>
              <Select value={preset} onValueChange={v => handlePresetChange(v as ComparisonPreset)}>
                <SelectTrigger id={presetId} className="w-full sm:w-60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="previous">
                    <div className="flex flex-col items-start">
                      <span>Предыдущий период</span>
                      <span className="text-xs text-muted-foreground">
                        {formatPeriodDisplay(previousPeriod.start, previousPeriod.end)}
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="same_last_year">
                    <div className="flex flex-col items-start">
                      <span>Тот же период прошлого года</span>
                      <span className="text-xs text-muted-foreground">
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
              <div className="sm:pl-28">
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
