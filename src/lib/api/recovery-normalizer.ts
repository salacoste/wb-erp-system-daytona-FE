/**
 * Recovery-status Boundary Normalizer — Validation F-41.
 *
 * GET /v1/monitoring/recovery-status returns `{ success, data: RecoveryTask[] }`, and
 * apiClient auto-unwraps the `{ data }` envelope → the hook received a bare array →
 * RecoveryPanel read `data.tasks` (undefined) → the Recovery tab showed "no tasks" despite
 * tasks existing. Worse, the backend items carry only
 * { taskType, status, lastAttempt, totalAttempts, canRetry } — NOT the displayName /
 * maxRetries / cooldownMinutes / maxWindowDays the panel renders (backend request #187).
 *
 * This normalizer rebuilds the canonical `{ cabinetId, tasks }` shape and fills the
 * canonical `displayName` from the taskType (the backend omits it). maxRetries /
 * cooldownMinutes / maxWindowDays stay undefined when absent — they are now optional on
 * RecoveryTask and the panel degrades gracefully until #187 lands.
 */

import type {
  RecoveryStatusResponse,
  RecoveryTask,
} from '@/app/(dashboard)/monitoring/types/monitoring-reports'

/** taskType → Russian display name (backend omits displayName; see #187). */
const RECOVERY_TASK_LABELS: Record<string, string> = {
  adv_sync: 'Синхронизация рекламы',
  daily_sales_sync: 'Ежедневные продажи',
  product_sync: 'Синхронизация товаров',
  stocks_sync: 'Синхронизация остатков',
  paid_storage_import: 'Платное хранение',
  ml_training: 'Обучение ML-моделей',
}

/** Resolve a display name: known label → backend-provided → raw taskType → never blank. */
export function recoveryTaskDisplayName(taskType: string, backendName?: unknown): string {
  return (
    RECOVERY_TASK_LABELS[taskType] ??
    (typeof backendName === 'string' && backendName
      ? backendName
      : taskType || 'Неизвестная задача')
  )
}

/**
 * Normalize the recovery-status response into `{ cabinetId, tasks }`.
 * Accepts the apiClient-unwrapped bare array (prod) or a `{ tasks }` / `{ data }` wrapper.
 */
export function normalizeRecoveryStatusResponse(
  raw: unknown,
  cabinetId: string
): RecoveryStatusResponse {
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { tasks?: unknown })?.tasks)
      ? (raw as { tasks: unknown[] }).tasks
      : Array.isArray((raw as { data?: unknown })?.data)
        ? (raw as { data: unknown[] }).data
        : []

  const tasks: RecoveryTask[] = arr
    .filter((t): t is Record<string, unknown> => typeof t === 'object' && t !== null)
    .map(t => {
      const taskType = String(t.taskType ?? '')
      return {
        ...t,
        taskType,
        displayName: recoveryTaskDisplayName(taskType, t.displayName),
      } as RecoveryTask
    })

  return { cabinetId, tasks }
}
