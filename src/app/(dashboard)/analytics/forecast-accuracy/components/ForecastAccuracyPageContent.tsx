'use client'

/**
 * Forecast Accuracy page — aggregate MAPE/MAE/Bias cards + breakdown tables.
 * Epic 123-FE Story 123.4: consumes GET /v1/ai/forecast-accuracy.
 */

import { AlertTriangle, Target } from 'lucide-react'
import { AccuracyMetricsCards } from './AccuracyMetricsCards'
import { HorizonBreakdownTable } from './HorizonBreakdownTable'
import { SkuBreakdownTable } from './SkuBreakdownTable'
import { useForecastAccuracy } from '@/hooks/useForecastAccuracy'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const EXTREME_MAPE_THRESHOLD = 1000

function hasExtremeMape(data: {
  avgMAPE: number | null
  byHorizon: Array<{ mape: number | null }>
  bySKU: Array<{ mape: number | null }>
}): boolean {
  const values = [
    data.avgMAPE,
    ...data.byHorizon.map(row => row.mape),
    ...data.bySKU.map(row => row.mape),
  ]
  return values.some(value => value != null && value >= EXTREME_MAPE_THRESHOLD)
}

export function ForecastAccuracyPageContent() {
  const { data, isLoading, isError, error } = useForecastAccuracy()

  if (isLoading) {
    return <ForecastAccuracySkeleton />
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Ошибка загрузки</AlertTitle>
        <AlertDescription>
          Не удалось загрузить данные точности прогнозов.
          {error instanceof Error ? ` ${error.message}` : ''}
        </AlertDescription>
      </Alert>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Target className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Точность прогнозов</h1>
      </div>

      <AccuracyMetricsCards
        totalValidated={data.totalValidated}
        avgMAPE={data.avgMAPE}
        avgMAE={data.avgMAE}
        avgBias={data.avgBias}
      />

      {hasExtremeMape(data) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Очень высокая MAPE</AlertTitle>
          <AlertDescription>
            MAPE может становиться тысячами процентов, если фактические продажи близки к нулю или
            равны нулю. Проверяйте MAE и количество наблюдений рядом с MAPE; значения «—» означают,
            что MAPE не рассчитана для этого SKU.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">По горизонту прогноза</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizonBreakdownTable rows={data.byHorizon} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">По SKU (топ-20)</CardTitle>
          </CardHeader>
          <CardContent>
            <SkuBreakdownTable rows={data.bySKU} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ForecastAccuracySkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  )
}
