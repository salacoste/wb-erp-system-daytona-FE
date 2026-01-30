'use client'

import React, { useMemo, useState } from 'react'
import { subDays, format, min, max } from 'date-fns'
import { Calendar, Megaphone, Info } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

/** Date range with ISO date strings */
export interface DateRange {
  /** Start date in YYYY-MM-DD format */
  from: string
  /** End date in YYYY-MM-DD format */
  to: string
}

export interface AdvertisingEmptyStateProps {
  /** Available date range from database */
  availableRange?: DateRange
  /** Requested date range from user query */
  requestedRange?: DateRange
  /** Loading state indicator */
  isLoading?: boolean
  /** Callback when user selects a different date range */
  onDateRangeChange?: (range: DateRange) => void
  /** Additional class names */
  className?: string
}

/** Predefined period option */
type PeriodOption = '7d' | '14d' | '30d'

interface PeriodOptionConfig {
  value: PeriodOption
  label: string
  days: number
}

// ============================================================================
// Constants
// ============================================================================

/** Predefined period options (sorted by duration) */
const PERIOD_OPTIONS: PeriodOptionConfig[] = [
  { value: '7d', label: 'Последние 7 дней', days: 7 },
  { value: '14d', label: 'Последние 14 дней', days: 14 },
  { value: '30d', label: 'Последние 30 дней', days: 30 },
]

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate predefined date ranges that fit within available range.
 * Filters out ranges that would extend beyond available data.
 *
 * @param availableRange - Available data range from database
 * @returns Array of valid period options with their date ranges
 *
 * @example
 * // Available: 2025-12-01 to 2026-01-28, today is 2026-01-30
 * getPredefinedRanges({ from: '2025-12-01', to: '2026-01-28' })
 * // Returns all three options if they fit
 */
function getPredefinedRanges(
  availableRange?: DateRange
): Array<PeriodOptionConfig & { dateRange: DateRange }> {
  if (!availableRange) {
    return []
  }

  const today = new Date()
  const yesterday = subDays(today, 1) // Account for sync delay
  const availableFrom = new Date(availableRange.from)
  const availableTo = new Date(availableRange.to)

  return PERIOD_OPTIONS.map(option => {
    const to = yesterday
    const from = subDays(to, option.days)

    // Clamp range to available bounds
    const clampedFrom = max([from, availableFrom])
    const clampedTo = min([to, availableTo])

    return {
      ...option,
      dateRange: {
        from: format(clampedFrom, 'yyyy-MM-dd'),
        to: format(clampedTo, 'yyyy-MM-dd'),
      },
    }
  }).filter(option => {
    // Only include if range has meaningful overlap with available data
    const rangeStart = new Date(option.dateRange.from)
    const rangeEnd = new Date(option.dateRange.to)
    const daysInRange = Math.ceil(
      (rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysInRange >= 3 // Minimum 3 days of data required
  })
}

/**
 * Get period label in Russian
 */
function getPeriodLabel(period: PeriodOption): string {
  switch (period) {
    case '7d':
      return '7 дней'
    case '14d':
      return '14 дней'
    case '30d':
      return '30 дней'
  }
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Advertising Empty State Component
 *
 * Displays when no advertising data is available for the selected period.
 * Shows available data range and offers predefined period selection.
 *
 * Features:
 * - Displays available date range from database
 * - Smart predefined ranges (7d, 14d, 30d) filtered to available data
 * - Tooltip with helpful information about data updates
 * - WCAG 2.1 AA compliant
 *
 * Usage:
 * ```tsx
 * <AdvertisingEmptyState
 *   availableRange={{ from: '2025-12-01', to: '2026-01-28' }}
 *   onDateRangeChange={(range) => console.log(range)}
 * />
 * ```
 *
 * Story 33.7-FE: Dashboard Widget
 * Story 60.6-FE: Sync with Global Dashboard Period
 */
export function AdvertisingEmptyState({
  availableRange,
  requestedRange: _requestedRange,
  isLoading = false,
  onDateRangeChange,
  className,
}: AdvertisingEmptyStateProps) {
  // Generate valid predefined ranges
  const predefinedRanges = useMemo(() => getPredefinedRanges(availableRange), [availableRange])

  // Default to first available option (usually 7d)
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption | null>(
    predefinedRanges.length > 0 ? predefinedRanges[0].value : null
  )

  /**
   * Handle period selection change
   */
  const handlePeriodChange = (value: string) => {
    const period = value as PeriodOption
    setSelectedPeriod(period)

    const selectedOption = predefinedRanges.find(opt => opt.value === period)
    if (selectedOption && onDateRangeChange) {
      onDateRangeChange(selectedOption.dateRange)
    }
  }

  // Format available range for display
  const availableRangeText = availableRange
    ? `с ${formatDate(availableRange.from)} по ${formatDate(availableRange.to)}`
    : ''

  return (
    <TooltipProvider>
      <Card className={cn('p-6', className)} data-testid="advertising-empty-state">
        {/* Header with icon and title */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
            <Calendar className="h-5 w-5 text-blue-600" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Нет данных за выбранный период</h3>
            <p className="text-sm text-gray-600 mt-1">
              Выберите другой период для просмотра рекламы
            </p>
          </div>
        </div>

        {/* Available data range */}
        {availableRange && (
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-700">
            <Megaphone className="h-4 w-4 text-gray-500" aria-hidden="true" />
            <span>Данные {availableRangeText}</span>
            {/* Info tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center"
                  aria-label="Информация о данных рекламы"
                >
                  <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Данные о рекламных расходах обновляются ежедневно.</p>
                  <p className="text-xs text-gray-600">
                    Если вы запустили рекламу, но данные не отображаются:
                  </p>
                  <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                    <li>Убедитесь, что кампании активны</li>
                    <li>Проверьте настройки интеграции с Wildberries</li>
                    <li>Данные могут появляться с задержкой до 24 часов</li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Period selector with predefined ranges */}
        {predefinedRanges.length > 0 && (
          <div className="space-y-2">
            <label htmlFor="period-select" className="text-sm font-medium text-gray-700">
              Выбрать период
            </label>
            <Select
              value={selectedPeriod ?? undefined}
              onValueChange={handlePeriodChange}
              disabled={isLoading}
            >
              <SelectTrigger
                id="period-select"
                className="w-full"
                aria-label="Выбрать период для просмотра рекламы"
              >
                <SelectValue placeholder="Выберите период" />
              </SelectTrigger>
              <SelectContent>
                {predefinedRanges.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-gray-500" aria-hidden="true" />
                      <span>{option.label}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {getPeriodLabel(option.value)}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* No data available message */}
        {predefinedRanges.length === 0 && availableRange && (
          <div className="text-sm text-gray-600">Нет доступных данных для отображения</div>
        )}
      </Card>
    </TooltipProvider>
  )
}

export default AdvertisingEmptyState
