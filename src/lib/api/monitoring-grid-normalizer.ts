/**
 * Monitoring Pipeline Health Grid Boundary Normalizer
 *
 * Normalizes response from GET /v1/monitoring/pipeline-health-grid
 */

import { asRecord, toCount, toNullableNumber, toStr, toOptionalString } from './normalizer-helpers'
import type {
  PipelineHealthGrid,
  GridPipeline,
  GridSummary,
  HeatmapCell,
  HeatmapCellError,
} from '@/app/(dashboard)/monitoring/types/monitoring'

function normalizeHeatmapCellError(raw: unknown): HeatmapCellError {
  const r = asRecord(raw)
  return {
    timestamp: toStr(r.timestamp),
    taskUuid: toStr(r.taskUuid),
    errorMessage: toStr(r.errorMessage),
    retryAttempt: toCount(r.retryAttempt),
    wasRecovered: Boolean(r.wasRecovered),
  }
}

function normalizeHeatmapCell(raw: unknown): HeatmapCell {
  const r = asRecord(raw)
  return {
    periodStart: toStr(r.periodStart),
    periodEnd: toStr(r.periodEnd),
    status: (toStr(r.status) || 'no_data') as HeatmapCell['status'],
    executionsExpected: toCount(r.executionsExpected),
    executionsActual: toCount(r.executionsActual),
    successCount: toCount(r.successCount),
    failureCount: toCount(r.failureCount),
    cancelledCount: toCount(r.cancelledCount),
    avgDurationMs: toNullableNumber(r.avgDurationMs),
    maxDurationMs: toNullableNumber(r.maxDurationMs),
    totalRowsProcessed: toNullableNumber(r.totalRowsProcessed),
    errors: (Array.isArray(r.errors) ? r.errors : []).map(normalizeHeatmapCellError),
  }
}

function normalizeGridPipeline(raw: unknown): GridPipeline {
  const r = asRecord(raw)
  return {
    pipelineId: toStr(r.pipelineId),
    displayName: toStr(r.displayName),
    category: (toStr(r.category) || 'daily') as GridPipeline['category'],
    expectedFrequency: toStr(r.expectedFrequency),
    cronExpression: toStr(r.cronExpression),
    dataTable: toOptionalString(r.dataTable) ?? null,
    status: (toStr(r.status) || 'no_data') as GridPipeline['status'],
    healthScore: toCount(r.healthScore),
    lastSuccessAt: toOptionalString(r.lastSuccessAt) ?? null,
    lastFailureAt: toOptionalString(r.lastFailureAt) ?? null,
    nextExpectedAt: toOptionalString(r.nextExpectedAt) ?? null,
    dataLagMinutes: toNullableNumber(r.dataLagMinutes),
    dataLagDisplay: toOptionalString(r.dataLagDisplay)?.trim() || null,
    successRate: toNullableNumber(r.successRate) ?? 0,
    totalExecutions: toCount(r.totalExecutions),
    totalFailures: toCount(r.totalFailures),
    avgDurationMs: toNullableNumber(r.avgDurationMs),
    totalRowsProcessed: toNullableNumber(r.totalRowsProcessed),
    errorRate: toNullableNumber(r.errorRate) ?? 0,
    tasksWithErrors: toCount(r.tasksWithErrors),
    totalResultErrors: toCount(r.totalResultErrors),
    cells: (Array.isArray(r.cells) ? r.cells : []).map(normalizeHeatmapCell),
  }
}

function normalizeGridSummary(raw: unknown): GridSummary {
  const r = asRecord(raw)
  return {
    overallStatus: (toStr(r.overallStatus) || 'healthy') as GridSummary['overallStatus'],
    healthScore: toCount(r.healthScore),
    totalPipelines: toCount(r.totalPipelines),
    healthyPipelines: toCount(r.healthyPipelines),
    degradedPipelines: toCount(r.degradedPipelines),
    criticalPipelines: toCount(r.criticalPipelines),
    totalExecutions: toCount(r.totalExecutions),
    totalFailures: toCount(r.totalFailures),
    successRate: toNullableNumber(r.successRate) ?? 0,
  }
}

export function normalizePipelineHealthGridResponse(raw: unknown): PipelineHealthGrid {
  const r = asRecord(raw)
  const per = asRecord(r.period)
  return {
    cabinetId: toStr(r.cabinetId),
    generatedAt: toStr(r.generatedAt),
    period: { from: toStr(per.from), to: toStr(per.to) },
    resolution: (toStr(r.resolution) || 'day') as PipelineHealthGrid['resolution'],
    summary: normalizeGridSummary(r.summary),
    pipelines: (Array.isArray(r.pipelines) ? r.pipelines : []).map(normalizeGridPipeline),
  }
}
