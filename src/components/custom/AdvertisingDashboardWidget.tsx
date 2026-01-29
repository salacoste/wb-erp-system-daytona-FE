'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { format, subDays } from 'date-fns'
import { Megaphone, ArrowRight, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useAdvertisingAnalytics } from '@/hooks/useAdvertisingAnalytics'

// ============================================================================
// Types
// ============================================================================

type PeriodOption = '7d' | '14d' | '30d'

/** Date range with ISO date strings */
interface DateRange {
  /** Start date in YYYY-MM-DD format */
  from: string
  /** End date in YYYY-MM-DD format */
  to: string
}

interface AdvertisingDashboardWidgetProps {
  /** Additional class names */
  className?: string
  /**
   * Date range from parent context.
   * If provided, widget uses this range for API calls instead of internal state.
   * Story 60.6-FE: Sync with global dashboard period.
   */
  dateRange?: DateRange
  /**
   * When true, hide the local period selector.
   * Use when embedded in dashboard with global selector.
   * Story 60.6-FE: Hide when controlled by parent.
   */
  hideLocalSelector?: boolean
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format currency in rubles.
 * Handles undefined/null values gracefully.
 */
function formatCurrency(value: number | undefined | null): string {
  if (value == null || isNaN(value)) {
    return '— ₽'
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}М ₽`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}К ₽`
  }
  return `${value.toFixed(0)} ₽`
}

/**
 * Get ROAS color class based on value.
 * - >= 3.0: Green (excellent)
 * - >= 2.0: Yellow (good)
 * - >= 1.0: Orange (break-even)
 * - < 1.0: Red (loss)
 */
function getRoasColorClass(roas: number | undefined | null): string {
  if (roas == null || isNaN(roas)) return 'text-muted-foreground'
  if (roas >= 3.0) return 'text-green-600'
  if (roas >= 2.0) return 'text-yellow-600'
  if (roas >= 1.0) return 'text-orange-600'
  return 'text-red-600'
}

/**
 * Get period label in Russian.
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

/**
 * Calculate internal date range from period option.
 * Used as fallback when no external dateRange is provided.
 */
function calculateInternalDateRange(period: PeriodOption): DateRange {
  const to = subDays(new Date(), 1) // Yesterday (account for sync delay)
  const days = parseInt(period)
  const from = subDays(to, days)
  return {
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
  }
}

// ============================================================================
// Widget Skeleton Component
// ============================================================================

function WidgetSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('p-4', className)} data-testid="advertising-skeleton">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i}>
            <Skeleton className="h-3 w-12 mb-1" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t">
        <Skeleton className="h-4 w-32" />
      </div>
    </Card>
  )
}

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

  // Loading state
  if (isLoading) {
    return <WidgetSkeleton className={className} />
  }

  // Error state or missing data
  if (error || !data || !data.summary) {
    return (
      <Card className={cn('p-4', className)} data-testid="advertising-widget">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Реклама</h3>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {error ? 'Ошибка загрузки данных' : 'Нет данных'}
          </span>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Повторить
          </Button>
        </div>
      </Card>
    )
  }

  const { summary } = data

  // Determine whether to show local selector (AC1, AC4, AC5, AC6)
  // Show only when NOT externally controlled AND hideLocalSelector is false
  const showLocalSelector = !isControlled && !hideLocalSelector

  return (
    <Card className={cn('p-4', className)} data-testid="advertising-widget">
      {/* Header with title and optional period selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-blue-600" aria-hidden="true" />
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

      {/* Compact metrics grid: Total Sales, Organic %, ROAS */}
      <div className="grid grid-cols-3 gap-4">
        {/* Total Sales (organic + advertising) */}
        <div>
          <p className="text-xs text-muted-foreground">Продажи</p>
          <p className="text-lg font-bold">{formatCurrency(summary.total_sales)}</p>
        </div>

        {/* Organic Contribution % */}
        <div>
          <p className="text-xs text-muted-foreground">Органика</p>
          <p className="text-lg font-bold text-green-600">
            {summary.avg_organic_contribution != null
              ? `${summary.avg_organic_contribution.toFixed(0)}%`
              : '—'}
          </p>
        </div>

        {/* Overall ROAS with color coding */}
        <div>
          <p className="text-xs text-muted-foreground">ROAS</p>
          <p className={cn('text-lg font-bold', getRoasColorClass(summary.overall_roas))}>
            {summary.overall_roas != null ? `${summary.overall_roas.toFixed(1)}x` : '—'}
          </p>
        </div>
      </div>

      {/* Current Week Indicator */}
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Включает текущую неделю (обновляется ежедневно)</span>
      </div>

      {/* Link to full analytics page */}
      <div className="mt-4 pt-4 border-t">
        <Link
          href="/analytics/advertising"
          className="text-sm text-blue-600 hover:underline inline-flex items-center"
        >
          Подробная аналитика
          <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </Card>
  )
}
