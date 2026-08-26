'use client'

/**
 * ModelPerformanceDetail — per-model drift status, MAPE trend chart, and evaluation table.
 * Story 109.5-FE: consumes useModelPerformance + useAiModels for header identity.
 * File-size discipline: evaluation table extracted to EvaluationHistoryTable.tsx.
 * Migrated Story 171.9-FE: status badge detached from the shared registry overlay field
 * (route-local token map; label still from the shared config), route-level padding removed
 * (dashboard layout provides its own), history-table caption names the model.
 */

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useModelPerformance } from '@/hooks/useModelPerformance'
import { useAiModels } from '@/hooks/useAiModels'
import { getModelTypeLabel } from '@/types/ai/forecast'
import { ROUTES, buildModelEvaluationsRoute } from '@/lib/routes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapeTrendChart } from './MapeTrendChart'
import { EvaluationHistoryTable } from './EvaluationHistoryTable'
import {
  DRIFT_BADGE_CONFIG,
  DRIFT_NULL_CONFIG,
  PERFORMANCE_STATUS_BADGE_CLASS,
  getMapeDeltaColor,
  formatMapeDelta,
  getCurrentMape,
} from './model-performance-helpers'
import { STATUS_BADGE_CONFIG } from '../../../components/model-list-helpers'
import { formatPercentage } from '@/lib/utils'

// Re-export pure helpers for direct unit testing (pure-function discipline, Story 99.2-FE).
export { DRIFT_BADGE_CONFIG, DRIFT_NULL_CONFIG, getMapeDeltaColor, formatMapeDelta, getCurrentMape }

interface ModelPerformanceDetailProps {
  modelId: string
}

function ModelPerformancePageShell({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Производительность модели</h1>
      {children}
    </div>
  )
}

export function ModelPerformanceDetail({ modelId }: ModelPerformanceDetailProps) {
  const {
    data: modelsData,
    isLoading: modelsLoading,
    isError: modelsError,
    error: modelsListError,
  } = useAiModels()
  const model = modelsData?.models?.find(m => m.id === modelId)
  const canFetchPerformance = !modelsLoading && !modelsError && !!model
  const {
    data: perfData,
    isLoading: perfLoading,
    isError,
    error,
  } = useModelPerformance(modelId, { enabled: canFetchPerformance })

  if (modelsLoading || (canFetchPerformance && perfLoading)) {
    return (
      <ModelPerformancePageShell>
        <div data-testid="skeleton">
          <Skeleton className="h-64 w-full" />
        </div>
      </ModelPerformancePageShell>
    )
  }

  if (modelsError) {
    return (
      <ModelPerformancePageShell>
        <Alert variant="destructive">
          <AlertDescription>
            Ошибка загрузки списка моделей
            {modelsListError?.message ? `: ${modelsListError.message}` : ''}
          </AlertDescription>
        </Alert>
      </ModelPerformancePageShell>
    )
  }

  if (!model) {
    return (
      <ModelPerformancePageShell>
        <Alert>
          <AlertDescription>
            Модель не найдена. Возможно, она была удалена или ещё не загружена.{' '}
            <Link href={ROUTES.ANALYTICS.MODELS} className="underline">
              Вернуться к списку моделей
            </Link>
          </AlertDescription>
        </Alert>
      </ModelPerformancePageShell>
    )
  }

  if (isError) {
    return (
      <ModelPerformancePageShell>
        <Alert variant="destructive">
          <AlertDescription>
            Ошибка загрузки производительности модели{error?.message ? `: ${error.message}` : ''}
          </AlertDescription>
        </Alert>
      </ModelPerformancePageShell>
    )
  }

  const driftStatus = perfData?.driftStatus ?? null
  const driftConfig = driftStatus != null ? DRIFT_BADGE_CONFIG[driftStatus] : DRIFT_NULL_CONFIG
  const prevMetrics = perfData?.previousVersionMetrics
  const mapeTrend = perfData?.mapeTrend ?? []
  const currentMape = getCurrentMape(mapeTrend)
  const prevMape = prevMetrics?.mape ?? null

  // F-3: explicit null-guard instead of non-null assertions.
  const deltaStr = formatMapeDelta(prevMape, currentMape)
  let deltaColor = 'text-muted-foreground'
  if (currentMape != null && prevMape != null) {
    deltaColor = getMapeDeltaColor(currentMape - prevMape)
  }

  // Label only from the shared registry (single label source of truth);
  // colour overlay is route-local (Story 171.9-FE detach from the className field —
  // the field itself remains for the registry-root consumer; removal is a registry-owner carry-out).
  const statusLabel = STATUS_BADGE_CONFIG[model.status].label

  return (
    <ModelPerformancePageShell>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Сводка производительности</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href={buildModelEvaluationsRoute(modelId)}>Подробные оценки</Link>
            </Button>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <span>{getModelTypeLabel(model.modelType)}</span>
            <span>v{model.version}</span>
            <Badge variant="outline" className={PERFORMANCE_STATUS_BADGE_CLASS[model.status]}>
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drift badge — AC-4 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Тренд точности:</span>
            <Badge className={driftConfig.className}>{driftConfig.label}</Badge>
          </div>

          {/* Previous-version comparison — AC-6: hidden when prevMetrics absent */}
          {prevMetrics != null && model.version > 0 && (
            <p className="text-sm">
              Сравнение с v{model.version - 1}: MAPE{' '}
              {prevMape != null ? formatPercentage(prevMape) : '—'}
              {' → '}
              {currentMape != null ? formatPercentage(currentMape) : '—'}
              {deltaStr != null && (
                <span className={`ml-1 font-medium ${deltaColor}`}>({deltaStr})</span>
              )}
            </p>
          )}

          {/* MAPE trend chart — AC-5 */}
          <MapeTrendChart entries={mapeTrend} />
        </CardContent>
      </Card>

      {/* Evaluation rows table — AC-7; caption names the model (RTC, Story 171.9-FE) */}
      <EvaluationHistoryTable
        mapeTrend={mapeTrend}
        captionText={`История оценок — ${getModelTypeLabel(model.modelType)} v${model.version}`}
      />
    </ModelPerformancePageShell>
  )
}
