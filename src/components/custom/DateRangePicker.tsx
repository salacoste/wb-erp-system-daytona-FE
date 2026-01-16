/**
 * Date Range Picker Component
 * Story 6.1-FE: Date Range Support for Analytics
 *
 * Features:
 * - Select week range (from week to week)
 * - Validation: start week <= end week
 * - Validation: range <= 52 weeks with error message
 * - "Последние N недель" quick select option
 * - Uses existing WeekSelector pattern
 *
 * Reference: frontend/docs/stories/epic-6/story-6.1-fe-date-range-support.md
 */

import { useMemo, useCallback } from 'react'
import { useAvailableWeeks, formatWeekWithDateRange } from '@/hooks/useFinancialSummary'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Calendar } from 'lucide-react'

/**
 * Props for DateRangePicker component
 */
export interface DateRangePickerProps {
  /** Start week in YYYY-Www format */
  weekStart: string
  /** End week in YYYY-Www format */
  weekEnd: string
  /** Callback when range changes */
  onRangeChange: (weekStart: string, weekEnd: string) => void
  /** Maximum allowed weeks in range (default: 52) */
  maxWeeks?: number
  /** Whether the picker is disabled */
  disabled?: boolean
  /** Custom class name */
  className?: string
  /** Show quick select dropdown (default: true) */
  showQuickSelect?: boolean
}

/**
 * Quick select options for "Последние N недель"
 */
const QUICK_SELECT_OPTIONS = [
  { value: 4, label: 'Последние 4 недели' },
  { value: 8, label: 'Последние 8 недель' },
  { value: 12, label: 'Последние 12 недель' },
  { value: 13, label: 'Последний квартал (13 недель)' },
]

/**
 * Parse ISO week string to comparable integer
 * E.g., "2025-W47" -> 202547
 */
function parseWeekToNumber(week: string): number {
  const match = week.match(/^(\d{4})-W(\d{2})$/)
  if (!match) return 0
  const [, year, weekNum] = match
  return parseInt(year, 10) * 100 + parseInt(weekNum, 10)
}

/**
 * Calculate number of weeks between two ISO week strings
 * Story 6.1-FE: Validation - range <= 52 weeks
 */
export function calculateWeeksDiff(weekStart: string, weekEnd: string): number {
  const startMatch = weekStart.match(/^(\d{4})-W(\d{2})$/)
  const endMatch = weekEnd.match(/^(\d{4})-W(\d{2})$/)

  if (!startMatch || !endMatch) return 0

  const startYear = parseInt(startMatch[1], 10)
  const startWeek = parseInt(startMatch[2], 10)
  const endYear = parseInt(endMatch[1], 10)
  const endWeek = parseInt(endMatch[2], 10)

  // Calculate total weeks from start of year 0
  // Approximate: 52 weeks per year
  const startTotal = startYear * 52 + startWeek
  const endTotal = endYear * 52 + endWeek

  return endTotal - startTotal + 1 // +1 to include both start and end weeks
}

/**
 * Get week N weeks before the given week
 */
function getWeekNWeeksBefore(week: string, n: number): string {
  const match = week.match(/^(\d{4})-W(\d{2})$/)
  if (!match) return week

  let year = parseInt(match[1], 10)
  let weekNum = parseInt(match[2], 10)

  // Subtract n-1 weeks (to include current week in count)
  weekNum -= (n - 1)

  // Handle year boundary
  while (weekNum < 1) {
    year -= 1
    weekNum += 52 // Approximate, some years have 53 weeks
  }

  return `${year}-W${weekNum.toString().padStart(2, '0')}`
}

/**
 * DateRangePicker component for selecting week ranges
 * Used in analytics pages for date range filtering
 */
