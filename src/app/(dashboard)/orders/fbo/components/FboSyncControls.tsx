/**
 * FBO Sync Controls — sync trigger button + sync status indicator.
 * Russian locale for all labels.
 */

'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw } from 'lucide-react'
import { useSyncOrdersFbo, useOrdersFboSyncStatus } from '@/hooks/useOrdersFbo'

interface FboSyncControlsProps {
  canSync?: boolean
}

export function FboSyncControls({ canSync = true }: FboSyncControlsProps) {
  const { data: syncStatus } = useOrdersFboSyncStatus()
  const { mutate: triggerSync, isPending: isSyncing } = useSyncOrdersFbo()

  return (
    <div className="flex items-center gap-3">
      {syncStatus && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant={syncStatus.enabled ? 'default' : 'secondary'}>
            {syncStatus.enabled ? 'Активен' : 'Выключен'}
          </Badge>
          <span>{syncStatus.schedule}</span>
        </div>
      )}
      {canSync && (
        <Button
          variant="outline"
          size="sm"
          disabled={isSyncing}
          onClick={() => triggerSync()}
          aria-label="Синхронизировать FBO заказы"
        >
          <RefreshCw className={`mr-1 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Синхронизация...' : 'Синхронизировать'}
        </Button>
      )}
    </div>
  )
}
