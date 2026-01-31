/**
 * Sync Status Configuration
 * Story 63.3-FE: Advertising Sync Status Badge
 *
 * Configuration for sync status badge display colors, labels, and icons.
 */

import type { SyncStatusConfigMap, ExtendedSyncTaskStatus } from '@/types/advertising-sync-status'

/**
 * Status configuration for sync badge display.
 * Maps each status to its visual properties.
 *
 * Colors per spec:
 * - idle: Gray (#9CA3AF)
 * - syncing: Blue (#3B82F6)
 * - completed: Green (#22C55E)
 * - partial_success: Yellow (#F59E0B)
 * - failed: Red (#EF4444)
 */
export const syncStatusConfig: SyncStatusConfigMap = {
  idle: {
    label: 'Ожидание',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    description: 'Синхронизация не запущена',
  },
  syncing: {
    label: 'Синхронизация...',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Идёт загрузка данных из WB',
    animate: true,
  },
  completed: {
    label: 'Синхронизировано',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'Данные актуальны',
  },
  partial_success: {
    label: 'Частично',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    description: 'Часть данных загружена с ошибками',
  },
  failed: {
    label: 'Ошибка',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: 'Синхронизация не удалась',
  },
}

/**
 * Get sync status configuration by status key.
 * Returns idle config for unknown statuses.
 */
export function getSyncStatusConfig(status: ExtendedSyncTaskStatus) {
  return syncStatusConfig[status] ?? syncStatusConfig.idle
}
