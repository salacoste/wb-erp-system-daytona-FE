'use client'

/**
 * Orders Seasonal Patterns Component
 * Story 63.8-FE: Orders Seasonal Patterns Analysis
 * Epic 63 - Dashboard Enhancements (Orders Analytics)
 *
 * Displays seasonal order patterns with monthly and weekday charts.
 * Shows insights summary and supports period selection.
 *
 * Note: This story is DEFERRED - requires 30+ days of data
 *
 * @see docs/stories/epic-63/story-63.8-fe-orders-seasonal-patterns.md
 */

import { useState } from 'react'
import { Info, AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useSeasonalPatterns } from '@/hooks/useSeasonalPatterns'
import { SeasonalInsightsCard } from './SeasonalInsightsCard'
import { MonthlyPatternsChart } from './MonthlyPatternsChart'
import { WeekdayPatternsChart } from './WeekdayPatternsChart'

export interface OrdersSeasonalPatternsProps {
  /** Additional CSS classes */
  className?: string
  /** Default months for analysis */
  defaultMonths?: number
}

type PeriodOption = 4 | 12 | 24

const PERIOD_OPTIONS: { value: PeriodOption; label: string }[] = [
  { value: 4, label: '4W' },
  { value: 12, label: '12W' },
  { value: 24, label: '24W' },
]

/**
 * Seasonal patterns section with insights and charts
 */
export function OrdersSeasonalPatterns({
  className,
  defaultMonths = 12,
}: OrdersSeasonalPatternsProps) {
  const [months, setMonths] = useState<PeriodOption>(defaultMonths as PeriodOption)

  const { data, isLoading, error, refetch } = useSeasonalPatterns({ months })

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn('min-h-[500px]', className)}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-56" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[250px] w-full rounded-lg" />
            <Skeleton className="h-[250px] w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('min-h-[300px]', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Сезонные паттерны заказов</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Ошибка загрузки данных</span>
              <Button variant="ghost" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-1 h-3 w-3" />
                Повторить
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Empty state - insufficient data
  if (!data || data.patterns.monthly.length === 0) {
    return (
      <Card className={cn('min-h-[300px]', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            Сезонные паттерны заказов
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Анализ сезонности требует минимум 30 дней данных</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[200px] text-center">
          <Info className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            Недостаточно данных для анализа сезонности
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Требуется минимум 30 дней истории заказов
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('min-h-[500px]', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            Сезонные паттерны заказов
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Анализ распределения заказов по месяцам и дням недели</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          {/* Period selector */}
          <div className="inline-flex rounded-md border border-gray-200" role="radiogroup">
            {PERIOD_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={months === option.value}
                onClick={() => setMonths(option.value)}
                className={cn(
                  'px-3 py-1 text-xs font-medium transition-colors',
                  option.value === 4 && 'rounded-l-md',
                  option.value === 24 && 'rounded-r-md',
                  months === option.value
                    ? 'bg-[#E53935] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Insights Summary */}
        <SeasonalInsightsCard
          insights={data.insights}
          monthlyData={data.patterns.monthly}
          weekdayData={data.patterns.weekday}
        />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthlyPatternsChart
            data={data.patterns.monthly}
            peakMonth={data.insights.peakMonth}
            lowMonth={data.insights.lowMonth}
          />
          <WeekdayPatternsChart data={data.patterns.weekday} peakDay={data.insights.peakDay} />
        </div>
      </CardContent>
    </Card>
  )
}
