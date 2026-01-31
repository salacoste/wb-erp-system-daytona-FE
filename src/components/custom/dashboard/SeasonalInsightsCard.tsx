'use client'

/**
 * Seasonal Insights Card Component
 * Story 63.8-FE: Orders Seasonal Patterns Analysis
 * Epic 63 - Dashboard Enhancements (Orders Analytics)
 *
 * Summary card showing peak/low month and peak day insights.
 * Uses colored cards for visual distinction.
 *
 * @see docs/stories/epic-63/story-63.8-fe-orders-seasonal-patterns.md
 */

import { TrendingUp, TrendingDown, CalendarDays, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { localizeMonth, localizeWeekday, formatPeakHour } from '@/lib/seasonal-localization'
import type { MonthlyPattern, WeekdayPattern, SeasonalInsights } from '@/types/orders-volume'

export interface SeasonalInsightsCardProps {
  /** Insights summary from API */
  insights: SeasonalInsights
  /** Monthly pattern data for counts */
  monthlyData: MonthlyPattern[]
  /** Weekday pattern data for peak hours */
  weekdayData: WeekdayPattern[]
  /** Additional CSS classes */
  className?: string
}

/**
 * Summary cards showing peak month, low month, and peak day
 */
export function SeasonalInsightsCard({
  insights,
  monthlyData,
  weekdayData,
  className,
}: SeasonalInsightsCardProps) {
  // Find data for insights
  const peakMonthData = monthlyData.find(m => m.month === insights.peakMonth)
  const lowMonthData = monthlyData.find(m => m.month === insights.lowMonth)
  const peakDayData = weekdayData.find(d => d.dayOfWeek === insights.peakDay)

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className || ''}`}>
      {/* Peak Month Card */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-700">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-medium">Пик месяц</span>
          </div>
          <p className="text-xl font-bold text-green-900 mt-1">
            {localizeMonth(insights.peakMonth)}
          </p>
          <p className="text-sm text-green-600">
            {peakMonthData?.avgOrders.toLocaleString('ru-RU')} заказов
          </p>
        </CardContent>
      </Card>

      {/* Low Month Card */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-700">
            <TrendingDown className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-medium">Мин месяц</span>
          </div>
          <p className="text-xl font-bold text-red-900 mt-1">{localizeMonth(insights.lowMonth)}</p>
          <p className="text-sm text-red-600">
            {lowMonthData?.avgOrders.toLocaleString('ru-RU')} заказов
          </p>
        </CardContent>
      </Card>

      {/* Peak Day Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-blue-700">
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-medium">Пик день</span>
          </div>
          <p className="text-xl font-bold text-blue-900 mt-1">
            {localizeWeekday(insights.peakDay)}
          </p>
          <p className="text-sm text-blue-600 flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden="true" />
            Пик: {formatPeakHour(peakDayData?.peakHour ?? 0)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
