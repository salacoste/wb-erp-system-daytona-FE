/**
 * Date Range Picker Component — Story 6.1-FE
 * Split into sub-modules for file size compliance (Epic 74):
 * - date-range-picker/date-range-utils.ts - Week parsing, calculation, formatting
 * - date-range-picker/DateRangeSelectors.tsx - Sub-components (selectors, alerts)
 * - date-range-picker/DateRangeStates.tsx - Loading/error boundary states
 */
import { useMemo, useCallback } from 'react'
import { useAvailableWeeks } from '@/hooks/useFinancialSummary'
import { Calendar } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
  parseWeekToNumber,
  calculateWeeksDiff,
  getWeekNWeeksBefore,
  QUICK_SELECT_OPTIONS,
  resolveQuickSelectStart,
} from './date-range-picker/date-range-utils'
import {
  QuickSelectDropdown,
  WeekRangeSelectors,
  PeriodSummary,
  ValidationAlerts,
  DateRangeLoadingState,
  DateRangeErrorState,
} from './date-range-picker/DateRangeSelectors'

// ─── Barrel re-exports for backward compatibility ────────────────────────────
export { calculateWeeksDiff, formatPeriodLabel } from './date-range-picker/date-range-utils'

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

    if (weekEnd !== latestWeek) return undefined

    for (const option of QUICK_SELECT_OPTIONS) {
      const expectedStart = getWeekNWeeksBefore(latestWeek, option.value)
      if (weekStart === expectedStart || weeksInRange === option.value) {
        return option.value.toString()
      }
    }
    return undefined
  }, [weeks, weekStart, weekEnd, weeksInRange])

  // Handle start week change with auto-swap
  const handleStartChange = useCallback(
    (newStart: string) => {
      if (parseWeekToNumber(newStart) > parseWeekToNumber(weekEnd)) {
        onRangeChange(weekEnd, newStart)
      } else {
        onRangeChange(newStart, weekEnd)
      }
    },
    [weekEnd, onRangeChange]
  )

  // Handle end week change with auto-swap
  const handleEndChange = useCallback(
    (newEnd: string) => {
      if (parseWeekToNumber(newEnd) < parseWeekToNumber(weekStart)) {
        onRangeChange(newEnd, weekStart)
      } else {
        onRangeChange(weekStart, newEnd)
      }
    },
    [weekStart, onRangeChange]
  )

  // Handle quick select
  const handleQuickSelect = useCallback(
    (weeksCount: string) => {
      if (!weeks || weeks.length === 0) return
      const count = parseInt(weeksCount, 10)
      const latestWeek = weeks[0].week
      const actualStart = resolveQuickSelectStart(weeks, count)
      onRangeChange(actualStart, latestWeek)
    },
    [weeks, onRangeChange]
  )

  if (isLoading) {
    return <DateRangeLoadingState className={className} />
  }

  if (isError || !weeks || weeks.length === 0) {
    return <DateRangeErrorState className={className} isError={!!isError} />
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="h-4 w-4 text-gray-500" />
        <Label>Период анализа</Label>
      </div>

      {showQuickSelect && (
        <QuickSelectDropdown
          matchedQuickOption={matchedQuickOption}
          onQuickSelect={handleQuickSelect}
          disabled={disabled}
        />
      )}

      <WeekRangeSelectors
        weekStart={weekStart}
        weekEnd={weekEnd}
        weeks={weeks}
        onStartChange={handleStartChange}
        onEndChange={handleEndChange}
        disabled={disabled}
      />

      <PeriodSummary
        weeksInRange={weeksInRange}
        isStartAfterEnd={isStartAfterEnd}
        isRangeTooLarge={isRangeTooLarge}
      />

      <ValidationAlerts
        isStartAfterEnd={isStartAfterEnd}
        isRangeTooLarge={isRangeTooLarge}
        maxWeeks={maxWeeks}
        weeksInRange={weeksInRange}
      />
    </div>
  )
}
