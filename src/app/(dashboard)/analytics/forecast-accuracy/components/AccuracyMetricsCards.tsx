'use client'

/**
 * Accuracy aggregate metrics cards — MAPE, MAE, Bias, Total Validated.
 * Epic 123-FE Story 123.4
 */

import { cn, formatPercentage } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AccuracyMetricsCardsProps {
  totalValidated: number
  avgMAPE: number | null
  avgMAE: number | null
  avgBias: number | null
}

function formatMape(value: number | null): string {
  if (value == null) return '—'
  return formatPercentage(value)
}

function formatBias(value: number | null): string {
  if (value == null) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}`
}

export function AccuracyMetricsCards({
  totalValidated,
  avgMAPE,
  avgMAE,
  avgBias,
}: AccuracyMetricsCardsProps) {
  // FE-9: MAPE explodes near zero sales — de-emphasise when absurdly high.
  const isHighMape = avgMAPE != null && avgMAPE > 200

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Валидировано</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalValidated.toLocaleString('ru-RU')}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Средний MAE</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgMAE?.toLocaleString('ru-RU') ?? '—'}</div>
          <p className="text-xs text-muted-foreground">
            Средняя абсолютная ошибка (шт) — основной показатель точности
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Средний MAPE</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn('text-2xl font-bold', isHighMape && 'text-amber-600')}>
            {isHighMape ? '>200 %' : formatMape(avgMAPE)}
          </div>
          <p className="text-xs text-muted-foreground">
            {isHighMape
              ? 'Очень высока — возможна при продажах около 0; смотрите MAE'
              : 'Средняя абсолютная ошибка %'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Смещение (Bias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatBias(avgBias)}</div>
          <p className="text-xs text-muted-foreground">
            {avgBias != null && avgBias > 0
              ? 'Завышение'
              : avgBias != null && avgBias < 0
                ? 'Занижение'
                : 'Систематическая ошибка'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
