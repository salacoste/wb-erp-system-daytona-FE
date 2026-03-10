/**
 * Monitoring recovery status and health report types — Epic 68-FE
 * Extracted from monitoring.ts for Story 74.8 (file size compliance)
 *
 * Types for recovery-status, health-reports, and health-report endpoints.
 */

import type { RecoveryStatus, OverallStatus } from './monitoring-enums'

// --- Epic 49: Recovery Status (GET /v1/monitoring/recovery-status) ---

export interface RecoveryTask {
  taskType: string
  displayName: string
  lastAttempt: string | null
  totalAttempts: number
  maxRetries: number
  status: RecoveryStatus
  canRetry: boolean
  cooldownMinutes: number
  maxWindowDays: number
}

export interface RecoveryStatusResponse {
  cabinetId: string
  tasks: RecoveryTask[]
}

// --- Epic 49: Health Reports (GET /v1/monitoring/health-reports) ---

/** List item from GET /v1/monitoring/health-reports */
export interface HealthReportSummary {
  date: string
  status: OverallStatus
  issues: number
}

export interface HealthReportIssue {
  severity: 'critical' | 'warning' | 'info'
  category: string
  description: string
  affectedDates?: string
}

/** Detail from GET /v1/monitoring/health-report?date=... */
export interface HealthReportDetail {
  cabinetId: string
  reportDate: string
  generatedAt: string
  summary: {
    overallStatus: OverallStatus
    tasksExecuted: number
    tasksFailed: number
    tasksPending: number
    dataCompletenessAvg: number
  }
  taskExecution: { success: unknown[]; failed: unknown[]; notRun: unknown[] }
  dataCompleteness: Record<string, { ratio: number; status: string; missingCount: number }>
  issues: HealthReportIssue[]
  recommendations: string[]
}

// --- Tab type ---

export type MonitoringTab = 'overview' | 'heatmap' | 'recovery' | 'history'
