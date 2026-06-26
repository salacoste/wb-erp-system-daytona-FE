'use client'

/**
 * Dashboard Period Selector Component
 * Story 60.2-FE: Period Selector Component
 *
 * Unified period selector for dashboard with week/month toggle,
 * dropdowns, and refresh button.
 * Sub-components: PeriodSelectorRefreshButton
 *
 * @see docs/stories/epic-60/story-60.2-fe-period-selector-component.md
 */

import React, { useEffect, useState, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

  if (isLoading) return <DashboardPeriodSelectorSkeleton />

  const uniqueMonths = getUniqueMonths(availableWeeks)
  const displayedWeeks = availableWeeks.slice(0, MAX_WEEKS)
  const displayedMonths = uniqueMonths.slice(0, MAX_MONTHS)

  return (
    <div
      data-testid="period-selector-container"
      className={cn('flex flex-col gap-3 md:flex-row md:items-center md:gap-4', className)}
    >
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
        {/* TZ-7: the Tabs are used as a week/month toggle (no real panel content). These
            forceMount hidden panels exist so each trigger's aria-controls resolves to a real
            id (axe aria-valid-attr-value), with no visual or behavior change.
            FUTURE tech-debt: migrate to ToggleGroup (proper toggle semantics, no panel contract). */}
        <TabsContent value="week" forceMount className="hidden" />
        <TabsContent value="month" forceMount className="hidden" />
      </Tabs>

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
