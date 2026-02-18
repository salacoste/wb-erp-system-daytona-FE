/**
 * Monitoring API functions — Epic 68-FE (Story 68.1)
 * Important: Monitoring endpoints use cabinetId as query parameter, NOT X-Cabinet-Id header.
 * @see docs/request-backend/149-EPIC-67-PIPELINE-HEALTH-DASHBOARD-API.md
 */

import { apiClient } from '@/lib/api-client'
import type {
  MonitoringDashboard,
  PipelineHealthGrid,
  TelegramHealth,
  RecoveryStatusResponse,
  HealthReportSummary,
  HealthReportDetail,
  DataCompletenessDetail,
  GridParams,
} from '@/app/(dashboard)/monitoring/types/monitoring'

// --- Epic 67: New Dashboard Endpoints ---

/** Lightweight dashboard summary (~2KB, 60s cache) */
export async function getMonitoringDashboard(cabinetId: string): Promise<MonitoringDashboard> {
  const params = new URLSearchParams({ cabinetId, locale: 'ru' })
  return apiClient.get(`/v1/monitoring/dashboard?${params}`)
}

/** Pipeline health grid for heatmap (~5-25KB, 30-120s cache) */
export async function getPipelineHealthGrid(
  cabinetId: string,
  gridParams: GridParams = {}
): Promise<PipelineHealthGrid> {
  const params = new URLSearchParams({ cabinetId, locale: 'ru' })
  if (gridParams.from) params.set('from', gridParams.from)
  if (gridParams.to) params.set('to', gridParams.to)
  if (gridParams.resolution) params.set('resolution', gridParams.resolution)
  if (gridParams.pipelines?.length) params.set('pipelines', gridParams.pipelines.join(','))
  return apiClient.get(`/v1/monitoring/pipeline-health-grid?${params}`)
}

/** Telegram health details (120s cache) */
export async function getTelegramHealth(cabinetId: string, days = 7): Promise<TelegramHealth> {
  const params = new URLSearchParams({ cabinetId, days: String(days) })
  return apiClient.get(`/v1/monitoring/telegram-health?${params}`)
}

// --- Epic 49: Existing Monitoring Endpoints ---

/** Recovery status for all task types */
export async function getRecoveryStatus(cabinetId: string): Promise<RecoveryStatusResponse> {
  const params = new URLSearchParams({ cabinetId })
  return apiClient.get(`/v1/monitoring/recovery-status?${params}`)
}

/** Trigger manual recovery */
export async function triggerRecovery(data: {
  cabinetId: string
  taskType: string
  forceRetry?: boolean
  dateRange?: { from: string; to: string }
}): Promise<{ success: boolean; message: string }> {
  return apiClient.post('/v1/monitoring/recover', data)
}

/** Recover missing data for a specific table */
export async function recoverData(data: {
  cabinetId: string
  table: string
  dates?: string[]
}): Promise<{ success: boolean; message: string }> {
  return apiClient.post('/v1/monitoring/recover-data', data)
}

/** Health reports list (summaries) */
export async function getHealthReports(
  cabinetId: string,
  days = 7
): Promise<HealthReportSummary[]> {
  const params = new URLSearchParams({ cabinetId, days: String(days) })
  return apiClient.get(`/v1/monitoring/health-reports?${params}`)
}

/** Single health report detail */
export async function getHealthReport(
  cabinetId: string,
  date: string
): Promise<HealthReportDetail> {
  const params = new URLSearchParams({ cabinetId, date })
  return apiClient.get(`/v1/monitoring/health-report?${params}`)
}

/** Data completeness detail (30 days) */
export async function getDataCompleteness(cabinetId: string): Promise<DataCompletenessDetail> {
  const params = new URLSearchParams({ cabinetId, days: '30' })
  return apiClient.get(`/v1/monitoring/data-completeness?${params}`)
}

/** Missing dates for a specific table */
export async function getMissingDates(cabinetId: string, table: string) {
  const params = new URLSearchParams({ cabinetId, table })
  return apiClient.get(`/v1/monitoring/missing-dates?${params}`)
}
