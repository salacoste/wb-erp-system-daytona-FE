'use client'

/**
 * Обзор tab — health details + matched/pending summary + sync button.
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useMoyskladHealth, useMoyskladMappings } from '@/hooks/useMoyskladQueries'
import { MoyskladSyncButton } from './MoyskladSyncButton'

export function MoyskladOverview() {
  const { data: health, isLoading } = useMoyskladHealth()
  // Counts: backend-filtered `.total` via lightweight `limit:1` queries — robust
  // past the 100-row sample cap (row-filtering a `limit:500` view under-counts
  // cabinets with >500 SKUs).
  const matchedView = useMoyskladMappings({ matched: true, limit: 1 })
  const pendingView = useMoyskladMappings({ matched: false, limit: 1 })
  const allCountView = useMoyskladMappings({ limit: 1 })

  const matched = matchedView.data?.total ?? null
  const pending = pendingView.data?.total ?? null
  const allTotal = allCountView.data?.total ?? null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Card className="min-w-[12rem]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Привязаны</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {matchedView.isLoading ? <Skeleton className="h-8 w-12" /> : (matched ?? 0)}
            </div>
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
              {pendingView.isLoading ? <Skeleton className="h-8 w-12" /> : (pending ?? 0)}
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
            <div className="text-2xl font-bold">
              {allCountView.isLoading ? <Skeleton className="h-8 w-12" /> : (allTotal ?? 0)}
            </div>
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
