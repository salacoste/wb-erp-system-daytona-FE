/**
 * SeasonalChart Loading/Error/Empty States
 * Story 51.6-FE: Seasonal Patterns Components
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Extracted state components for loading, error, and empty states.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SeasonalViewType } from '@/types/fbs-analytics'

// ============================================================================
// Constants (shared with SeasonalPatternsChart)
// ============================================================================

export const CHART_TITLE = 'Сезонность заказов'
export const DEFAULT_HEIGHT = 350

/** Russian month name mapping */
export const MONTH_LABELS: Record<string, string> = {
  January: 'Янв',
  February: 'Фев',
  March: 'Мар',
  April: 'Апр',
  May: 'Май',
  June: 'Июн',
  July: 'Июл',
  August: 'Авг',
  September: 'Сен',
  October: 'Окт',
  November: 'Ноя',
  December: 'Дек',
}

/** Russian day name mapping */
export const DAY_LABELS: Record<string, string> = {
  Monday: 'Пн',
  Tuesday: 'Вт',
  Wednesday: 'Ср',
  Thursday: 'Чт',
  Friday: 'Пт',
  Saturday: 'Сб',
  Sunday: 'Вс',
}

/** Quarter labels */
export const QUARTER_LABELS: Record<string, string> = {
  Q1: '1 квартал',
  Q2: '2 квартал',
  Q3: '3 квартал',
  Q4: '4 квартал',
}

/** Bar colors */
export const BAR_COLOR_DEFAULT = '#3B82F6'
export const BAR_COLOR_PEAK = '#22C55E'
export const BAR_COLOR_LOW = '#EF4444'

/** Tab configuration */
export const TAB_CONFIG: { value: SeasonalViewType; label: string }[] = [
  { value: 'monthly', label: 'Месяцы' },
  { value: 'weekly', label: 'Дни недели' },
  { value: 'quarterly', label: 'Кварталы' },
]

/** Week day order for sorting */
export const WEEK_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

// ============================================================================
// Helper Functions
// ============================================================================

export function getMonthLabel(month: string): string {
  return MONTH_LABELS[month] ?? month
}

export function getDayLabel(day: string): string {
  return DAY_LABELS[day] ?? day
}

export function getQuarterLabel(quarter: string): string {
  return QUARTER_LABELS[quarter] ?? quarter
}

// ============================================================================
// Loading State
// ============================================================================

interface LoadingStateProps {
  className?: string
  height: number
}

export function SeasonalChartLoading({ className, height }: LoadingStateProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-lg">{CHART_TITLE}</CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-64 mb-4" />
        <Skeleton className="w-full animate-pulse" style={{ height: `${height}px` }} />
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Error State
// ============================================================================

interface ErrorStateProps {
  className?: string
  onRetry: () => void
}

export function SeasonalChartError({ className, onRetry }: ErrorStateProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-lg">{CHART_TITLE}</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Не удалось загрузить данные сезонности.</span>
            <Button variant="outline" size="sm" onClick={onRetry} className="ml-4">
              <RefreshCw className="mr-2 h-4 w-4" />
              Повторить
            </Button>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Empty State
// ============================================================================

interface EmptyStateProps {
  className?: string
  view: SeasonalViewType
  onViewChange: (view: string) => void
}

export function SeasonalChartEmpty({ className, view, onViewChange }: EmptyStateProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-lg">{CHART_TITLE}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={view} onValueChange={onViewChange}>
          <TabsList>
            {TAB_CONFIG.map(t => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Alert className="mt-4">
          <AlertDescription>Нет данных за выбранный период</AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
