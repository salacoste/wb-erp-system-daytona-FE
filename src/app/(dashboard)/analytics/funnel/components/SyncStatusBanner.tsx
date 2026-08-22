/** Sync status banner for funnel page — extracted from FunnelPageContent.tsx */
'use client'

import { format } from 'date-fns'
import { Clock, AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface SyncStatus {
  lastSyncAt: string | null
  productsCount: number
}

interface SyncStatusBannerProps {
  syncStatus?: SyncStatus | null
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
}

export function SyncStatusBanner({
  syncStatus,
  isLoading,
  isError,
  onRetry,
}: SyncStatusBannerProps) {
  if (isLoading && !syncStatus) {
    return (
      <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Статус синхронизации загружается</span>
      </div>
    )
  }
  if (isError && !syncStatus) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex flex-wrap items-center justify-between gap-4">
          <span>Не удалось загрузить статус синхронизации</span>
          <Button className="min-h-11 min-w-11" variant="outline" onClick={onRetry}>
            Повторить статус синхронизации
          </Button>
        </AlertDescription>
      </Alert>
    )
  }
  if (!syncStatus) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Статус синхронизации недоступен.</AlertDescription>
      </Alert>
    )
  }
  if (!syncStatus.lastSyncAt) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Данные ещё не загружены. Синхронизация происходит ежедневно в 05:00 МСК.
        </AlertDescription>
      </Alert>
    )
  }
  const formatted = format(new Date(syncStatus.lastSyncAt), 'dd.MM.yyyy HH:mm')
  const timestamp = (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      <span>Последняя синхронизация: {formatted}</span>
      <span className="text-xs">({syncStatus.productsCount} товаров)</span>
    </div>
  )
  if (!isError) return timestamp
  return (
    <div className="space-y-2">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex flex-wrap items-center justify-between gap-4">
          <span>Показан ранее полученный статус; обновление завершилось ошибкой.</span>
          <Button className="min-h-11 min-w-11" variant="outline" onClick={onRetry}>
            Повторить статус синхронизации
          </Button>
        </AlertDescription>
      </Alert>
      {timestamp}
    </div>
  )
}
