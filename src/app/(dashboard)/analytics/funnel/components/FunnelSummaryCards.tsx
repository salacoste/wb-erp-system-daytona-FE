'use client'

import { useFunnelData } from '@/hooks/use-funnel-analytics'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { calculateFunnelDelta } from './funnel-comparison-utils'
import { isFunnelConversionAnomalous } from './funnel-anomaly'
import { FunnelAnomalyIndicator } from './FunnelAnomalyIndicator'
import { DeltaIndicator } from './FunnelDeltaIndicator'
import { FunnelSummarySlowLoading } from './FunnelSummarySlowLoading'
import { useDelayedLoadingState } from '@/hooks/useDelayedLoadingState'
import { FUNNEL_SUMMARY_CARDS, isAvailableMetric } from './funnel-summary-card-config'

interface FunnelSummaryCardsProps {
  from: string
  to: string
  compareEnabled?: boolean
  compareFrom?: string
  compareTo?: string
  nmIds?: number[]
}

export function FunnelSummaryCards({
  from,
  to,
  compareEnabled,
  compareFrom,
  compareTo,
  nmIds,
}: FunnelSummaryCardsProps) {
  const filterParam = nmIds?.length ? nmIds : undefined
  const { data, isLoading, isError, refetch } = useFunnelData(from, to, {
    limit: 1,
    nmIds: filterParam,
  })
  const showSlowLoading = useDelayedLoadingState(isLoading && !data)

  const hasCompare = compareEnabled && !!compareFrom && !!compareTo
  const {
    data: prevData,
    isLoading: prevLoading,
    isError: prevError,
    refetch: refetchPrevious,
  } = useFunnelData(compareFrom ?? '', compareTo ?? '', { limit: 1, nmIds: filterParam })

  if (isLoading && !showSlowLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }

  if (isLoading && showSlowLoading) {
    return <FunnelSummarySlowLoading onRetry={() => void refetch()} />
  }

  const summary = data?.summary
  const prevSummary = prevData?.summary
  const totalConversionApproximate = data?.meta?.totalConversionApproximate === true

  if (isError && !summary) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex flex-wrap items-center justify-between gap-4">
          <span>Не удалось загрузить метрики воронки</span>
          <Button className="min-h-11" variant="outline" onClick={() => void refetch()}>
            Повторить
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!summary) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Метрики воронки недоступны за выбранный период. Значения не заменены нулями.
        </AlertDescription>
      </Alert>
    )
  }

  const missingLabels = FUNNEL_SUMMARY_CARDS.filter(
    card => !isAvailableMetric(summary[card.field])
  ).map(card => card.label)

  return (
    <div className="space-y-4">
      {isError ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-4">
            <span>Показаны ранее загруженные метрики; обновление завершилось ошибкой.</span>
            <Button className="min-h-11 min-w-11" variant="outline" onClick={() => void refetch()}>
              Повторить метрики
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      {hasCompare && prevError ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-4">
            <span>Не удалось загрузить сравнение; текущие метрики сохранены.</span>
            <Button className="min-h-11" variant="outline" onClick={() => void refetchPrevious()}>
              Повторить сравнение
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      {missingLabels.length > 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Часть метрик недоступна: {missingLabels.join(', ')}. Отсутствующие значения не заменены
            нулями.
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FUNNEL_SUMMARY_CARDS.map(card => {
          const Icon = card.icon
          const value = summary[card.field] as number | undefined
          const previousValue = prevSummary?.[card.field] as number | undefined
          const available = isAvailableMetric(value)
          const delta =
            hasCompare && available && isAvailableMetric(previousValue)
              ? calculateFunnelDelta(value, previousValue)
              : null
          const anomalyInputsAvailable =
            isAvailableMetric(summary.totalConversion) &&
            isAvailableMetric(summary.ordersCount) &&
            isAvailableMetric(summary.buyoutCount)
          const anomalous =
            card.field === 'totalConversion' &&
            anomalyInputsAvailable &&
            isFunnelConversionAnomalous(summary)
          const approximate = card.field === 'totalConversion' && totalConversionApproximate

          return (
            <Card key={card.label}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={card.color}>
                  <Icon className="h-8 w-8" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="flex items-center gap-1.5 text-2xl font-bold">
                    <span
                      className="break-all"
                      title={
                        approximate
                          ? 'Приблизительно: показатель смешивает данные из разных источников'
                          : undefined
                      }
                    >
                      {available ? (
                        <>
                          {approximate ? '≈ ' : ''}
                          {card.format(value)}
                        </>
                      ) : (
                        <span className="text-base font-medium text-muted-foreground">
                          Недоступно
                        </span>
                      )}
                    </span>
                    {anomalous && <FunnelAnomalyIndicator />}
                  </p>
                  {hasCompare && available && (
                    <DeltaIndicator
                      delta={delta}
                      field={card.field}
                      loading={prevLoading}
                      error={prevError}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
