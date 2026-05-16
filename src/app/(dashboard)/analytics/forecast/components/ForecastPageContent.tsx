'use client'

/**
 * Forecast page orchestrator — composes header, params, and results sections.
 * Story 108.2-FE: added AI health badge, preferences toggle, and aiEnabled gate.
 */
import { useState, useEffect } from 'react'
import { RefreshCw, AlertTriangle, TrendingUp } from 'lucide-react'
import { ForecastTable } from './ForecastTable'
import { ForecastMetrics } from './ForecastMetrics'
import { ForecastPageHeader } from './ForecastPageHeader'
import { ForecastParamsCard } from './ForecastParamsCard'
import { AiEngineStatusBadge } from './AiEngineStatusBadge'
import { AiPreferencesToggle } from './AiPreferencesToggle'
import { useAiForecast } from '@/hooks/useAiForecast'
import { useAiPreferences } from '@/hooks/useAiPreferences'
import { useAuthStore } from '@/stores/authStore'
import { type ForecastLevel } from '@/types/ai-forecast'
import { computeForecastQueryParams } from './forecast-query-helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function ForecastPageContent() {
  const [nmIdInput, setNmIdInput] = useState('')
  const [level, setLevel] = useState<ForecastLevel>('sku')
  const [horizonDays, setHorizonDays] = useState(7)

  const cabinetId = useAuthStore(s => s.cabinetId)
  useEffect(() => {
    setNmIdInput('')
  }, [cabinetId])

  const { data: prefs } = useAiPreferences()
  // Default true while loading — avoids flash of disabled state
  const aiEnabled = prefs?.aiEnabled !== false

  const { nmId, enabled, parsedNmId } = computeForecastQueryParams(level, nmIdInput)

  const { data, isLoading, isError, error, refetch, isFetching } = useAiForecast(
    { nmId, level, horizonDays },
    enabled && aiEnabled
  )

  const hasData = !!data?.predictions?.length

  const header = (
    <ForecastPageHeader>
      <AiEngineStatusBadge />
      <AiPreferencesToggle />
    </ForecastPageHeader>
  )

  // Short-circuit when AI is disabled — show empty state with re-enable toggle
  if (!aiEnabled) {
    return (
      <div className="space-y-6 p-6">
        {header}
        <Alert>
          <AlertTitle>AI прогнозы отключены</AlertTitle>
          <AlertDescription>
            Включите AI прогнозы с помощью переключателя выше, чтобы получать прогнозы продаж.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {header}

      <ForecastParamsCard
        level={level}
        nmIdInput={nmIdInput}
        horizonDays={horizonDays}
        parsedNmId={parsedNmId}
        enabled={enabled}
        onLevelChange={setLevel}
        onNmIdChange={setNmIdInput}
        onHorizonChange={setHorizonDays}
      />

      {(isLoading || isFetching) && !hasData && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {isError && !hasData && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Ошибка загрузки прогноза:{' '}
            {error instanceof Error ? error.message : 'Неизвестная ошибка'}
          </AlertDescription>
        </Alert>
      )}

      {enabled && !isLoading && !isFetching && !isError && !hasData && (
        <Alert>
          <AlertDescription>
            Нет данных прогноза. Модель ещё не обучена для этого товара. Попробуйте позже.
          </AlertDescription>
        </Alert>
      )}

      {hasData && (
        <>
          <ForecastMetrics data={data} />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5" />
                Прогноз продаж
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={`mr-1 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                Обновить
              </Button>
            </CardHeader>
            <CardContent>
              <ForecastTable predictions={data.predictions} />
            </CardContent>
          </Card>
          {data.rollbackNotice && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Откат модели: {data.rollbackNotice.reason} (v{data.rollbackNotice.previousVersion} →
                откат {data.rollbackNotice.rollbackDate})
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  )
}
