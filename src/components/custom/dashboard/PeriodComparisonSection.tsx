/**
 * Period Comparison Section Component
 * Story 63.11-FE: WoW/MoM Period Comparison Cards
 *
 * Main section displaying 6 comparison metric cards with WoW/MoM toggle.
 *
 * @see docs/stories/epic-63/story-63.11-fe-period-comparison-cards.md
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ComparisonModeToggle } from './ComparisonModeToggle'
import { PeriodComparisonCard } from './PeriodComparisonCard'
import { PeriodComparisonSkeleton } from './PeriodComparisonSkeleton'
import { useAnalyticsComparison } from '@/hooks/comparison'
import { useFinancialSummaryWithPeriodComparison } from '@/hooks/useFinancialSummary'
import { calculateDelta } from '@/lib/api/analytics-comparison'
import {
  getComparisonPeriods,
  formatPeriodLabel,
  COMPARISON_MODE_STORAGE_KEY,
  type ComparisonMode,
} from '@/lib/period-comparison-helpers'
import { cn } from '@/lib/utils'
import {
  formatMonthLabel,
  getPreviousMonth,
  getSummaryValue,
  MONTH_EXPENSE_METRICS,
  MONTH_TOP_METRICS,
  WEEK_EXPENSE_METRICS,
  WEEK_TOP_METRICS,
  type MetricConfig,
} from './periodComparisonFinancialHelpers'

export interface PeriodComparisonSectionProps {
  /** Dashboard period type. Week preserves WoW/MoM analytics comparison; month uses finance-summary MoM. */
  periodType?: 'week' | 'month'
  /** Current week in ISO format (e.g., "2026-W05") */
  currentWeek: string
  /** Current month in YYYY-MM format. Required when periodType="month". */
  currentMonth?: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Period comparison section with WoW/MoM toggle
 */
export function PeriodComparisonSection({
  periodType = 'week',
  currentWeek,
  currentMonth,
  className,
}: PeriodComparisonSectionProps): React.ReactElement {
  const isMonthMode = periodType === 'month'

  // Mode state with localStorage persistence
  const [mode, setMode] = useState<ComparisonMode>(() => {
    if (typeof window === 'undefined') return 'wow'
    const stored = localStorage.getItem(COMPARISON_MODE_STORAGE_KEY)
    return (stored as ComparisonMode) || 'wow'
  })

  // Persist mode preference
  useEffect(() => {
    localStorage.setItem(COMPARISON_MODE_STORAGE_KEY, mode)
  }, [mode])

  // Calculate periods based on mode
  const { period1, period2 } = useMemo(
    () => getComparisonPeriods(currentWeek, mode),
    [currentWeek, mode]
  )

  // Fetch comparison data
  const { data, isLoading, error, refetch } = useAnalyticsComparison({
    period1,
    period2,
    enabled: !isMonthMode && !!currentWeek,
  })
  const isSingleWeekComparison = !period1.includes(':') && !period2.includes(':')
  const financeComparison = useFinancialSummaryWithPeriodComparison({
    periodType: isMonthMode ? 'month' : 'week',
    period: isMonthMode ? (currentMonth ?? '') : period1,
    enabled: isMonthMode ? !!currentMonth : !!currentWeek && isSingleWeekComparison,
  })

  // Format period labels
  const currentLabel = isMonthMode
    ? formatMonthLabel(currentMonth ?? '')
    : formatPeriodLabel(period1)
  const previousLabel = isMonthMode
    ? formatMonthLabel(getPreviousMonth(currentMonth ?? ''))
    : formatPeriodLabel(period2)
  const topMetrics = isMonthMode ? MONTH_TOP_METRICS : WEEK_TOP_METRICS
  const expenseMetrics = isMonthMode ? MONTH_EXPENSE_METRICS : WEEK_EXPENSE_METRICS
  const sectionTitle = isMonthMode ? 'Сравнение месяцев' : 'Сравнение периодов'
  const activeLoading = isMonthMode
    ? financeComparison.isLoading
    : isLoading || (isSingleWeekComparison && financeComparison.isLoading)
  const activeError = isMonthMode ? financeComparison.error : error

  // Loading state
  if (activeLoading) return <PeriodComparisonSkeleton className={className} />

  // Error state
  if (activeError) {
    return (
      <section aria-label={sectionTitle} className={className}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{sectionTitle}</h2>
          {!isMonthMode && <ComparisonModeToggle mode={mode} onChange={setMode} />}
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Ошибка загрузки данных сравнения</span>
            {!isMonthMode && (
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Повторить
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </section>
    )
  }

  const getFinanceFallbackValue = (
    period: 'period1' | 'period2',
    key: MetricConfig['key']
  ): number | null => {
    if (key !== 'logistics' && key !== 'storage') return null

    const summary =
      period === 'period1'
        ? financeComparison.current?.summary_total
        : financeComparison.previous?.summary_total

    if (!summary) return null

    if (key === 'logistics') {
      return summary.logistics_cost_total ?? summary.logistics_cost ?? null
    }

    return summary.storage_cost_total ?? summary.storage_cost ?? null
  }

  // Helper to get metric value
  const getValue = (period: 'period1' | 'period2', key: MetricConfig['key']): number | null => {
    if (isMonthMode) {
      const summary =
        period === 'period1'
          ? financeComparison.current?.summary_total
          : financeComparison.previous?.summary_total
      return getSummaryValue(summary, key)
    }

    const fallback = getFinanceFallbackValue(period, key)
    if (fallback != null) return fallback

    if (!data) return null
    return data[period][key] ?? null
  }

  // Helper to get delta
  const getDelta = (key: MetricConfig['key']) => {
    if (isMonthMode) {
      const current = getValue('period1', key)
      const previous = getValue('period2', key)
      return current != null && previous != null ? calculateDelta(current, previous) : null
    }

    const currentFallback = getFinanceFallbackValue('period1', key)
    const previousFallback = getFinanceFallbackValue('period2', key)
    if (currentFallback != null && previousFallback != null) {
      return calculateDelta(currentFallback, previousFallback)
    }

    if (!data?.delta) return null
    return data.delta[key] ?? null
  }

  return (
    <section role="region" aria-label={sectionTitle} className={className}>
      {/* Header with toggle */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{sectionTitle}</h2>
        {!isMonthMode && (
          <ComparisonModeToggle mode={mode} onChange={setMode} disabled={isLoading} />
        )}
      </div>

      {/* Top row: 4 cards (Revenue, Profit, Margin, Orders) */}
      <div className={cn('grid gap-4', 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4')}>
        {topMetrics.map(metric => (
          <PeriodComparisonCard
            key={metric.key}
            title={metric.title}
            currentValue={getValue('period1', metric.key)}
            previousValue={getValue('period2', metric.key)}
            delta={getDelta(metric.key)}
            currentPeriodLabel={currentLabel}
            previousPeriodLabel={previousLabel}
            format={metric.format}
            invertDirection={metric.invertDirection}
          />
        ))}
      </div>

      {/* Bottom row: 2 cards (Logistics, Storage - expenses) */}
      <div className={cn('mt-4 grid gap-4', 'grid-cols-1 md:grid-cols-2')}>
        {expenseMetrics.map(metric => (
          <PeriodComparisonCard
            key={metric.key}
            title={metric.title}
            currentValue={getValue('period1', metric.key)}
            previousValue={getValue('period2', metric.key)}
            delta={getDelta(metric.key)}
            currentPeriodLabel={currentLabel}
            previousPeriodLabel={previousLabel}
            format={metric.format}
            invertDirection={metric.invertDirection}
          />
        ))}
      </div>
    </section>
  )
}
