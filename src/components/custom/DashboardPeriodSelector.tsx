'use client'

/**
 * Dashboard Period Selector Component
 * Story 60.2-FE: Period Selector Component
 *
 * Unified period selector for dashboard with week/month toggle,
 * dropdowns, and refresh button.
 *
 * @see docs/stories/epic-60/story-60.2-fe-period-selector-component.md
 */

import React, { useEffect, useState, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDashboardPeriod } from '@/hooks/useDashboardPeriod'
import { useAvailableWeeks } from '@/hooks/useFinancialSummary'
import { formatWeekLabel, formatMonthLabel, getCurrentWeek } from '@/lib/period-helpers'
import type { PeriodType } from '@/contexts/dashboard-period-types'

import {
  DashboardPeriodSelectorSkeleton,
  useGeneratedWeeks,
  getUniqueMonths,
  MAX_WEEKS,
  MAX_MONTHS,
} from './period-selector'

/**
 * Parse week string to get year and week number
 * @param week - Week in "YYYY-Www" format
 * @returns { year, week } or null if invalid
 */
function parseWeekString(week: string): { year: number; week: number } | null {
  const match = week.match(/^(\d{4})-W(\d{2})$/)
  if (!match) return null
  return { year: parseInt(match[1], 10), week: parseInt(match[2], 10) }
}

/**
 * Generate week string from year and week number
 */
function formatWeekString(year: number, week: number): string {
  return `${year}-W${week.toString().padStart(2, '0')}`
}

/**
 * Ensure all weeks from current week down to the first week in list are included.
 * This fixes the bug where Week 5 was missing between Week 6 (current) and Week 4 (selected).
 *
 * BUG FIX: When selectedWeek is older than currentWeek, we need to fill the gap.
 * Example: currentWeek=W06, list=[W04, W03, W02...] → result=[W06, W05, W04, W03, W02...]
 */
function ensureCurrentWeekFirst(weeks: string[]): string[] {
  if (weeks.length === 0) return weeks

  const currentWeek = getCurrentWeek()
  const current = parseWeekString(currentWeek)
  const firstInList = parseWeekString(weeks[0])

  if (!current || !firstInList) {
    // Fallback to simple logic if parsing fails
    const filtered = weeks.filter(w => w !== currentWeek)
    return [currentWeek, ...filtered]
  }

  // Generate all weeks from current down to first in list
  const result: string[] = []
  let year = current.year
  let weekNum = current.week

  // Calculate end point (first week in list)
  const endYear = firstInList.year
  const endWeek = firstInList.week

  // Add weeks from current to first in list (inclusive)
  while (year > endYear || (year === endYear && weekNum >= endWeek)) {
    result.push(formatWeekString(year, weekNum))
    weekNum--
    if (weekNum < 1) {
      year--
      // Get ISO weeks in previous year (52 or 53)
      const jan4 = new Date(year, 0, 4)
      const dayOfWeek = jan4.getDay() || 7
      const hasWeek53 = dayOfWeek === 4 || (dayOfWeek === 5 && isLeapYear(year - 1))
      weekNum = hasWeek53 ? 53 : 52
    }
    // Safety limit to prevent infinite loop
    if (result.length > 60) break
  }

  // Add remaining weeks from original list that are older
  const resultSet = new Set(result)
  for (const week of weeks) {
    if (!resultSet.has(week)) {
      result.push(week)
    }
  }

  return result
}

/** Check if year is a leap year */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export interface DashboardPeriodSelectorProps {
  /** Optional className for styling overrides */
  className?: string
  /** Disable all interactions (during data loading) */
  disabled?: boolean
  /** Show compact version without refresh button */
  compact?: boolean
  /** Callback when period changes (for analytics tracking) */
  onPeriodChange?: (period: string, type: PeriodType) => void
}

/**
 * Unified period selector component for dashboard
 */
