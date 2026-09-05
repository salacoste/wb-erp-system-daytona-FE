'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Megaphone, ArrowRight, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useAdvertisingAnalytics } from '@/hooks/useAdvertisingAnalytics'
import { useAdvertisingEmptyState } from '@/hooks/useAdvertisingEmptyState'
import { AdvertisingEmptyState } from './AdvertisingEmptyState'
import { WidgetSkeleton, WidgetError } from './advertising-widget/AdvertisingWidgetStates'
import { AdvertisingMetricsGrid } from './advertising-widget/AdvertisingMetricsGrid'
import {
  type PeriodOption,
  type AdvertisingDashboardWidgetProps,
  getPeriodLabel,
  calculateInternalDateRange,
} from './advertising-widget/advertising-widget-helpers'

// Re-export props type for consumers
export type { AdvertisingDashboardWidgetProps }

// ============================================================================
// Main Component
// ============================================================================

/**
 * Advertising Dashboard Widget
 *
 * Story 33.7-FE: Dashboard Widget
 * Story 60.6-FE: Sync with Global Dashboard Period
 *
 * Features:
 * - Compact metrics display: Total Sales, Organic %, ROAS
 * - Period selector: 7d / 14d / 30d (hidden when externally controlled)
 * - ROAS color-coded by value
 * - Organic contribution percentage
 * - Link to full analytics page
 * - Loading & error states
 *
 * Usage:
 * - Dashboard: Pass dateRange and hideLocalSelector={true} for global period sync
 * - Standalone: No props needed, uses internal period selector
 *
 * @example
 * // On dashboard with global period
 * <AdvertisingDashboardWidget dateRange={{ from: '2026-01-27', to: '2026-02-02' }} hideLocalSelector />
 *
 * @example
 * // Standalone on analytics page
 * <AdvertisingDashboardWidget />
 */
export function AdvertisingDashboardWidget({
  className,
  dateRange: externalDateRange,
  hideLocalSelector = false,
  onDateRangeChange,
}: AdvertisingDashboardWidgetProps) {
  // Internal period state as fallback for standalone mode
  const [internalPeriod, setInternalPeriod] = useState<PeriodOption>('7d')

  // Determine if externally controlled
  const isControlled = !!externalDateRange

  // Use external range if provided, otherwise calculate from internal state
  const dateRange = useMemo(() => {
    if (externalDateRange) {
      return externalDateRange
    }
    return calculateInternalDateRange(internalPeriod)
  }, [externalDateRange, internalPeriod])

  // Fetch advertising analytics (only need summary)
  const { data, isLoading, error, refetch } = useAdvertisingAnalytics(
    {
      from: dateRange.from,
      to: dateRange.to,
      limit: 1, // Only need summary, not individual items
    },
    {
      // Short stale time for dashboard (30s)
      refetchInterval: undefined,
    }
  )

  // Detect empty state using custom hook (refactor phase)
  const { isEmpty, availableRange } = useAdvertisingEmptyState(data)

  // Loading state
  if (isLoading) {
    return <WidgetSkeleton className={className} />
  }

  // Error state
  if (error) {
    return <WidgetError className={className} onRetry={() => refetch()} />
  }

  // Empty state component
  if (isEmpty) {
    return (
      <AdvertisingEmptyState
        availableRange={availableRange}
        requestedRange={dateRange}
        onDateRangeChange={range => {
          if (onDateRangeChange) {
            onDateRangeChange(range)
          }
          // Refetch data with new range
          refetch()
        }}
        className={className}
      />
    )
  }

  // At this point, data must exist and have a summary (isEmpty is false)
  const { summary } = data!

  // Determine whether to show local selector (AC1, AC4, AC5, AC6)
  // Show only when NOT externally controlled AND hideLocalSelector is false
  const showLocalSelector = !isControlled && !hideLocalSelector

  return (
    <Card className={cn('p-4', className)} data-testid="advertising-widget">
      {/* Header with title and optional period selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-status-information" aria-hidden="true" />
          <h3 className="font-semibold">Реклама</h3>
        </div>
        {/* Local selector only shown in standalone mode (AC1, AC4, AC5, AC6) */}
        {showLocalSelector && (
          <Select value={internalPeriod} onValueChange={v => setInternalPeriod(v as PeriodOption)}>
            <SelectTrigger className="w-24 h-8" aria-label="Выбрать период">
              <SelectValue>{getPeriodLabel(internalPeriod)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 дней</SelectItem>
              <SelectItem value="14d">14 дней</SelectItem>
              <SelectItem value="30d">30 дней</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Compact metrics grid */}
      <AdvertisingMetricsGrid summary={summary} />

      {/* Current Week Indicator */}
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Включает текущую неделю (обновляется ежедневно)</span>
      </div>

      {/* Link to full analytics page */}
      <div className="mt-2">
        <Link
          href="/analytics/advertising"
          className="text-sm text-primary hover:underline inline-flex items-center"
        >
          Подробная аналитика
          <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </Card>
  )
}
