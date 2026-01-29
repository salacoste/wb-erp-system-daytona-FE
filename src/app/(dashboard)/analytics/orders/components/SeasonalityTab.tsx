/**
 * Seasonality Tab Component
 * Story 51.8-FE: FBS Analytics Page (Tab Navigation & Integration)
 * Story 51.6-FE: Seasonal Patterns Chart
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Seasonal patterns visualization with monthly/weekly/quarterly sub-tabs.
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, TrendingUp, TrendingDown, Calendar, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFbsSeasonal } from '@/hooks/useFbsAnalytics'
import { formatSeasonalIndex, getSeasonalityLevel } from '@/lib/fbs-analytics-utils'
import { SeasonalPatternsList, MONTHS_RU, DAYS_RU } from './SeasonalPatternsList'
import type { SeasonalViewType } from '@/types/fbs-analytics'

/** View options with Russian labels */
const VIEW_OPTIONS: { value: SeasonalViewType; label: string }[] = [
  { value: 'monthly', label: 'По месяцам' },
  { value: 'weekly', label: 'По дням недели' },
  { value: 'quarterly', label: 'По кварталам' },
]

export function SeasonalityTab() {
  const [view, setView] = useState<SeasonalViewType>('monthly')
  const [months, setMonths] = useState<number>(12)

  const { data, isLoading, error } = useFbsSeasonal({ months, view })

  if (error) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Не удалось загрузить сезонные паттерны. Попробуйте обновить страницу.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4 mt-4">
      {/* View Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">Сезонные паттерны</CardTitle>
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex rounded-lg bg-muted p-1">
                {VIEW_OPTIONS.map(option => (
                  <Button
                    key={option.value}
                    variant="ghost"
                    size="sm"
                    onClick={() => setView(option.value)}
                    className={cn(
                      'px-3 py-1.5 text-sm transition-colors',
                      view === option.value
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              {/* Period Selector */}
              <select
                value={months}
                onChange={e => setMonths(Number(e.target.value))}
                className="h-9 rounded-md border bg-background px-3 text-sm"
                aria-label="Период анализа"
              >
                <option value={6}>6 месяцев</option>
                <option value={12}>12 месяцев</option>
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Insights Card */}
      {data?.insights && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              Ключевые инсайты
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <InsightItem
                icon={<TrendingUp className="h-5 w-5 text-green-600" />}
                label="Пиковый месяц"
                value={MONTHS_RU[data.insights.peakMonth] || data.insights.peakMonth}
              />
              <InsightItem
                icon={<TrendingDown className="h-5 w-5 text-red-500" />}
                label="Низкий месяц"
                value={MONTHS_RU[data.insights.lowMonth] || data.insights.lowMonth}
              />
              <InsightItem
                icon={<Calendar className="h-5 w-5 text-blue-600" />}
                label="Пиковый день"
                value={DAYS_RU[data.insights.peakDayOfWeek] || data.insights.peakDayOfWeek}
              />
              <InsightItem
                icon={<TrendingUp className="h-5 w-5 text-primary" />}
                label="Индекс сезонности"
                value={`${formatSeasonalIndex(data.insights.seasonalityIndex)} (${getSeasonalityLevel(data.insights.seasonalityIndex)})`}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patterns Visualization */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-[300px] w-full" />
            </div>
          ) : data?.patterns ? (
            <SeasonalPatternsList patterns={data.patterns} view={view} />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Нет данных для отображения
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/** Insight item sub-component */
function InsightItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  )
}
