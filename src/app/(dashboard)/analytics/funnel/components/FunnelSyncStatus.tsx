'use client'

import { useFunnelSyncStatus } from '@/hooks/use-funnel-analytics'
import { SyncStatusBanner } from './SyncStatusBanner'

export function FunnelSyncStatus() {
  const { data, isLoading, isError, refetch } = useFunnelSyncStatus()

  return (
    <SyncStatusBanner
      syncStatus={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => void refetch()}
    />
  )
}
