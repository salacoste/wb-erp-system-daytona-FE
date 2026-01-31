/**
 * Historical Trends Section Component
 * Story 63.12-FE: Historical Trends Dashboard Section
 *
 * Collapsible section with multi-metric trend chart and summary statistics.
 *
 * @see docs/stories/epic-63/story-63.12-fe-historical-trends-section.md
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronUp, ChevronDown, RefreshCw, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { TrendsPeriodSelector, type TrendsPeriod } from './TrendsPeriodSelector'
import { TrendsChart } from './TrendsChart'
import { TrendsLegend } from './TrendsLegend'
import { TrendsSummaryGrid } from './TrendsSummaryGrid'
import { TrendsChartSkeleton } from './TrendsChartSkeleton'
import { useTrendsData } from '@/hooks/useTrendsData'
import {
  TRENDS_STORAGE_KEYS,
  DEFAULT_VISIBLE_TRENDS_METRICS,
  type TrendsMetricKey,
} from './trends-config'
import { cn } from '@/lib/utils'

export interface HistoricalTrendsSectionProps {
  /** Current week in ISO format */
  currentWeek: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Historical trends section with collapsible content
 */
export function HistoricalTrendsSection({
  currentWeek,
  className,
}: HistoricalTrendsSectionProps): React.ReactElement {
  // Expanded state with localStorage
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem(TRENDS_STORAGE_KEYS.expanded)
    return stored !== null ? JSON.parse(stored) : true
  })

  // Period state with localStorage
  const [weeks, setWeeks] = useState<TrendsPeriod>(() => {
    if (typeof window === 'undefined') return 8
    const stored = localStorage.getItem(TRENDS_STORAGE_KEYS.period)
    return stored ? (parseInt(stored) as TrendsPeriod) : 8
  })

  // Visible metrics state
  const [visibleMetrics, setVisibleMetrics] = useState<Set<TrendsMetricKey>>(() => {
    if (typeof window === 'undefined') return DEFAULT_VISIBLE_TRENDS_METRICS
    const stored = localStorage.getItem(TRENDS_STORAGE_KEYS.metrics)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        return new Set(parsed as TrendsMetricKey[])
      } catch {
        return DEFAULT_VISIBLE_TRENDS_METRICS
      }
    }
    return DEFAULT_VISIBLE_TRENDS_METRICS
  })

  // Persist states
  useEffect(() => {
    localStorage.setItem(TRENDS_STORAGE_KEYS.expanded, JSON.stringify(isExpanded))
  }, [isExpanded])

  useEffect(() => {
    localStorage.setItem(TRENDS_STORAGE_KEYS.period, String(weeks))
  }, [weeks])

  useEffect(() => {
    localStorage.setItem(TRENDS_STORAGE_KEYS.metrics, JSON.stringify(Array.from(visibleMetrics)))
  }, [visibleMetrics])

  // Fetch trends data
  const { data, isLoading, error, refetch } = useTrendsData({
    currentWeek,
    weeks,
    enabled: isExpanded,
  })

  // Toggle metric visibility
  const toggleMetric = useCallback((metric: TrendsMetricKey) => {
    setVisibleMetrics(prev => {
      const next = new Set(prev)
      if (next.has(metric) && next.size > 1) {
        next.delete(metric)
      } else {
        next.add(metric)
      }
      return next
    })
  }, [])

  return (
    <Card className={cn('transition-all duration-300', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h2 className="text-lg font-semibold">Исторические тренды</h2>
        <div className="flex items-center gap-4">
          <TrendsPeriodSelector value={weeks} onChange={setWeeks} disabled={!isExpanded} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded((prev: boolean) => !prev)}
            aria-expanded={isExpanded}
            aria-controls="trends-content"
            aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <Collapsible open={isExpanded}>
        <CollapsibleContent id="trends-content">
          <CardContent className="pt-0">
            {isLoading ? (
              <TrendsChartSkeleton />
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Ошибка загрузки данных трендов</span>
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Повторить
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <TrendsChart data={data?.data || []} visibleMetrics={visibleMetrics} />
                <TrendsLegend
                  visibleMetrics={visibleMetrics}
                  onToggle={toggleMetric}
                  className="mt-4"
                />
                <TrendsSummaryGrid
                  summary={data?.summary}
                  visibleMetrics={visibleMetrics}
                  className="mt-4"
                />
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
