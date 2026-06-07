/**
 * Recovery-status Boundary Normalizer — Validation F-41.
 *
 * GET /v1/monitoring/recovery-status returns `{ success, data: RecoveryTask[] }`.
 * Request #187 RESOLVED (2026-06-06): backend now returns displayName, maxRetries,
 * cooldownMinutes, maxWindowDays per task. The normalizer passes these through;
 * the RECOVERY_TASK_LABELS map serves as a fallback for older backend versions.
 */

import { toNullableNumber } from './normalizer-helpers'
import type {
  RecoveryStatusResponse,
  RecoveryTask,
} from '@/app/(dashboard)/monitoring/types/monitoring-reports'

/** taskType → Russian display name (fallback when backend omits displayName). */
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
      // #187: prefer backend displayName; fall back to FE-derived label
      const displayName =
        typeof t.displayName === 'string' && t.displayName
          ? t.displayName
          : recoveryTaskDisplayName(taskType)
      return {
        ...t,
        taskType,
        displayName,
        maxRetries: toNullableNumber(t.maxRetries) ?? undefined,
        cooldownMinutes: toNullableNumber(t.cooldownMinutes) ?? undefined,
        maxWindowDays: toNullableNumber(t.maxWindowDays) ?? undefined,
      } as RecoveryTask
    })

  return { cabinetId, tasks }
}
