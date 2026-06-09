/** Sync status banner for funnel page — extracted from FunnelPageContent.tsx */
'use client'

import { format } from 'date-fns'
import { Clock, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SyncStatus {
  lastSyncAt: string | null
  productsCount: number
}

export function SyncStatusBanner({ syncStatus }: { syncStatus?: SyncStatus | null }) {
  if (!syncStatus) return null
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
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      <span>Данные актуальны на {formatted}</span>
      <span className="text-xs">({syncStatus.productsCount} товаров)</span>
    </div>
  )
}