export function DateRangePicker({
  weekStart,
  weekEnd,
  onRangeChange,
  maxWeeks = 52,
  disabled = false,
  className,
  showQuickSelect = true,
}: DateRangePickerProps) {
  const { data: weeks, isLoading, isError } = useAvailableWeeks()

  // Validation: start week <= end week
  const isStartAfterEnd = useMemo(() => {
    return parseWeekToNumber(weekStart) > parseWeekToNumber(weekEnd)
  }, [weekStart, weekEnd])

  // Validation: range <= maxWeeks
  const weeksInRange = useMemo(() => {
    return calculateWeeksDiff(weekStart, weekEnd)
  }, [weekStart, weekEnd])

  const isRangeTooLarge = weeksInRange > maxWeeks

  // Determine if current range matches a quick select option
  const matchedQuickOption = useMemo(() => {
    if (!weeks || weeks.length === 0) return undefined
    const latestWeek = weeks[0].week

    // Check if weekEnd is the latest week
    if (weekEnd !== latestWeek) return undefined

    // Check which quick option matches the current range
    for (const option of QUICK_SELECT_OPTIONS) {
      const expectedStart = getWeekNWeeksBefore(latestWeek, option.value)
      // Allow for some flexibility in matching (available weeks may not have exact start)
      if (weekStart === expectedStart || weeksInRange === option.value) {
        return option.value.toString()
      }
    }
    return undefined
  }, [weeks, weekStart, weekEnd, weeksInRange])

  // Handle start week change
  // Auto-swap: if new start is after current end, swap them (start becomes end, end becomes new start)
  const handleStartChange = useCallback((newStart: string) => {
    if (parseWeekToNumber(newStart) > parseWeekToNumber(weekEnd)) {
      // Swap: weekEnd becomes start, newStart becomes end
      onRangeChange(weekEnd, newStart)
    } else {
      onRangeChange(newStart, weekEnd)
    }
  }, [weekEnd, onRangeChange])

  // Handle end week change
  // Auto-swap: if new end is before current start, swap them (new end becomes start, start becomes end)
  const handleEndChange = useCallback((newEnd: string) => {
    if (parseWeekToNumber(newEnd) < parseWeekToNumber(weekStart)) {
      // Swap: newEnd becomes start, weekStart becomes end
      onRangeChange(newEnd, weekStart)
    } else {
      onRangeChange(weekStart, newEnd)
    }
  }, [weekStart, onRangeChange])

  // Handle quick select
  const handleQuickSelect = useCallback((weeksCount: string) => {
    if (!weeks || weeks.length === 0) return

    const count = parseInt(weeksCount, 10)
    const latestWeek = weeks[0].week // Weeks are sorted descending

    // Calculate start week
    const startWeek = getWeekNWeeksBefore(latestWeek, count)

    // Find the closest available week to our calculated start
    const availableWeeks = weeks.map(w => w.week)
    let actualStart = startWeek

    // If calculated start is not in available weeks, find closest
    if (!availableWeeks.includes(startWeek)) {
      // Find the first week that is <= our target
      const sortedWeeks = [...availableWeeks].sort((a, b) =>
        parseWeekToNumber(b) - parseWeekToNumber(a)
      )
      for (const w of sortedWeeks) {
        if (parseWeekToNumber(w) <= parseWeekToNumber(startWeek)) {
          actualStart = w
          break
        }
      }
      // If none found, use the oldest available
      if (!availableWeeks.includes(actualStart)) {
        actualStart = sortedWeeks[sortedWeeks.length - 1]
      }
    }

    onRangeChange(actualStart, latestWeek)
  }, [weeks, onRangeChange])

  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        <Label>Период</Label>
        <Skeleton className="h-10 w-full mt-2" />
      </div>
    )
  }

  // Error state
  if (isError || !weeks || weeks.length === 0) {
    return (
      <div className={className}>
        <Label>Период</Label>
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {isError
              ? 'Не удалось загрузить список недель'
              : 'Нет доступных недель для отображения'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="h-4 w-4 text-gray-500" />
        <Label>Период анализа</Label>
      </div>

      {/* Quick Select */}
      {showQuickSelect && (
        <div className="mb-3">
          <Select value={matchedQuickOption} onValueChange={handleQuickSelect} disabled={disabled}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Быстрый выбор периода..." />
            </SelectTrigger>
            <SelectContent>
              {QUICK_SELECT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Manual Range Selection */}
      <div className="grid grid-cols-2 gap-3">
        {/* Start Week */}
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">От</Label>
          <Select value={weekStart} onValueChange={handleStartChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Начало" />
            </SelectTrigger>
            <SelectContent>
              {weeks.map((week) => (
                <SelectItem key={week.week} value={week.week}>
                  {formatWeekWithDateRange(week.week)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* End Week */}
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">До</Label>
          <Select value={weekEnd} onValueChange={handleEndChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Конец" />
            </SelectTrigger>
            <SelectContent>
              {weeks.map((week) => (
                <SelectItem key={week.week} value={week.week}>
                  {formatWeekWithDateRange(week.week)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Period Summary */}
      <div className="mt-2 text-xs text-gray-500">
        {!isStartAfterEnd && !isRangeTooLarge && (
          <span>
            Выбрано: {weeksInRange} {weeksInRange === 1 ? 'неделя' : weeksInRange < 5 ? 'недели' : 'недель'}
          </span>
        )}
      </div>

      {/* Validation Errors */}
      {isStartAfterEnd && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Начальная неделя не может быть позже конечной
          </AlertDescription>
        </Alert>
      )}

      {isRangeTooLarge && !isStartAfterEnd && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Диапазон не может превышать {maxWeeks} недель. Выбрано: {weeksInRange}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

/**
 * Format period label for display
 * E.g., "W44 — W47 (4 недели)"
 * Story 6.1-FE: Display Aggregated Data (AC4)
 */
export function formatPeriodLabel(weekStart: string, weekEnd: string): string {
  const startMatch = weekStart.match(/^(\d{4})-W(\d{2})$/)
  const endMatch = weekEnd.match(/^(\d{4})-W(\d{2})$/)

  if (!startMatch || !endMatch) return `${weekStart} — ${weekEnd}`

  const startWeekNum = parseInt(startMatch[2], 10)
  const endWeekNum = parseInt(endMatch[2], 10)
  const startYear = startMatch[1]
  const endYear = endMatch[1]

  const weeksCount = calculateWeeksDiff(weekStart, weekEnd)
  const weeksLabel = weeksCount === 1
    ? '1 неделя'
    : weeksCount < 5
      ? `${weeksCount} недели`
      : `${weeksCount} недель`

  // Same year
  if (startYear === endYear) {
    if (startWeekNum === endWeekNum) {
      return `W${startWeekNum} (${weeksLabel})`
    }
    return `W${startWeekNum} — W${endWeekNum} (${weeksLabel})`
  }

  // Different years
  return `${startYear}-W${startWeekNum} — ${endYear}-W${endWeekNum} (${weeksLabel})`
}
