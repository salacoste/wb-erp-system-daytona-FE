'use client'

/**
 * EvaluationsHeaderCard — presentational header for the evaluations list page.
 * Extracted from EvaluationsList.tsx (Story 112.4-FE, A-5) to keep that file under 200 lines.
 * Renders: page title, model identity row (type + version + status badge),
 * 3 summary cards (cabinetMape / evaluatedAt / skuCount), and ExportCsvButton.
 * Pure presenter — no hooks, no side effects.
 */

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getModelTypeLabel } from '@/types/ai/forecast'
import { STATUS_BADGE_CONFIG } from '../../../components/model-list-helpers'
import { formatDate, formatPercentage } from '@/lib/utils'
import { formatNumber } from '@/lib/fbs-analytics-formatters'
import { ExportCsvButton } from '@/components/custom/ai/ExportCsvButton'
import { exportEvaluationsToCsv } from '@/lib/csv/evaluations-csv-export'
import type { AiModel } from '@/types/ai/models'
import type { AiEvaluationListResponse } from '@/types/ai/evaluations'

interface EvaluationsHeaderCardProps {
  model: AiModel | undefined
  data: AiEvaluationListResponse | undefined
  modelId: string
}

export function EvaluationsHeaderCard({ model, data, modelId }: EvaluationsHeaderCardProps) {
  const cabinetMape = data?.cabinetMape ?? null
  const evaluatedAt = data?.evaluatedAt ?? null
  // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: skuCount is a count field, zero is a valid sentinel value
  const skuCount = data?.skuCount ?? 0
  // Stable reference: avoids creating a new [] on every render when data?.evaluations is undefined,
  // which would cause csvContent useMemo to regenerate unnecessarily on each render cycle.
  const safeEvaluations = useMemo(() => data?.evaluations ?? [], [data?.evaluations])

  const csvFileName = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return `evaluations-${modelId}-${evaluatedAt?.slice(0, 10) ?? today}.csv`
  }, [modelId, evaluatedAt])

  const csvContent = useMemo(
    () => exportEvaluationsToCsv(safeEvaluations, { evaluatedAt }),
    [safeEvaluations, evaluatedAt]
  )

  if (!model) return null

  const statusBadge = STATUS_BADGE_CONFIG[model.status]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Оценки точности модели</CardTitle>
          <ExportCsvButton
            csvContent={csvContent}
            fileName={csvFileName}
            disabled={safeEvaluations.length === 0}
          />
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
          <span>{getModelTypeLabel(model.modelType)}</span>
          <span>v{model.version}</span>
          <Badge variant="outline" className={statusBadge.className}>
            {statusBadge.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Средняя точность (MAPE)</p>
            <p className="text-2xl font-semibold mt-1">
              {cabinetMape !== null ? formatPercentage(cabinetMape) : '—'}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Последняя оценка</p>
            <p className="text-2xl font-semibold mt-1">
              {evaluatedAt !== null ? formatDate(evaluatedAt) : '—'}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">SKU оценено</p>
            <p className="text-2xl font-semibold mt-1">{formatNumber(skuCount)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
