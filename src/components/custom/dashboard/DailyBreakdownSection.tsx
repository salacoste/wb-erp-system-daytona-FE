'use client'

/**
 * DailyBreakdownSection Component
 * Story 62.9-FE: Chart/Table View Toggle
 *
 * Wrapper component orchestrating chart, table, legend, and view toggle
 * for the daily breakdown section of the dashboard.
 *
 * @see docs/stories/epic-62/story-62.9-fe-chart-table-view-toggle.md
 */

import { cn } from '@/lib/utils'
import { useViewPreference } from '@/hooks/useViewPreference'
import { useLegendPreferences } from '@/hooks/useLegendPreferences'
import { useDashboardPeriod } from '@/hooks/useDashboardPeriod'
import { useDailyMetrics } from '@/hooks/useDailyMetrics'
import { weekToDateRange, monthToDateRange } from '@/lib/date-utils'
import { ViewToggle } from './ViewToggle'
import { DailyBreakdownChart } from './DailyBreakdownChart'
import { DailyMetricsTable } from './DailyMetricsTable'
import { MetricLegend } from './MetricLegend'

export interface DailyBreakdownSectionProps {
  /** Additional CSS classes */
  className?: string
}

/**
 * Daily breakdown section with view toggle.
 *
 * Orchestrates:
 * - ViewToggle for chart/table switching
 * - DailyBreakdownChart for visual representation
 * - DailyMetricsTable for tabular data
 * - MetricLegend for interactive series visibility
 *
 * @example
 * <DailyBreakdownSection className="mt-8" />
 */
export function DailyBreakdownSection({ className }: DailyBreakdownSectionProps) {
  const [view, setView] = useViewPreference()
  const { visibleSeries, toggleSeries, showAll, hideAll } = useLegendPreferences()
  const { selectedWeek, selectedMonth, periodType } = useDashboardPeriod()

  // Get selected period based on type
  const selectedPeriod = periodType === 'week' ? selectedWeek : selectedMonth

  // Convert period to date range
  const dateRange =
    periodType === 'week' ? weekToDateRange(selectedPeriod) : monthToDateRange(selectedPeriod)

  // Fetch daily metrics
  const { data, isLoading, error } = useDailyMetrics(
    {
      from: dateRange.from,
      to: dateRange.to,
      mode: periodType,
    },
    { enabled: !!selectedPeriod }
  )

  return (
    <section className={cn('space-y-4', className)} aria-labelledby="daily-breakdown-title">
      {/* Header with title and view toggle */}
      <div className="flex items-center justify-between">
        <h3 id="daily-breakdown-title" className="text-lg font-semibold text-gray-900">
          Детализация по дням
        </h3>
        <ViewToggle value={view} onChange={setView} />
      </div>

      {/* Content area with transition */}
      <div className="min-h-[300px]">
        {view === 'chart' ? (
          <div className="transition-opacity duration-150 ease-in-out" key="chart-view">
            <DailyBreakdownChart
              data={data ?? []}
              periodType={periodType}
              visibleSeries={visibleSeries}
              isLoading={isLoading}
              error={error}
            />
          </div>
        ) : (
          <div className="transition-opacity duration-150 ease-in-out" key="table-view">
            <DailyMetricsTable
              data={data ?? []}
              periodType={periodType}
              isLoading={isLoading}
              error={error}
            />
          </div>
        )}
      </div>

      {/* Legend area (chart view only) */}
      {view === 'chart' && (
        <div className="border-t pt-4">
          <MetricLegend
            visibleSeries={visibleSeries}
            onSeriesToggle={toggleSeries}
            onShowAll={showAll}
            onHideAll={hideAll}
          />
        </div>
      )}
    </section>
  )
}
