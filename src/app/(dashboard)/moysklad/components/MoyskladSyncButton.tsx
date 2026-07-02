'use client'

/**
 * МойСклад sync button — POST /sync → OUR DB (D43/D44: never writes to МойСклад).
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 * Mirrors useManualSync: disabled while syncing / rate-limited, countdown shown.
 */

import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useMoyskladSync } from '@/hooks/useMoyskladSync'
import { formatDateTime } from '@/lib/formatters'

export function MoyskladSyncButton() {
  const { sync, isSyncing, canSync, lastSyncAt, rateLimitCountdown, status, error } =
    useMoyskladSync()

  const statusText = isSyncing
    ? 'Синхронизация…'
    : status === 'completed'
      ? lastSyncAt
        ? `Обновлено: ${formatDateTime(lastSyncAt)}`
        : 'Обновлено'
      : status === 'failed' || error
        ? 'Ошибка синхронизации'
        : lastSyncAt
          ? `Обновлено: ${formatDateTime(lastSyncAt)}`
          : 'Синхронизация не запускалась'

  const hint =
    !canSync && rateLimitCountdown > 0 && !isSyncing
      ? ` (повтор через ${rateLimitCountdown} с)`
      : ''

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        onClick={sync}
        disabled={!canSync}
        aria-label="Синхронизировать данные МойСклад"
      >
        <RefreshCw className={isSyncing ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4'} />
        Синхронизировать
      </Button>
      <span className="text-xs text-muted-foreground" role="status" aria-live="polite">
        {statusText}
        {hint}
      </span>
    </div>
  )
}
