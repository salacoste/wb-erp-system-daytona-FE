'use client'

/**
 * ModelListSection — table of ML models for the current cabinet.
 * Route: /analytics/models
 * Story 109.3-FE: 6-column table with status badges, row navigation, 3 UI states.
 * Story 109.4-FE: added 7th "Действия" column with per-row TrainModelButton + polling.
 * Migrated Story 171.6-FE: semantic status tokens, table caption, tabular-nums, layout padding.
 */

import { useState, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { useAiModels } from '@/hooks/useAiModels'
import { getModelTypeLabel } from '@/types/ai/forecast'
import { ROUTES, buildModelPerformanceRoute } from '@/lib/routes'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ENGINE_LABELS,
  MODEL_LIST_BADGE_CLASS,
  STATUS_BADGE_CONFIG,
  formatMape,
  formatTrainedAt,
} from './model-list-helpers'
import { TrainModelButton } from './TrainModelButton'

function ModelsPageShell({ children }: { children: ReactNode }) {
  // Story 171.6: (dashboard) layout already provides page padding — none route-level.
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Модели AI</h1>
        <p className="text-muted-foreground">Список ML-моделей вашего кабинета</p>
      </div>
      {children}
    </div>
  )
}

export function ModelListSection() {
  // AC-5: poll only when any model is 'training'.
  // shouldPoll is derived from data after each fetch and stored in state so the
  // polling-on/off transition is explicit and testable (F-1 fix: replaces useRef pattern).
  const [shouldPoll, setShouldPoll] = useState(false)
  const { data, isLoading, isError, error } = useAiModels({ polling: shouldPoll })

  useEffect(() => {
    const isAnyTraining = data?.models?.some(m => m.status === 'training') ?? false
    setShouldPoll(isAnyTraining)
  }, [data])

  if (isLoading) {
    return (
      <ModelsPageShell>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </ModelsPageShell>
    )
  }

  if (isError) {
    return (
      <ModelsPageShell>
        <Alert variant="destructive">
          <AlertDescription>
            Ошибка загрузки списка моделей
            {error?.message ? `: ${error.message}` : ''}
          </AlertDescription>
        </Alert>
      </ModelsPageShell>
    )
  }

  if (!data?.models?.length) {
    return (
      <ModelsPageShell>
        <Alert>
          <AlertDescription>
            Модели ещё не обучены.{' '}
            <Link href={ROUTES.ANALYTICS.FORECAST} className="underline">
              Перейдите на страницу AI Прогноз для запуска обучения.
            </Link>
          </AlertDescription>
        </Alert>
      </ModelsPageShell>
    )
  }

  return (
    <ModelsPageShell>
      <Card>
        <CardHeader>
          <CardTitle>Список моделей</CardTitle>
          <CardDescription>Список ML-моделей вашего кабинета</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            {/* Story 171.6: static caption (169.7 canon) — spec-order above header,
                visually bottom via ui Table caption-bottom. */}
            <TableCaption>Список ML-моделей вашего кабинета</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Тип</TableHead>
                <TableHead>Движок</TableHead>
                <TableHead>Версия</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>MAPE</TableHead>
                <TableHead>Обучен</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.models.map(model => {
                const badge = STATUS_BADGE_CONFIG[model.status]
                const dest = buildModelPerformanceRoute(model.id)
                return (
                  <TableRow key={model.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Link
                        href={dest}
                        className="font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {getModelTypeLabel(model.modelType)}
                      </Link>
                    </TableCell>
                    <TableCell>{ENGINE_LABELS[model.engine]}</TableCell>
                    <TableCell className="tabular-nums">v{model.version}</TableCell>
                    <TableCell>
                      {/* Story 174.2: overlay from the registry-local class map —
                          STATUS_BADGE_CONFIG carries labels + pulse only. */}
                      <Badge className={MODEL_LIST_BADGE_CLASS[model.status]}>
                        {badge.pulse && (
                          <span
                            aria-hidden="true"
                            className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-status-information"
                          />
                        )}
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">{formatMape(model.metrics.mape)}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatTrainedAt(model.trainedAt)}
                    </TableCell>
                    {/* AC-6: wrapper div stops click/keyboard propagation so the Train button
                        does not trigger the row's navigation handler. */}
                    <TableCell>
                      <div
                        role="none"
                        onClick={e => e.stopPropagation()}
                        onKeyDown={e => e.stopPropagation()}
                      >
                        <TrainModelButton
                          modelType={model.modelType}
                          currentStatus={model.status}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </ModelsPageShell>
  )
}
