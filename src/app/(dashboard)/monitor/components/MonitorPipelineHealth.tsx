/**
 * MonitorPipelineHealth — Block 5: Compact pipeline status panel
 * Epic 92-FE Story 92.5
 *
 * Shows:
 *   Row A — Most recent successful recalculation (displayName + relative time)
 *   Row B — List of unhealthy pipelines with status badge + optional error indicator
 *   Empty state — All healthy: green checkmark + confirmation message
 *
 * Pure presenter — caller owns loading/error states and passes GridPipeline[].
 * Reuses STATUS_COLORS/STATUS_LABELS re-exported from ./monitor-pipeline-utils
 * (originating in @/lib/monitoring-constants per Story 93.1).
 *
 * Error-rate gate: >= 0.01 to match PipelineStatusGrid.tsx:108 precedent.
 */

'use client'

import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatPercentageInt } from '@/lib/utils'
import type { GridPipeline } from '@/app/(dashboard)/monitoring/types/monitoring'
import {
  getMostRecentRecalc,
  getUnhealthyPipelines,
  formatRelativeTime,
  STATUS_COLORS,
  STATUS_LABELS,
} from './monitor-pipeline-utils'

interface MonitorPipelineHealthProps {
  pipelines: GridPipeline[]
}

export function MonitorPipelineHealth({ pipelines }: MonitorPipelineHealthProps) {
  const mostRecent = getMostRecentRecalc(pipelines)
  const unhealthy = getUnhealthyPipelines(pipelines)

  return (
    <Card role="region" aria-label="Состояние пайплайнов" data-testid="monitor-pipeline-health">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Состояние пайплайнов
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Row A — Most recent recalculation */}
        <div className="flex items-start gap-2">
          <span className="text-xs text-muted-foreground shrink-0 pt-0.5">Последний пересчёт:</span>
          {mostRecent ? (
            <span className="text-xs font-medium">
              {mostRecent.displayName} — {formatRelativeTime(mostRecent.lastSuccessAt)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground italic">Нет данных о пересчётах</span>
          )}
        </div>

        {/* Row B — Unhealthy pipelines or all-healthy empty state */}
        {unhealthy.length === 0 ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">Все пайплайны работают исправно</span>
          </div>
        ) : (
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">Требуют внимания:</span>
            {unhealthy.map(pipeline => (
              <PipelineRow key={pipeline.pipelineId} pipeline={pipeline} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PipelineRow({ pipeline }: { pipeline: GridPipeline }) {
  const { displayName, status, errorRate, tasksWithErrors, totalResultErrors } = pipeline
  const colorClass = STATUS_COLORS[status]
  const label = STATUS_LABELS[status]

  // AC-9: defensive guard — errorRate > 1 is impossible per backend spec (proportion 0–1).
  // Backend resolved in Request #167 (commit c9ba2187, 2026-04-30) — server now clamps
  // errorRate to [0, 1]. Defensive guard kept per CLAUDE.md § Defensive Frontend Principle.
  const isErrorRateOutOfRange = errorRate > 1
  if (isErrorRateOutOfRange) {
    console.warn(
      `[MonitorPipelineHealth] errorRate > 1 for pipeline ${pipeline.pipelineId}: ${errorRate}. ` +
        'This should not happen — backend should return proportion 0-1.'
    )
  }

  // Gate on >= 1% to avoid showing "0%" badge for tiny fractional error rates.
  // @see Story 91.3-FE — threshold origin; mirrors PipelineStatusGrid.tsx (keep in sync).
  const hasErrors = errorRate >= 0.01

  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span className="text-xs truncate">{displayName}</span>
      <div className="flex items-center gap-1.5 shrink-0">
        {isErrorRateOutOfRange && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-0.5 text-amber-600 cursor-help">
                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
              </span>
            </TooltipTrigger>
            <TooltipContent size="sm">
              <p>Аномалия: показатель errorRate вне диапазона 0-1. Возможна ошибка данных.</p>
            </TooltipContent>
          </Tooltip>
        )}
        {hasErrors && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="border-amber-500 text-amber-700 text-xs px-1.5 cursor-help"
              >
                <AlertTriangle className="h-3 w-3 mr-0.5" />
                {formatPercentageInt(Math.min(errorRate, 1) * 100)}
              </Badge>
            </TooltipTrigger>
            <TooltipContent size="sm">
              {tasksWithErrors > 0 || totalResultErrors > 0 ? (
                <p>
                  {tasksWithErrors} задач с ошибками ({totalResultErrors} ошибок всего)
                </p>
              ) : (
                <p>Ошибки выполнения</p>
              )}
            </TooltipContent>
          </Tooltip>
        )}
        <Badge className={cn('whitespace-nowrap text-xs', colorClass)}>{label}</Badge>
      </div>
    </div>
  )
}
