'use client'

/**
 * ModelPerformanceDetail — per-model drift status, MAPE trend chart, and evaluation table.
 * Story 109.5-FE: consumes useModelPerformance + useAiModels for header identity.
 * File-size discipline: pure helpers extracted to model-performance-helpers.ts (Story 99.2-FE).
 */

import Link from 'next/link'
import { useModelPerformance } from '@/hooks/useModelPerformance'
import { useAiModels } from '@/hooks/useAiModels'
import { MODEL_TYPE_LABELS } from '@/types/ai/forecast'
import { ROUTES, buildModelEvaluationsRoute } from '@/lib/routes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MapeTrendChart } from './MapeTrendChart'
import {
  DRIFT_BADGE_CONFIG,
  DRIFT_NULL_CONFIG,
  getMapeDeltaColor,
  formatMapeDelta,
  getCurrentMape,
  sortMapeTrendDesc,
} from './model-performance-helpers'
import { STATUS_BADGE_CONFIG } from '../../../components/model-list-helpers'
import { formatDate, formatPercentage } from '@/lib/utils'

// Re-export pure helpers for direct unit testing (pure-function discipline, Story 99.2-FE).
export { DRIFT_BADGE_CONFIG, DRIFT_NULL_CONFIG, getMapeDeltaColor, formatMapeDelta, getCurrentMape }

interface ModelPerformanceDetailProps {
  modelId: string
}

export function ModelPerformanceDetail({ modelId }: ModelPerformanceDetailProps) {
  const { data: perfData, isLoading: perfLoading, isError, error } = useModelPerformance(modelId)
  const {
    data: modelsData,
    isLoading: modelsLoading,
    isError: modelsError,
    error: modelsListError,
  } = useAiModels()

  const isLoading = perfLoading || modelsLoading

  // State precedence: loading → list-error → model-not-found → perf-error → happy.
  if (isLoading) {
    return (
      <div className="space-y-6 p-6" data-testid="skeleton">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (modelsError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Ошибка загрузки списка моделей
            {modelsListError?.message ? `: ${modelsListError.message}` : ''}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const model = modelsData?.models?.find(m => m.id === modelId)

  if (!model) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>
            Модель не найдена. Возможно, она была удалена или ещё не загружена.{' '}
            <Link href={ROUTES.ANALYTICS.MODELS} className="underline">
              Вернуться к списку моделей
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Ошибка загрузки производительности модели
            {error?.message ? `: ${error.message}` : ''}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const driftStatus = perfData?.driftStatus ?? null
  const driftConfig = driftStatus != null ? DRIFT_BADGE_CONFIG[driftStatus] : DRIFT_NULL_CONFIG

  const prevMetrics = perfData?.previousVersionMetrics
  const mapeTrend = perfData?.mapeTrend ?? []
  const currentMape = getCurrentMape(mapeTrend)
  const prevMape = prevMetrics?.mape ?? null

  const sortedEntries = sortMapeTrendDesc(mapeTrend)

  // F-3: explicit null-guard instead of non-null assertions.
  const deltaStr = formatMapeDelta(prevMape, currentMape)
  let deltaColor = 'text-muted-foreground'
  if (currentMape != null && prevMape != null) {
    deltaColor = getMapeDeltaColor(currentMape - prevMape)
  }

  // F-1: use STATUS_BADGE_CONFIG for localized Russian label + className.
  const statusBadge = STATUS_BADGE_CONFIG[model.status]

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Производительность модели</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href={buildModelEvaluationsRoute(modelId)}>Подробные оценки</Link>
            </Button>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <span>{MODEL_TYPE_LABELS[model.modelType]}</span>
            <span>v{model.version}</span>
            <Badge variant="outline" className={statusBadge.className}>
              {statusBadge.label}
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

      {/* Evaluation rows table — AC-7 */}
      {mapeTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>История оценок</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>MAPE</TableHead>
                  <TableHead>SKU</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEntries.map(entry => (
                  <TableRow key={entry.evaluationDate}>
                    <TableCell>{formatDate(entry.evaluationDate)}</TableCell>
                    <TableCell>
                      {entry.cabinetMape != null ? formatPercentage(entry.cabinetMape) : '—'}
                    </TableCell>
                    <TableCell>{entry.skuCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
