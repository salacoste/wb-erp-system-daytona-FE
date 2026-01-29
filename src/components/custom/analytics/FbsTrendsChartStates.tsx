/**
 * FbsTrendsChart Loading/Error/Empty States
 * Story 51.4-FE: FBS Trends Chart
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Extracted state components for loading, error, and empty states.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

const CHART_TITLE = 'Динамика заказов FBS'

// ============================================================================
// Loading State
// ============================================================================

interface LoadingStateProps {
  className?: string
  height: number
}

export function FbsTrendsChartLoading({ className, height }: LoadingStateProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">{CHART_TITLE}</CardTitle>
      </CardHeader>
      <CardContent>
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

export function FbsTrendsChartError({ className, onRetry }: ErrorStateProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{CHART_TITLE}</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Не удалось загрузить данные трендов. Попробуйте ещё раз.</span>
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
}

export function FbsTrendsChartEmpty({ className }: EmptyStateProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{CHART_TITLE}</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertDescription>
            Нет данных за выбранный период. Попробуйте выбрать другой диапазон дат.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
