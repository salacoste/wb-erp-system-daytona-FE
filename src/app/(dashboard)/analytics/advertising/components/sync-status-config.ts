/**
 * Sync Status configuration constants.
 * Extracted from SyncStatusIndicator.tsx for file size compliance.
 */

import type { HealthStatus, SyncTaskStatus } from '@/types/advertising-analytics'

// ============================================================================
// Health Status Configuration
// ============================================================================

export interface HealthStatusConfig {
  /** Russian label for the status */
  label: string
  /** Dot color class (Tailwind) */
  dotColor: string
  /** Description text */
  description: string
}

/**
 * Health status configuration.
 *
 * Note: Backend marks sync as "stale" after 26 hours (not 24h).
 * Rationale: 24h daily sync schedule + 2h buffer for network delays and retry attempts.
 */
export const healthStatusConfig: Record<HealthStatus, HealthStatusConfig> = {
  healthy: {
    label: 'Синхронизировано',
    dotColor: 'bg-green-500',
    description: 'Данные актуальны',
  },
  degraded: {
    label: 'Частичная синхронизация',
    dotColor: 'bg-yellow-500',
    description: 'Есть ошибки, но синхронизация работает',
  },
  unhealthy: {
    label: 'Ошибка синхронизации',
    dotColor: 'bg-red-500',
    description: 'Синхронизация не работает',
  },
  stale: {
    label: 'Данные устарели',
    dotColor: 'bg-orange-500',
    // 26h = 24h daily sync + 2h buffer for delays
    description: 'Нет синхронизации более 26 часов',
  },
}

/**
 * Sync task status configuration.
 * @see Request #72 backend-response for status values
 */
export const syncTaskStatusConfig: Record<SyncTaskStatus, string> = {
  syncing: 'Синхронизация...',
  completed: 'Завершено',
  failed: 'Ошибка',
  idle: 'Ожидание',
}
