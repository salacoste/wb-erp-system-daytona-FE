/**
 * Backfill Utility Functions
 * Story 51.10-FE: Backfill Admin Types & Hooks
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 * @see docs/stories/epic-51/story-51.10-fe-backfill-admin-types.md
 */

import type { BackfillStatus, BackfillProgress, BackfillStatusConfig } from '@/types/backfill'

// ============================================================================
// Status Check Functions (AC5)
// ============================================================================

/** Check if backfill is currently active (running or queued) */
export function isBackfillActive(status: BackfillStatus): boolean {
  return status === 'in_progress' || status === 'pending'
}

/** Check if backfill can be started */
export function canStartBackfill(status: BackfillStatus): boolean {
  return status === 'idle' || status === 'completed' || status === 'failed'
}

/** Check if backfill can be paused */
export function canPauseBackfill(status: BackfillStatus): boolean {
  return status === 'in_progress'
}

/** Check if backfill can be resumed */
export function canResumeBackfill(status: BackfillStatus): boolean {
  return status === 'paused'
}

/** Check if cabinet backfill can be paused */
export function canPause(cabinet: { status: BackfillStatus }): boolean {
  return cabinet.status === 'in_progress'
}

/** Check if cabinet backfill can be resumed */
export function canResume(cabinet: { status: BackfillStatus }): boolean {
  return cabinet.status === 'paused'
}

/** Check if cabinet backfill can be retried */
export function canRetry(cabinet: { status: BackfillStatus }): boolean {
  return cabinet.status === 'failed'
}

// ============================================================================
// Formatting Functions (AC5)
// ============================================================================

/** Format backfill progress as human-readable string */
export function formatBackfillProgress(progress: BackfillProgress | null): string {
  if (!progress) return 'Нет данных'
  const { completed_days, total_days, percentage } = progress
  return `${completed_days} / ${total_days} дней (${percentage.toFixed(1)}%)`
}

/** Format estimated time remaining */
export function formatEstimatedTime(seconds: number | null): string {
  if (!seconds || seconds <= 0) return 'Неизвестно'
  if (seconds < 60) return '< 1 мин'
  if (seconds < 3600) return `~${Math.ceil(seconds / 60)} мин`
  return `~${Math.ceil(seconds / 3600)} ч`
}

/** Format ETA as relative time in Russian */
export function formatEtaRelative(eta: string | null): string {
  if (!eta) return '—'
  const diffMs = new Date(eta).getTime() - Date.now()
  if (diffMs < 0) return 'скоро'

  const diffMinutes = Math.floor(diffMs / 60000)
  if (diffMinutes < 60) return `через ${diffMinutes} мин.`

  const diffHours = Math.floor(diffMs / 3600000)
  if (diffHours < 24) return `через ${diffHours} ч.`

  return `через ${Math.floor(diffHours / 24)} дн.`
}

// ============================================================================
// Status Configuration (AC5)
// ============================================================================

const STATUS_CONFIG: Record<
  BackfillStatus,
  { label: string; color: string; bgColor: string; textColor: string; progressColor: string }
> = {
  idle: {
    label: 'Ожидает',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    progressColor: 'bg-gray-400',
  },
  pending: {
    label: 'В очереди',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    progressColor: 'bg-yellow-500',
  },
  in_progress: {
    label: 'Выполняется',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    progressColor: 'bg-blue-500',
  },
  completed: {
    label: 'Завершено',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    progressColor: 'bg-green-500',
  },
  failed: {
    label: 'Ошибка',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    progressColor: 'bg-red-500',
  },
  paused: {
    label: 'Приостановлено',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    progressColor: 'bg-orange-500',
  },
}

/** Get human-readable label for status */
export function getStatusLabel(status: BackfillStatus): string {
  return STATUS_CONFIG[status].label
}

/** Get color name for status */
export function getStatusColor(status: BackfillStatus): string {
  return STATUS_CONFIG[status].color
}

/** Get Tailwind class for progress bar color based on status */
export function getProgressColorClass(status: BackfillStatus): string {
  return STATUS_CONFIG[status].progressColor
}

/** Get full status configuration for UI display */
export function getStatusConfig(status: BackfillStatus): BackfillStatusConfig {
  const cfg = STATUS_CONFIG[status]
  return { label: cfg.label, color: cfg.textColor, bgColor: cfg.bgColor }
}
