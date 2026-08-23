/**
 * Monitoring Boundary Normalizer — dashboard, health-reports, health-report
 *
 * Normalizes responses from:
 * - GET /v1/monitoring/dashboard
 * - GET /v1/monitoring/health-reports
 * - GET /v1/monitoring/health-report
 */

import { asRecord, toCount, toNullableNumber, toStr, toOptionalString } from './normalizer-helpers'
import type {
  MonitoringDashboard,
  DashboardSystem,
  DashboardPipeline,
  DashboardTelegram,
  DataCompletenessTable,
  DashboardDataCompleteness,
  HealthReportSummary,
  HealthReportDetail,
  HealthReportIssue,
} from '@/app/(dashboard)/monitoring/types/monitoring'

function normalizeDashboardSystem(raw: unknown): DashboardSystem {
  const r = asRecord(raw)
  return {
    overallStatus: (toStr(r.overallStatus) || 'healthy') as DashboardSystem['overallStatus'],
    healthScore: toCount(r.healthScore),
    lastReportDate: toOptionalString(r.lastReportDate) ?? null,
    activeAlerts: toCount(r.activeAlerts),
  }
}

function normalizeDashboardPipeline(raw: unknown): DashboardPipeline {
  const r = asRecord(raw)
  return {
    pipelineId: toStr(r.pipelineId),
    displayName: toStr(r.displayName),
    category: (toStr(r.category) || 'daily') as DashboardPipeline['category'],
    status: (toStr(r.status) || 'no_data') as DashboardPipeline['status'],
    lastSuccessAt: toOptionalString(r.lastSuccessAt) ?? null,
    dataLagMinutes: toNullableNumber(r.dataLagMinutes),
    dataLagDisplay: toOptionalString(r.dataLagDisplay) || null,
    successRate24h: toNullableNumber(r.successRate24h) ?? 0,
    // REQ-201: backend dashboard now returns these (was pipeline-health-grid only)
    errorRate: toNullableNumber(r.errorRate) ?? 0,
    tasksWithErrors: toNullableNumber(r.tasksWithErrors) ?? 0,
    totalResultErrors: toNullableNumber(r.totalResultErrors) ?? 0,
  }
}

function normalizeDashboardTelegram(raw: unknown): DashboardTelegram {
  const r = asRecord(raw)
  return {
    status: (toStr(r.status) || 'not_configured') as DashboardTelegram['status'],
    deliveryRate7d: toNullableNumber(r.deliveryRate7d) ?? 0,
    recentFailures: toCount(r.recentFailures),
  }
}

function normalizeDataCompletenessTable(raw: unknown): DataCompletenessTable {
  const r = asRecord(raw)
  return {
    table: toStr(r.table),
    displayName: toStr(r.displayName),
    completenessRatio: toNullableNumber(r.completenessRatio) ?? 0,
    status: (toStr(r.status) || 'incomplete') as DataCompletenessTable['status'],
  }
}

function normalizeDashboardDataCompleteness(raw: unknown): DashboardDataCompleteness {
  const r = asRecord(raw)
  return {
    overallHealth: (toStr(r.overallHealth) ||
      'healthy') as DashboardDataCompleteness['overallHealth'],
    tables: (Array.isArray(r.tables) ? r.tables : []).map(normalizeDataCompletenessTable),
  }
}

function normalizeHealthReportIssue(raw: unknown): HealthReportIssue {
  const r = asRecord(raw)
  return {
    severity: (toStr(r.severity) || 'info') as HealthReportIssue['severity'],
    category: toStr(r.category),
    description: toStr(r.description),
    affectedDates: toOptionalString(r.affectedDates),
  }
}

export function normalizeMonitoringDashboardResponse(raw: unknown): MonitoringDashboard {
  const r = asRecord(raw)
  return {
    cabinetId: toStr(r.cabinetId),
    generatedAt: toStr(r.generatedAt),
    system: normalizeDashboardSystem(r.system),
    pipelines: (Array.isArray(r.pipelines) ? r.pipelines : []).map(normalizeDashboardPipeline),
    telegram: normalizeDashboardTelegram(r.telegram),
    dataCompleteness: normalizeDashboardDataCompleteness(r.dataCompleteness),
  }
}

export function normalizeHealthReportsResponse(raw: unknown): HealthReportSummary[] {
  if (!Array.isArray(raw)) return []
  return raw.map(item => {
    const r = asRecord(item)
    return {
      date: toStr(r.date),
      status: (toStr(r.status) || 'healthy') as HealthReportSummary['status'],
      issues: toCount(r.issues),
    }
  })
}

export function normalizeHealthReportDetailResponse(raw: unknown): HealthReportDetail {
  const r = asRecord(raw)
  const summ = asRecord(r.summary)
  const exec = asRecord(r.taskExecution)
  const dc = asRecord(r.dataCompleteness)
  const dcNorm: HealthReportDetail['dataCompleteness'] = {}
  for (const [key, val] of Object.entries(dc)) {
    const v = asRecord(val)
    dcNorm[key] = {
      ratio: toNullableNumber(v.ratio) ?? 0,
      status: toStr(v.status),
      missingCount: toCount(v.missingCount),
    }
  }
  return {
    cabinetId: toStr(r.cabinetId),
    reportDate: toStr(r.reportDate),
    generatedAt: toStr(r.generatedAt),
    summary: {
      overallStatus: (toStr(summ.overallStatus) ||
        'healthy') as HealthReportDetail['summary']['overallStatus'],
      tasksExecuted: toCount(summ.tasksExecuted),
      tasksFailed: toCount(summ.tasksFailed),
      tasksPending: toCount(summ.tasksPending),
      dataCompletenessAvg: toNullableNumber(summ.dataCompletenessAvg) ?? 0,
    },
    taskExecution: {
      success: Array.isArray(exec.success) ? exec.success : [],
      failed: Array.isArray(exec.failed) ? exec.failed : [],
      notRun: Array.isArray(exec.notRun) ? exec.notRun : [],
    },
    dataCompleteness: dcNorm,
    issues: (Array.isArray(r.issues) ? r.issues : []).map(normalizeHealthReportIssue),
    recommendations: (Array.isArray(r.recommendations) ? r.recommendations : []).map(String),
  }
}
