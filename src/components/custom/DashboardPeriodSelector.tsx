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
import { formatWeekLabel, formatMonthLabel } from '@/lib/period-helpers'
import type { PeriodType } from '@/contexts/dashboard-period-types'

import {
  DashboardPeriodSelectorSkeleton,
  useGeneratedWeeks,
  getUniqueMonths,
  MAX_WEEKS,
  MAX_MONTHS,
} from './period-selector'

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
  const availableWeeks = backendWeeks?.map(w => w.week) || generatedWeeks

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
