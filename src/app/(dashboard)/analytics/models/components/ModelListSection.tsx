'use client'

/**
 * ModelListSection — table of ML models for the current cabinet.
 * Route: /analytics/models
 * Story 109.3-FE: 6-column table with status badges, row navigation, 3 UI states.
 * Story 109.4-FE: added 7th "Действия" column with per-row TrainModelButton + polling.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ENGINE_LABELS,
  STATUS_BADGE_CONFIG,
  formatMape,
  formatTrainedAt,
} from './model-list-helpers'
import { TrainModelButton } from './TrainModelButton'

export function ModelListSection() {
  const router = useRouter()

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
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Ошибка загрузки списка моделей
            {error?.message ? `: ${error.message}` : ''}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!data?.models?.length) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>
            Модели ещё не обучены.{' '}
            <Link href={ROUTES.ANALYTICS.FORECAST} className="underline">
              Перейдите на страницу AI Прогноз для запуска обучения.
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Модели AI</CardTitle>
          <CardDescription>Список ML-моделей вашего кабинета</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
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
                  <TableRow
                    key={model.id}
                    className="cursor-pointer hover:bg-muted/50 focus:ring-2 focus:ring-ring focus:outline-none"
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(dest)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        router.push(dest)
                      }
                    }}
                  >
                    <TableCell>{getModelTypeLabel(model.modelType)}</TableCell>
                    <TableCell>{ENGINE_LABELS[model.engine]}</TableCell>
                    <TableCell>v{model.version}</TableCell>
                    <TableCell>
                      <Badge className={badge.className}>
                        {badge.pulse && (
                          <span
                            aria-hidden="true"
                            className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500"
                          />
                        )}
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatMape(model.metrics.mape)}</TableCell>
                    <TableCell>{formatTrainedAt(model.trainedAt)}</TableCell>
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
    </div>
  )
}
