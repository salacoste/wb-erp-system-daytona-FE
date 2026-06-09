'use client'

/**
 * Forecast page orchestrator — composes header, params, and results sections.
 * Story 108.2-FE: added AI health badge, preferences toggle, and aiEnabled gate.
 * Story 108.3-FE: added readiness state machine routing via useAiStatus + resolveReadinessRoute.
 * Sub-components: ForecastReadyStates (loading/error/empty/results cards)
 */
import { useState, useEffect } from 'react'
import { ForecastTable } from './ForecastTable'
import { ForecastMetrics } from './ForecastMetrics'
import { ForecastChart } from './ForecastChart'
import { ForecastPageHeader } from './ForecastPageHeader'
import { ForecastParamsCard } from './ForecastParamsCard'
import { AiEngineStatusBadge } from './AiEngineStatusBadge'
import { AiPreferencesToggle } from './AiPreferencesToggle'
import { CollectingProgressTracker } from './CollectingProgressTracker'
import { SneakPreviewSection } from './SneakPreviewSection'
import { resolveReadinessRoute } from './readiness-router'
import { useAiForecast } from '@/hooks/useAiForecast'
import { useAiPreferences } from '@/hooks/useAiPreferences'
import { useAiStatus } from '@/hooks/useAiStatus'
import { useAuthStore } from '@/stores/authStore'
import { type ForecastLevel, type ModelType } from '@/types/ai-forecast'
import { computeForecastQueryParams } from './forecast-query-helpers'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  ForecastLoadingSkeleton,
  ForecastErrorState,
  ForecastEmptyState,
  ForecastResultsCard,
} from './ForecastReadyStates'

export function ForecastPageContent() {
  const [nmIdInput, setNmIdInput] = useState('')
  const [level, setLevel] = useState<ForecastLevel>('sku')
  const [horizonDays, setHorizonDays] = useState(7)
  const [modelType, setModelType] = useState<ModelType>('sales_forecast')

  const cabinetId = useAuthStore(s => s.cabinetId)
  useEffect(() => {
    setNmIdInput('')
    setModelType('sales_forecast')
  }, [cabinetId])

  const { data: prefs } = useAiPreferences()
  // Default true while loading — avoids flash of disabled state
  const aiEnabled = prefs?.aiEnabled !== false

  const { nmId, enabled, parsedNmId } = computeForecastQueryParams(level, nmIdInput)

  const { data, isLoading, isError, error, refetch, isFetching } = useAiForecast(
    { nmId, level, horizonDays, modelType },
    enabled && aiEnabled
  )

  // Readiness state machine — Pattern 1 (Epic 92-FE): supplementary failure must NOT blank page
  // Pass aiEnabled so hook doesn't poll /v1/ai/status every 60s when AI is disabled
  const aiStatus = useAiStatus(aiEnabled)
  const readinessRoute = resolveReadinessRoute(aiStatus.data?.readinessLevel, aiStatus.isError)

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

  // Collecting state: replace forecast UI with progress tracker
  if (readinessRoute === 'collecting' && aiStatus.data) {
    return (
      <div className="space-y-6 p-6">
        {header}
        <CollectingProgressTracker status={aiStatus.data} />
      </div>
    )
  }

  // Sneak-preview state: replace forecast UI with low-confidence preview
  if (readinessRoute === 'sneak_preview' && aiStatus.data) {
    return (
      <div className="space-y-6 p-6">
        {header}
        <SneakPreviewSection status={aiStatus.data} />
      </div>
    )
  }

  // Ready state (or status loading/error — defensive default): full forecast dashboard
  return (
    <div className="space-y-6 p-6">
      {header}

      <ForecastParamsCard
        level={level}
        nmIdInput={nmIdInput}
        horizonDays={horizonDays}
        parsedNmId={parsedNmId}
        enabled={enabled}
        modelType={modelType}
        onLevelChange={setLevel}
        onNmIdChange={setNmIdInput}
        onHorizonChange={setHorizonDays}
        onModelTypeChange={setModelType}
      />

      {(isLoading || isFetching) && !hasData && <ForecastLoadingSkeleton />}

      {isError && !hasData && <ForecastErrorState error={error} />}

      {enabled && !isLoading && !isFetching && !isError && !hasData && <ForecastEmptyState />}

      {hasData && (
        <>
          <ForecastMetrics data={data} />
          <ForecastChart predictions={data.predictions} />
          <ForecastResultsCard data={data} isFetching={isFetching} onRefetch={() => refetch()}>
            <ForecastTable predictions={data.predictions} />
          </ForecastResultsCard>
        </>
      )}
    </div>
  )
}
