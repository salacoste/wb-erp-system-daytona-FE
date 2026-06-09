'use client'

/**
 * Advertising Filters Component
 * Story 33.2-FE: Advertising Analytics Page Layout
 * Epic 33: Advertising Analytics (Frontend)
 *
 * Features:
 * - Date range picker with validation (AC3)
 * - Data availability constraints from sync status
 * - View mode toggle: SKU | Campaign | Brand | Category (AC4)
 * - Keyboard accessible (AC8)
 */

import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ViewByToggle } from './ViewByToggle'
import type { ViewByMode } from '@/types/advertising-analytics'
import {
  MAX_RANGE_DAYS,
  isRangeExceedsMax,
  getEffectiveDateBounds,
  handleFromDateChange,
  handleToDateChange,
} from './advertising-filter-handlers'

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
  /** Earliest date with advertising data (from sync status) */
  dataAvailableFrom?: string | null
  /** Latest date with advertising data (from sync status) */
  dataAvailableTo?: string | null
}

export function AdvertisingFilters({
  dateRange,
  onDateRangeChange,
  viewBy,
  onViewByChange,
  dataAvailableFrom,
  dataAvailableTo,
}: AdvertisingFiltersProps) {
  const rangeExceedsMax = useMemo(
    () => isRangeExceedsMax(dateRange.from, dateRange.to),
    [dateRange.from, dateRange.to]
  )

  const { min: effectiveMinDate, max: effectiveMaxDate } = getEffectiveDateBounds(
    dataAvailableFrom,
    dataAvailableTo
  )

  return (
    <div className="flex flex-col gap-4 p-4 bg-muted/30 rounded-lg border sm:flex-row sm:flex-wrap sm:items-end">
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
            onChange={e => handleFromDateChange(e.target.value, dateRange.to, onDateRangeChange)}
            min={effectiveMinDate}
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
            onChange={e => handleToDateChange(e.target.value, dateRange.from, onDateRangeChange)}
            min={dateRange.from}
            max={effectiveMaxDate}
            className="w-36"
            aria-label="Дата окончания периода"
          />
        </div>

        {/* Range validation warning */}
        {rangeExceedsMax && (
          <span className="text-xs text-destructive pb-2">Максимум {MAX_RANGE_DAYS} дней</span>
        )}
      </div>

      {/* Data availability hint */}
      {dataAvailableFrom && (
        <span className="text-xs text-muted-foreground pb-2">
          Данные: с {new Date(dataAvailableFrom).toLocaleDateString('ru-RU')}
          {dataAvailableTo && ` по ${new Date(dataAvailableTo).toLocaleDateString('ru-RU')}`}
        </span>
      )}

      {/* View Mode Toggle (AC4) */}
      <div className="ml-auto">
        <ViewByToggle viewBy={viewBy} onViewByChange={onViewByChange} />
      </div>
    </div>
  )
}
