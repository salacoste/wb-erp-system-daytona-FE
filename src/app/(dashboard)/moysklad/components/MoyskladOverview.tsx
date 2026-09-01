'use client'

/**
 * Обзор tab — health details + matched/pending summary + sync button.
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useMoyskladHealth, useMoyskladMappings } from '@/hooks/useMoyskladQueries'
import { MoyskladSyncButton } from './MoyskladSyncButton'
import { AlertCircle } from 'lucide-react'

export function MoyskladOverview() {
  const healthView = useMoyskladHealth()
  const { data: health, isLoading } = healthView
  // Counts: backend-filtered `.total` via lightweight `limit:1` queries — robust
  // past the 100-row sample cap (row-filtering a `limit:500` view under-counts
  // cabinets with >500 SKUs).
  const matchedView = useMoyskladMappings({ matched: true, limit: 1 })
  const pendingView = useMoyskladMappings({ matched: false, limit: 1 })
  const allCountView = useMoyskladMappings({ limit: 1 })

  const matched = matchedView.data?.total ?? null
  const pending = pendingView.data?.total ?? null
  const allTotal = allCountView.data?.total ?? null
  const queryViews = [healthView, matchedView, pendingView, allCountView]
  const hasFailure = queryViews.some(view => view.isError)
  const hasRetainedFailure = queryViews.some(view => view.isError && view.data !== undefined)

  const renderCount = (view: typeof matchedView, value: number | null) => {
    if (view.isLoading) return <Skeleton className="h-8 w-12" />
    if (view.isError && view.data === undefined) {
      return <span className="text-sm font-medium text-destructive">Недоступно</span>
    }
    return value ?? 0
  }

  return (
    <div className="space-y-4">
      {hasFailure && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {hasRetainedFailure
              ? 'Не удалось обновить часть обзора. Показаны последние доступные данные.'
              : 'Часть данных обзора недоступна. Остальные источники продолжают отображаться.'}
          </AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap gap-3">
        <Card className="min-w-[12rem]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Привязаны</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{renderCount(matchedView, matched)}</div>
          </CardContent>
        </Card>
        <Card className="min-w-[12rem]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Не привязаны
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-status-warning">
              {renderCount(pendingView, pending)}
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-[12rem]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Всего товаров
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{renderCount(allCountView, allTotal)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Синхронизация</CardTitle>
        </CardHeader>
        <CardContent>
          <MoyskladSyncButton />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Подключение</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {isLoading ? (
            <Skeleton className="h-6 w-full" />
          ) : healthView.isError && health === undefined ? (
            <p className="font-medium text-destructive">Статус подключения недоступен</p>
          ) : (
            <>
              <div>
                Статус: <span className="font-medium">{health?.status || '—'}</span>
              </div>
              <div>
                Только чтение:{' '}
                <span className="font-medium">{health?.readOnly ? 'да' : 'нет'}</span>
              </div>
              <div>
                Токен:{' '}
                <span className="font-medium">
                  {health?.tokenConfigured ? 'настроен' : 'не настроен'}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
