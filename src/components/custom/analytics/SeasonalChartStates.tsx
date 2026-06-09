/**
 * SeasonalChart Loading/Error/Empty States
 * Story 51.6-FE: Seasonal Patterns Components
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Constants extracted to SeasonalChartConstants.ts for file-size compliance.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SeasonalViewType } from '@/types/fbs-analytics'
import { CHART_TITLE, TAB_CONFIG } from './SeasonalChartConstants'

// Re-export constants for backward compat (SeasonalPatternsChart imports from here)
export {
  CHART_TITLE,
  DEFAULT_HEIGHT,
  MONTH_LABELS,
  DAY_LABELS,
  QUARTER_LABELS,
  BAR_COLOR_DEFAULT,
  BAR_COLOR_PEAK,
  BAR_COLOR_LOW,
  TAB_CONFIG,
  WEEK_ORDER,
  getMonthLabel,
  getDayLabel,
  getQuarterLabel,
} from './SeasonalChartConstants'

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
