'use client'

/**
 * ModelListSection — table of ML models for the current cabinet.
 * Route: /analytics/models
 * Story 109.3-FE: 6-column table with status badges, row navigation, 3 UI states.
 * Story 109.4 will add a "Действия" (Train) column — layout accommodates extension.
 */

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAiModels } from '@/hooks/useAiModels'
import { MODEL_TYPE_LABELS } from '@/types/ai/forecast'
import { ROUTES } from '@/lib/routes'
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

export function ModelListSection() {
  const router = useRouter()
  const { data, isLoading, isError, error } = useAiModels()

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.models.map(model => {
                const badge = STATUS_BADGE_CONFIG[model.status]
                const dest = `${ROUTES.ANALYTICS.MODELS}/${model.id}/performance`
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
                    <TableCell>{MODEL_TYPE_LABELS[model.modelType]}</TableCell>
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
