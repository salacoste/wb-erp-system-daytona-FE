/**
 * Comparison Period Selector Component
 * Story 6.2-FE: Period Comparison Enhancement
 *
 * Allows users to enable comparison mode and select a comparison period.
 * Supports preset options (previous period, same period last year) and custom ranges.
 */

import { useState, useMemo } from 'react'
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

/**
 * Preset comparison options
 */
export type ComparisonPreset = 'previous' | 'same_last_year' | 'custom'

export interface ComparisonPeriodSelectorProps {
  /** Whether comparison mode is enabled */
  enabled: boolean
  /** Callback when comparison mode is toggled */
  onEnabledChange: (enabled: boolean) => void
  /** Selected comparison preset */
  preset: ComparisonPreset
  /** Callback when preset changes */
  onPresetChange: (preset: ComparisonPreset) => void
  /** Start week of comparison period (for custom) */
  compareStart: string
  /** End week of comparison period (for custom) */
  compareEnd: string
  /** Callback when comparison range changes (custom mode) */
  onCompareRangeChange: (start: string, end: string) => void
  /** Current period start (for calculating presets) */
  currentPeriodStart: string
  /** Current period end (for calculating presets) */
  currentPeriodEnd: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Calculate the previous period based on current period length
 * E.g., if current is W45-W47 (3 weeks), previous is W42-W44
 */
function calculatePreviousPeriod(start: string, end: string): { start: string; end: string } {
  // Parse ISO week format: YYYY-Www
  const parseIsoWeek = (week: string) => {
    const match = week.match(/(\d{4})-W(\d{2})/)
    if (!match) return { year: 2025, week: 1 }
    return { year: parseInt(match[1]), week: parseInt(match[2]) }
  }

  const startParsed = parseIsoWeek(start)
  const endParsed = parseIsoWeek(end)

  // Calculate period length in weeks
  const periodLength = endParsed.week - startParsed.week + 1

  // Calculate previous period end (week before current start)
  let prevEndWeek = startParsed.week - 1
  let prevEndYear = startParsed.year
  if (prevEndWeek <= 0) {
    prevEndYear -= 1
    prevEndWeek = 52 + prevEndWeek // Handle year boundary
  }

  // Calculate previous period start
  let prevStartWeek = prevEndWeek - periodLength + 1
  let prevStartYear = prevEndYear
  if (prevStartWeek <= 0) {
    prevStartYear -= 1
    prevStartWeek = 52 + prevStartWeek
  }

  return {
    start: `${prevStartYear}-W${String(prevStartWeek).padStart(2, '0')}`,
    end: `${prevEndYear}-W${String(prevEndWeek).padStart(2, '0')}`,
  }
}

/**
 * Calculate the same period from last year
 */
function calculateSamePeriodLastYear(start: string, end: string): { start: string; end: string } {
  const parseIsoWeek = (week: string) => {
    const match = week.match(/(\d{4})-W(\d{2})/)
    if (!match) return { year: 2025, week: 1 }
    return { year: parseInt(match[1]), week: parseInt(match[2]) }
  }

  const startParsed = parseIsoWeek(start)
  const endParsed = parseIsoWeek(end)

  return {
    start: `${startParsed.year - 1}-W${String(startParsed.week).padStart(2, '0')}`,
    end: `${endParsed.year - 1}-W${String(endParsed.week).padStart(2, '0')}`,
  }
}

/**
 * Format period for display
 */
function formatPeriodDisplay(start: string, end: string): string {
  if (start === end) {
    return start
  }
  return `${start} — ${end}`
}

/**
 * Comparison Period Selector
 *
 * @example
 * <ComparisonPeriodSelector
 *   enabled={comparisonEnabled}
 *   onEnabledChange={setComparisonEnabled}
 *   preset={comparisonPreset}
 *   onPresetChange={setComparisonPreset}
 *   compareStart={compareStart}
 *   compareEnd={compareEnd}
 *   onCompareRangeChange={handleCompareRangeChange}
 *   currentPeriodStart={weekStart}
 *   currentPeriodEnd={weekEnd}
 * />
 */
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

  // Calculate preset periods based on current period
  const previousPeriod = useMemo(
    () => calculatePreviousPeriod(currentPeriodStart, currentPeriodEnd),
    [currentPeriodStart, currentPeriodEnd]
  )

  const samePeriodLastYear = useMemo(
    () => calculateSamePeriodLastYear(currentPeriodStart, currentPeriodEnd),
    [currentPeriodStart, currentPeriodEnd]
  )

  // Get display label for current comparison period
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

  // Handle preset change and update comparison period
  const handlePresetChange = (newPreset: ComparisonPreset) => {
    onPresetChange(newPreset)
    if (newPreset === 'previous') {
      onCompareRangeChange(previousPeriod.start, previousPeriod.end)
    } else if (newPreset === 'same_last_year') {
      onCompareRangeChange(samePeriodLastYear.start, samePeriodLastYear.end)
    }
    // For 'custom', keep current values
  }

  // Handle enable toggle
  const handleEnabledChange = (newEnabled: boolean) => {
    onEnabledChange(newEnabled)
    if (newEnabled && preset === 'previous') {
      // Initialize with previous period
      onCompareRangeChange(previousPeriod.start, previousPeriod.end)
    }
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
              onCheckedChange={handleEnabledChange}
              onClick={(e) => e.stopPropagation()}
            />
            <Label
              htmlFor="comparison-mode"
              className="flex items-center gap-2 cursor-pointer text-sm font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              <GitCompare className="h-4 w-4 text-blue-600" />
              Сравнить с периодом
            </Label>
          </div>

          {enabled && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{comparisonPeriodLabel}</span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          )}
        </div>

        {/* Expanded Options */}
        {enabled && isExpanded && (
          <div className="mt-4 pt-4 border-t border-blue-200 space-y-4">
            {/* Preset Selector */}
            <div className="flex items-center gap-3">
              <Label className="text-sm text-gray-600 min-w-[100px]">Сравнить с:</Label>
              <Select value={preset} onValueChange={(v) => handlePresetChange(v as ComparisonPreset)}>
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

/**
 * Get effective comparison period based on preset and custom values
 */
export function getEffectiveComparisonPeriod(
  preset: ComparisonPreset,
  currentStart: string,
  currentEnd: string,
  customStart: string,
  customEnd: string
): { start: string; end: string } {
  if (preset === 'previous') {
    return calculatePreviousPeriod(currentStart, currentEnd)
  }
  if (preset === 'same_last_year') {
    return calculateSamePeriodLastYear(currentStart, currentEnd)
  }
  return { start: customStart, end: customEnd }
}