export function DashboardPeriodSelector({
  className,
  disabled = false,
  compact = false,
  onPeriodChange,
}: DashboardPeriodSelectorProps): React.ReactElement {
  const {
    periodType,
    selectedWeek,
    selectedMonth,
    lastRefresh,
    isLoading,
    setPeriodType,
    setWeek,
    setMonth,
    refresh,
  } = useDashboardPeriod()

  // Fetch available weeks from backend API
  const { data: backendWeeks } = useAvailableWeeks()

  // Always call hooks (Rules of Hooks)
  const generatedWeeks = useGeneratedWeeks(selectedWeek)

  // Use backend weeks if available, otherwise fallback to generated weeks
  // Always ensure current week is at the top for user selection
  const baseWeeks = backendWeeks?.map(w => w.week) || generatedWeeks
  const availableWeeks = ensureCurrentWeekFirst(baseWeeks)

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [relativeTime, setRelativeTime] = useState('')

  // Update relative time display
  useEffect(() => {
    const updateTime = (): void => {
      setRelativeTime(formatDistanceToNow(lastRefresh, { addSuffix: false, locale: ru }))
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [lastRefresh])

  const handleRefresh = useCallback(async (): Promise<void> => {
    setIsRefreshing(true)
    try {
      refresh()
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }, [refresh])

  const handleWeekChange = useCallback(
    (week: string): void => {
      setWeek(week)
      onPeriodChange?.(week, 'week')
    },
    [setWeek, onPeriodChange]
  )

  const handleMonthChange = useCallback(
    (month: string): void => {
      setMonth(month)
      onPeriodChange?.(month, 'month')
    },
    [setMonth, onPeriodChange]
  )

  if (isLoading) {
    return <DashboardPeriodSelectorSkeleton />
  }

  const uniqueMonths = getUniqueMonths(availableWeeks)
  const displayedWeeks = availableWeeks.slice(0, MAX_WEEKS)
  const displayedMonths = uniqueMonths.slice(0, MAX_MONTHS)

  return (
    <div
      data-testid="period-selector-container"
      className={cn('flex flex-col gap-3 md:flex-row md:items-center md:gap-4', className)}
    >
      {/* Period Type Tabs */}
      <Tabs
        value={periodType}
        onValueChange={value => setPeriodType(value as PeriodType)}
        aria-label="Тип периода"
        data-testid="period-type-toggle"
      >
        <TabsList className="transition-colors">
          <TabsTrigger value="week" disabled={disabled} data-testid="period-tab-week">
            Неделя
          </TabsTrigger>
          <TabsTrigger value="month" disabled={disabled} data-testid="period-tab-month">
            Месяц
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Period Dropdown */}
      <Select
        value={periodType === 'week' ? selectedWeek : selectedMonth}
        onValueChange={periodType === 'week' ? handleWeekChange : handleMonthChange}
        disabled={disabled}
      >
        <SelectTrigger
          className="w-full md:w-[320px]"
          aria-label={periodType === 'week' ? 'Выбор недели' : 'Выбор месяца'}
          data-testid={periodType === 'week' ? 'week-selector' : 'month-selector'}
        >
          <SelectValue placeholder="Выберите период" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {periodType === 'week'
            ? displayedWeeks.map(week => (
                <SelectItem key={week} value={week}>
                  {formatWeekLabel(week)}
                </SelectItem>
              ))
            : displayedMonths.map(month => (
                <SelectItem key={month} value={month}>
                  {formatMonthLabel(month)}
                </SelectItem>
              ))}
        </SelectContent>
      </Select>

      {/* Refresh Button + Last Update */}
      {!compact && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={disabled || isRefreshing}
            aria-label="Обновить данные"
            data-testid="refresh-button"
          >
            <RefreshCw
              data-testid={isRefreshing ? 'refresh-spinner' : 'refresh-icon'}
              className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
            />
          </Button>
          <span className="text-sm text-muted-foreground" data-testid="last-updated">
            Обновлено: {relativeTime}
          </span>
        </div>
      )}
    </div>
  )
}

export default DashboardPeriodSelector
