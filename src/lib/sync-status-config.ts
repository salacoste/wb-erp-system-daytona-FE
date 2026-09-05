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
 * Semantic tokens (P2 wave-5, measured /tmp/p2-w5-contrast.mjs; badge on
 * AdvertisingCard, tooltip content on popover):
 * - idle:           muted pair (7.17/8.06)
 * - syncing:        information/15 + information text (4.62/6.64)
 * - completed:      success/5 + success text (4.80/8.72)
 * - partial_success: warning/5 + warning text (4.52/12.23)
 * - failed:         SOLID error pair (6.54/9.48)
 * Same-hue success/warning text fails at /15 (4.19/3.97 light), so the soft
 * tiers use the highest passing alpha (/5); the strongest tier is solid.
 * `color` also drives the tooltip icon on popover (≥4.81 all statuses).
 */
export const syncStatusConfig: SyncStatusConfigMap = {
  idle: {
    label: 'Ожидание',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    description: 'Синхронизация не запущена',
  },
  syncing: {
    label: 'Синхронизация...',
    color: 'text-status-information',
    bgColor: 'bg-status-information/15',
    description: 'Идёт загрузка данных из WB',
    animate: true,
  },
  completed: {
    label: 'Синхронизировано',
    color: 'text-status-success',
    bgColor: 'bg-status-success/5',
    description: 'Данные актуальны',
  },
  partial_success: {
    label: 'Частично',
    color: 'text-status-warning',
    bgColor: 'bg-status-warning/5',
    description: 'Часть данных загружена с ошибками',
  },
  failed: {
    label: 'Ошибка',
    color: 'text-status-error-foreground',
    bgColor: 'bg-status-error',
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
