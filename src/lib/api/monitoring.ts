/**
 * Monitoring API Client — Epic 68-FE
 * Backend endpoints: /v1/monitoring/*
 * @see docs/request-backend/149-EPIC-67-PIPELINE-HEALTH-DASHBOARD-API.md
 */

import { apiClient } from '../api-client'
import { qs } from './query-string'
import { normalizeRecoveryStatusResponse } from './recovery-normalizer'
import type {
  MonitoringDashboard,
  PipelineHealthGrid,
  GridParams,
  TelegramHealth,
  RecoveryStatusResponse,
  HealthReportSummary,
  HealthReportDetail,
} from '@/app/(dashboard)/monitoring/types/monitoring'

// --- Query Keys ---

export const monitoringQueryKeys = {
  all: ['monitoring'] as const,
  dashboard: (cabinetId: string) => ['monitoring', 'dashboard', cabinetId] as const,
  grid: (cabinetId: string, params: GridParams) =>
    ['monitoring', 'grid', cabinetId, params] as const,
  telegram: (cabinetId: string) => ['monitoring', 'telegram', cabinetId] as const,
  recovery: (cabinetId: string) => ['monitoring', 'recovery', cabinetId] as const,
  healthReports: (cabinetId: string, days: number) =>
    ['monitoring', 'health-reports', cabinetId, days] as const,
  healthReport: (cabinetId: string, date: string) =>
    ['monitoring', 'health-report', cabinetId, date] as const,
}

// --- Dashboard ---

export async function getMonitoringDashboard(cabinetId: string): Promise<MonitoringDashboard> {
  return apiClient.get<MonitoringDashboard>(`/v1/monitoring/dashboard${qs({ cabinetId })}`)
}

// --- Pipeline Health Grid ---

export async function getPipelineHealthGrid(
  cabinetId: string,
  params: GridParams = {}
): Promise<PipelineHealthGrid> {
  return apiClient.get<PipelineHealthGrid>(
    `/v1/monitoring/pipeline-health-grid${qs({
      cabinetId,
      from: params.from,
      to: params.to,
      resolution: params.resolution,
    })}`
  )
}

// --- Telegram Health ---

export async function getTelegramHealth(cabinetId: string, days = 7): Promise<TelegramHealth> {
  return apiClient.get<TelegramHealth>(`/v1/monitoring/telegram-health${qs({ cabinetId, days })}`)
}

// --- Recovery Status ---

export async function getRecoveryStatus(cabinetId: string): Promise<RecoveryStatusResponse> {
  // F-41: backend returns { success, data: [...] } → apiClient unwraps to a bare array →
  // the panel's `data.tasks` was undefined. Normalize back to { cabinetId, tasks } and
  // fill the canonical displayName (backend omits it). See request #187.
  const raw = await apiClient.get<unknown>(`/v1/monitoring/recovery-status${qs({ cabinetId })}`)
  return normalizeRecoveryStatusResponse(raw, cabinetId)
}

// --- Trigger Recovery ---

export async function triggerRecovery(data: {
  cabinetId: string
  taskType: string
  forceRetry?: boolean
  dateRange?: { from: string; to: string }
}): Promise<void> {
  return apiClient.post<void>('/v1/monitoring/recovery/trigger', data)
}

// --- Recover Data ---

export async function recoverData(data: {
  cabinetId: string
  table: string
  dates?: string[]
}): Promise<void> {
  return apiClient.post<void>('/v1/monitoring/recovery/data', data)
}

// --- Health Reports (list) ---

export async function getHealthReports(
  cabinetId: string,
  days: number
): Promise<HealthReportSummary[]> {
  return apiClient.get<HealthReportSummary[]>(
    `/v1/monitoring/health-reports${qs({ cabinetId, days })}`
  )
}

// --- Health Report (single day detail) ---

export async function getHealthReport(
  cabinetId: string,
  date: string
): Promise<HealthReportDetail> {
  return apiClient.get<HealthReportDetail>(`/v1/monitoring/health-report${qs({ cabinetId, date })}`)
}
