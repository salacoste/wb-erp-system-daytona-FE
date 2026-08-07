'use client'

/**
 * Dashboard Period Selector Component
 * Story 60.2-FE: Period Selector Component
 * Story 163.6-FE: Period type toggle migrated from Tabs to RadioGroup (FR13/UX-DR5).
 *
 * Unified period selector for dashboard with a single-choice week/month
 * RadioGroup toggle, dropdowns, and refresh button.
 * Sub-components: PeriodSelectorRefreshButton
 *
 * @see docs/stories/epic-60/story-60.2-fe-period-selector-component.md
 */

import React, { useEffect, useId, useState, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { ensureCurrentWeekFirst } from './period-selector-week-helpers'
import { PeriodRefreshButton } from './PeriodSelectorRefreshButton'

export interface DashboardPeriodSelectorProps {
  className?: string
  disabled?: boolean
  compact?: boolean
  onPeriodChange?: (period: string, type: PeriodType) => void
}

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

  const { data: backendWeeks } = useAvailableWeeks()
  const generatedWeeks = useGeneratedWeeks(selectedWeek)

  const baseWeeks = backendWeeks?.map(w => w.week) || generatedWeeks
  const availableWeeks = ensureCurrentWeekFirst(baseWeeks)

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [relativeTime, setRelativeTime] = useState('')

  // Stable per-instance IDs keep the label ↔ input association robust if this
  // selector is ever mounted more than once (global uniqueness across the React tree).
  const weekRadioId = useId()
  const monthRadioId = useId()

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

  // Narrow the Radix RadioGroup onValueChange string to PeriodType without an `as` cast
  // (project no-`as` rule). RadioGroup fires this exactly once per activation.
  const handlePeriodTypeChange = useCallback(
    (value: string): void => {
      setPeriodType(value === 'month' ? 'month' : 'week')
    },
    [setPeriodType]
  )

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

  if (isLoading) return <DashboardPeriodSelectorSkeleton />

  const uniqueMonths = getUniqueMonths(availableWeeks)
  const displayedWeeks = availableWeeks.slice(0, MAX_WEEKS)
  const displayedMonths = uniqueMonths.slice(0, MAX_MONTHS)

  return (
    <div
      data-testid="period-selector-container"
      className={cn('flex flex-col gap-3 md:flex-row md:items-center md:gap-4', className)}
    >
      <RadioGroup
        value={periodType}
        onValueChange={handlePeriodTypeChange}
        aria-label="Тип периода"
        data-testid="period-type-toggle"
        disabled={disabled}
        className="flex flex-row items-center gap-4"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem
            value="week"
            id={weekRadioId}
            disabled={disabled}
            data-testid="period-toggle-week"
          />
          <Label htmlFor={weekRadioId} data-testid="period-toggle-week-label">
            Неделя
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem
            value="month"
            id={monthRadioId}
            disabled={disabled}
            data-testid="period-toggle-month"
          />
          <Label htmlFor={monthRadioId} data-testid="period-toggle-month-label">
            Месяц
          </Label>
        </div>
      </RadioGroup>

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

      {!compact && (
        <PeriodRefreshButton
          disabled={disabled}
          isRefreshing={isRefreshing}
          relativeTime={relativeTime}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  )
}

export default DashboardPeriodSelector
