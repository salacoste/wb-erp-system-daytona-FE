/**
 * SuppliesPageHeader Component
 * Story 53.2-FE: Supplies List Page
 * Epic 53-FE: Supply Management UI
 *
 * Page header with title, subtitle, sync button and create button.
 * Reference: docs/stories/epic-53/story-53.2-fe-supplies-list-page.md#AC2
 */

'use client'

import { Package, RefreshCw, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SyncStatusIndicator } from './SyncStatusIndicator'

export interface SuppliesPageHeaderProps {
  /** Last sync timestamp (ISO string) */
  lastSyncAt: string | null
  /** Next available sync time (for rate limit countdown) */
  nextSyncAt: string | null
  /** Whether sync is in progress */
  isSyncing: boolean
  /** Callback to trigger sync */
  onSync: () => void
  /** Callback to open create modal */
  onCreateClick: () => void
}

/**
 * SuppliesPageHeader - Page header with title and action controls
 */
export function SuppliesPageHeader({
  lastSyncAt,
  nextSyncAt,
  isSyncing,
  onSync,
  onCreateClick,
}: SuppliesPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Title section */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Package className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Поставки FBS</h1>
          <p className="text-sm text-muted-foreground">
            Управление поставками и отслеживание статусов
          </p>
        </div>
      </div>

      {/* Action controls */}
      <div className="flex items-center gap-3">
        {/* Sync status */}
        <SyncStatusIndicator
          lastSyncAt={lastSyncAt}
          nextSyncAt={nextSyncAt}
          isLoading={isSyncing}
        />

        {/* Sync button */}
        <Button variant="outline" size="sm" onClick={onSync} disabled={isSyncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          Обновить статусы
        </Button>

        {/* Create button */}
        <Button size="sm" onClick={onCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Создать поставку
        </Button>
      </div>
    </div>
  )
}

export default SuppliesPageHeader
