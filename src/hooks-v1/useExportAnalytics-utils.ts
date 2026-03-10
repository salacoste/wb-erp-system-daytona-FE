/**
 * Export Analytics - Constants, Types & Format Helpers
 * Extracted from useExportAnalytics.ts for file size compliance (Epic 74)
 */

import type { ExportStatus } from '@/types/analytics'

// ============================================================================
// Constants
// ============================================================================

/** Maximum polling time in milliseconds (2 minutes) */
export const MAX_POLLING_TIME_MS = 2 * 60 * 1000

/** Polling interval in milliseconds */
export const POLLING_INTERVAL_MS = 2000

// ============================================================================
// Types
// ============================================================================

/** Hook return type */
export interface UseExportAnalyticsReturn {
  createExport: (request: import('@/types/analytics').ExportRequest) => void
  isCreating: boolean
  status: ExportStatus | null
  isPolling: boolean
  isTimedOut: boolean
  reset: () => void
  createError: Error | null
}

// ============================================================================
// Format Helpers
// ============================================================================

/**
 * Format bytes to human-readable string
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || bytes === null) return '—'
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`
}

/**
 * Format date to Russian locale
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatExpirationDate(dateString: string | undefined): string {
  if (!dateString) return '—'

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

/**
 * Determine if polling should continue based on export status
 */
export function shouldContinuePolling(status: ExportStatus | undefined): boolean {
  if (!status) return true
  if (status.status === 'completed' || status.status === 'failed') return false
  return true
}

/**
 * Build timeout status object
 */
export function buildTimeoutStatus(exportId: string): ExportStatus {
  return {
    export_id: exportId,
    status: 'failed',
    error_message: 'Экспорт занял слишком много времени. Попробуйте еще раз.',
  }
}
