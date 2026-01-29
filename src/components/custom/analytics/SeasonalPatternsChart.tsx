'use client'

/**
 * SeasonalPatternsChart Component
 * Story 51.6-FE: Seasonal Patterns Components
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Bar chart visualization with tabs for monthly/weekly/quarterly seasonal patterns.
 */

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { cn } from '@/lib/utils'
import { useFbsSeasonal } from '@/hooks/useFbsAnalytics'
import { SeasonalPatternTooltip } from './SeasonalPatternTooltip'
import {
  SeasonalChartLoading,
  SeasonalChartError,
  SeasonalChartEmpty,
  CHART_TITLE,
  DEFAULT_HEIGHT,
  TAB_CONFIG,
  WEEK_ORDER,
  BAR_COLOR_DEFAULT,
  BAR_COLOR_PEAK,
  BAR_COLOR_LOW,
  getMonthLabel,
  getDayLabel,
  getQuarterLabel,
} from './SeasonalChartStates'
import { formatNumber } from '@/lib/fbs-analytics-utils'
import type {
  SeasonalViewType,
  MonthlyPattern,
  WeekdayPattern,
  QuarterlyPattern,
} from '@/types/fbs-analytics'

// ============================================================================
// Component Props
// ============================================================================

interface SeasonalPatternsChartProps {
  /** Number of months to analyze (default: 12) */
  months?: number
  /** Optional height in pixels (default: 350) */
  height?: number
  /** Additional class names */
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export function SeasonalPatternsChart({
  months = 12,
  height = DEFAULT_HEIGHT,
  className,
}: SeasonalPatternsChartProps) {
  const [view, setView] = useState<SeasonalViewType>('monthly')
  const { data, isLoading, error, refetch } = useFbsSeasonal({ months, view })

  const handleViewChange = useCallback((newView: string) => {
    setView(newView as SeasonalViewType)
  }, [])

  const chartData = useMemo(() => {
    if (!data?.patterns) return []

    if (view === 'monthly' && data.patterns.monthly) {
      return data.patterns.monthly.map((p: MonthlyPattern) => ({
        name: getMonthLabel(p.month),
        value: p.avgOrders,
        revenue: p.avgRevenue,
        original: p.month,
      }))
    }

    if (view === 'weekly' && data.patterns.weekday) {
      const sorted = [...data.patterns.weekday].sort(
        (a: WeekdayPattern, b: WeekdayPattern) =>
          WEEK_ORDER.indexOf(a.dayOfWeek) - WEEK_ORDER.indexOf(b.dayOfWeek)
      )
      return sorted.map((p: WeekdayPattern) => ({
        name: getDayLabel(p.dayOfWeek),
        value: p.avgOrders,
        original: p.dayOfWeek,
      }))
    }

    if (view === 'quarterly' && data.patterns.quarterly) {
      return data.patterns.quarterly.map((p: QuarterlyPattern) => ({
        name: p.quarter,
        label: getQuarterLabel(p.quarter),
        value: p.avgOrders,
        revenue: p.avgRevenue,
        original: p.quarter,
      }))
    }

    return []
  }, [data, view])

  const { peakValue, lowValue } = useMemo(() => {
    if (chartData.length === 0) return { peakValue: 0, lowValue: 0 }
    const values = chartData.map(d => d.value)
    return { peakValue: Math.max(...values), lowValue: Math.min(...values) }
  }, [chartData])

  const getBarColor = useCallback(
    (value: number) => {
      if (value === peakValue) return BAR_COLOR_PEAK
      if (value === lowValue) return BAR_COLOR_LOW
      return BAR_COLOR_DEFAULT
    },
    [peakValue, lowValue]
  )

  if (isLoading) return <SeasonalChartLoading className={className} height={height} />
  if (error) return <SeasonalChartError className={className} onRetry={() => refetch()} />
  if (chartData.length === 0) {
    return <SeasonalChartEmpty className={className} view={view} onViewChange={handleViewChange} />
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-lg">{CHART_TITLE}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={view} onValueChange={handleViewChange}>
          <TabsList>
            {TAB_CONFIG.map(t => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {TAB_CONFIG.map(t => (
            <TabsContent key={t.value} value={t.value}>
              <div aria-label={`График сезонности: ${t.label}`} role="img">
                <ResponsiveContainer width="100%" height={height}>
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={formatNumber} tick={{ fontSize: 12 }} />
                    <Tooltip content={<SeasonalPatternTooltip view={view} />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
