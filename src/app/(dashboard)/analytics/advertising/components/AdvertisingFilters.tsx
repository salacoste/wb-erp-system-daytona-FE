'use client'

import { useMemo } from 'react'
import { format, parse, differenceInDays, subDays } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ViewByToggle } from './ViewByToggle'
import type { ViewByMode } from '@/types/advertising-analytics'

/**
 * Props for AdvertisingFilters component
 */
interface AdvertisingFiltersProps {
  /** Current date range selection */
  dateRange: {
    from: string // YYYY-MM-DD
    to: string // YYYY-MM-DD
  }
  /** Callback when date range changes */
  onDateRangeChange: (from: string, to: string) => void
  /** Current view mode */
  viewBy: ViewByMode
  /** Callback when view mode changes */
  onViewByChange: (view: ViewByMode) => void
}

/** Max allowed date range in days (AC3) */
const MAX_RANGE_DAYS = 90

/**
 * Advertising Filters Component
 * Story 33.2-FE: Advertising Analytics Page Layout
 * Epic 33: Advertising Analytics (Frontend)
 *
 * Features:
 * - Date range picker with validation (AC3)
 * - View mode toggle: SKU | Campaign | Brand | Category (AC4)
 * - Keyboard accessible (AC8)
 */
export function AdvertisingFilters({
  dateRange,
  onDateRangeChange,
  viewBy,
  onViewByChange,
}: AdvertisingFiltersProps) {
  // Parse dates for validation
  const fromDate = useMemo(
    () => parse(dateRange.from, 'yyyy-MM-dd', new Date()),
    [dateRange.from]
  )
  const toDate = useMemo(
    () => parse(dateRange.to, 'yyyy-MM-dd', new Date()),
    [dateRange.to]
  )

  // Validation: check if range exceeds max
  const rangeExceedsMax = useMemo(() => {
    return differenceInDays(toDate, fromDate) > MAX_RANGE_DAYS
  }, [fromDate, toDate])

  // Yesterday as max date (sync delay)
  const maxDateStr = format(subDays(new Date(), 1), 'yyyy-MM-dd')

  // Handle from date change
  const handleFromChange = (value: string) => {
    if (!value) return

    const newFromDate = parse(value, 'yyyy-MM-dd', new Date())
    const currentToDate = parse(dateRange.to, 'yyyy-MM-dd', new Date())

    // Ensure to >= from (AC3)
    if (value > dateRange.to) {
      onDateRangeChange(value, value)
      return
    }

    // Auto-correct if range exceeds 90 days
    const daysDiff = differenceInDays(currentToDate, newFromDate)
    if (daysDiff > MAX_RANGE_DAYS) {
      // Keep the most recent 90 days from 'to' date
      const correctedFrom = format(subDays(currentToDate, MAX_RANGE_DAYS), 'yyyy-MM-dd')
      onDateRangeChange(correctedFrom, dateRange.to)
    } else {
      onDateRangeChange(value, dateRange.to)
    }
  }

  // Handle to date change
  const handleToChange = (value: string) => {
    if (!value) return

    const newToDate = parse(value, 'yyyy-MM-dd', new Date())
    const currentFromDate = parse(dateRange.from, 'yyyy-MM-dd', new Date())

    // Ensure to >= from (AC3)
    if (value < dateRange.from) {
      onDateRangeChange(value, value)
      return
    }

    // Auto-correct if range exceeds 90 days
    const daysDiff = differenceInDays(newToDate, currentFromDate)
    if (daysDiff > MAX_RANGE_DAYS) {
      // Keep the most recent 90 days from new 'to' date
      const correctedFrom = format(subDays(newToDate, MAX_RANGE_DAYS), 'yyyy-MM-dd')
      onDateRangeChange(correctedFrom, value)
    } else {
      onDateRangeChange(dateRange.from, value)
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 bg-muted/30 rounded-lg border">
      {/* Date Range Picker (AC3) */}
      <div className="flex items-end gap-2">
        {/* From Date */}
        <div className="space-y-1.5">
          <Label htmlFor="date-from" className="text-xs">
            С
          </Label>
          <Input
            id="date-from"
            type="date"
            value={dateRange.from}
            onChange={(e) => handleFromChange(e.target.value)}
            max={dateRange.to}
            className="w-36"
            aria-label="Дата начала периода"
          />
        </div>

        <span className="text-muted-foreground pb-2" aria-hidden="true">
          —
        </span>

        {/* To Date */}
        <div className="space-y-1.5">
          <Label htmlFor="date-to" className="text-xs">
            По
          </Label>
          <Input
            id="date-to"
            type="date"
            value={dateRange.to}
            onChange={(e) => handleToChange(e.target.value)}
            min={dateRange.from}
            max={maxDateStr}
            className="w-36"
            aria-label="Дата окончания периода"
          />
        </div>

        {/* Range validation warning */}
        {rangeExceedsMax && (
          <span className="text-xs text-destructive pb-2">
            Максимум {MAX_RANGE_DAYS} дней
          </span>
        )}
      </div>

      {/* View Mode Toggle (AC4) */}
      <div className="ml-auto">
        <ViewByToggle
          viewBy={viewBy}
          onViewByChange={onViewByChange}
        />
      </div>
    </div>
  )
}
