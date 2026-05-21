'use client'

/**
 * EvaluationsList — evaluations list page for a single AI model.
 * Story 110.2-FE: dual-hook (useAiModels + useAiEvaluations), sortable table,
 * state-precedence chain: loading → list-error → model-not-found → evaluations-error → happy.
 * Table extracted to EvaluationsTable.tsx; sort helpers in evaluations-list-helpers.ts.
 * Header extracted to EvaluationsHeaderCard.tsx (Story 112.4-FE, A-5).
 */

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAiModels } from '@/hooks/useAiModels'
import { useAiEvaluations } from '@/hooks/useAiEvaluations'
import { ROUTES, buildModelSkuAccuracyRoute } from '@/lib/routes'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { EvaluationsTable } from './EvaluationsTable'
import { EvaluationsHeaderCard } from './EvaluationsHeaderCard'
import type { SortColumn, SortDirection } from './evaluations-list-helpers'

interface EvaluationsListProps {
  modelId: string
}

export function EvaluationsList({ modelId }: EvaluationsListProps) {
  const router = useRouter()
  const [sortCol, setSortCol] = useState<SortColumn>('mapeUnits')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')

  const {
    data: modelsData,
    isLoading: modelsLoading,
    isError: modelsError,
    error: modelsListError,
  } = useAiModels()

  const {
    data: evalData,
    isLoading: evalLoading,
    isError: evalError,
    error: evalErr,
  } = useAiEvaluations(modelId)

  const isLoading = modelsLoading || evalLoading

  // State-precedence chain (Story 109.5 post-2nd-pass F-17):
  // loading → list-error → model-not-found → evaluations-error → happy.
  if (isLoading) {
    return (
      <div className="space-y-6 p-6" data-testid="evaluations-skeleton">
        <Skeleton className="h-8 w-64" data-testid="evaluations-skeleton-header" />
        <Skeleton className="h-32 w-full" data-testid="evaluations-skeleton-summary" />
        <Skeleton className="h-64 w-full" data-testid="evaluations-skeleton-table" />
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

  if (evalError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Ошибка загрузки оценок модели
            {evalErr?.message ? `: ${evalErr.message}` : ''}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const evaluations = evalData?.evaluations ?? []

  function handleSortClick(col: SortColumn) {
    if (sortCol === col) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  function handleRowClick(nmId: number | null) {
    if (nmId === null) return
    router.push(`${buildModelSkuAccuracyRoute(modelId)}?nmId=${nmId}`)
  }

  return (
    <div className="space-y-6 p-6">
      <EvaluationsHeaderCard model={model} data={evalData} modelId={modelId} />

      {evaluations.length === 0 ? (
        <Alert>
          <AlertDescription>
            Нет оценок этой модели. Модель должна быть оценена хотя бы один раз для появления данных
            здесь.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <EvaluationsTable
              entries={evaluations}
              sortCol={sortCol}
              sortDir={sortDir}
              onSortClick={handleSortClick}
              onRowClick={handleRowClick}
              modelId={modelId}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
