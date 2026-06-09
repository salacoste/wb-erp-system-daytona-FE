'use client'

/**
 * Forecast Ready States - Loading/error/empty skeletons for the ready route
 * Extracted from ForecastPageContent.tsx for file size compliance
 */

import { RefreshCw, AlertTriangle, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function ForecastLoadingSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

interface ForecastErrorProps {
  error: Error | null
}

export function ForecastErrorState({ error }: ForecastErrorProps) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        Ошибка загрузки прогноза: {error instanceof Error ? error.message : 'Неизвестная ошибка'}
      </AlertDescription>
    </Alert>
  )
}

export function ForecastEmptyState() {
  return (
    <Alert>
      <AlertDescription>
        Нет данных прогноза. Модель ещё не обучена для этого товара. Попробуйте позже.
      </AlertDescription>
    </Alert>
  )
}

interface ForecastResultsCardProps {
  data: {
    predictions: unknown[]
    explanation?: string | null
    rollbackNotice?: {
      previousVersion: number
      rollbackDate?: string | null
      reason: string
    } | null
  }
  isFetching: boolean
  onRefetch: () => void
  children: React.ReactNode
}

export function ForecastResultsCard({
  data,
  isFetching,
  onRefetch,
  children,
}: ForecastResultsCardProps) {
  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-2">
          <div className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5" />
              Прогноз продаж
            </CardTitle>
            <Button variant="outline" size="sm" onClick={onRefetch} disabled={isFetching}>
              <RefreshCw className={`mr-1 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Обновить
            </Button>
          </div>
          {data.explanation ? (
            <CardDescription className="line-clamp-3">{data.explanation}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
      {data.rollbackNotice && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {data.rollbackNotice.previousVersion === 0 && !data.rollbackNotice.rollbackDate
              ? `Откат модели: ${data.rollbackNotice.reason}`
              : `Откат модели: ${data.rollbackNotice.reason} (v${data.rollbackNotice.previousVersion} → откат ${data.rollbackNotice.rollbackDate})`}
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}
