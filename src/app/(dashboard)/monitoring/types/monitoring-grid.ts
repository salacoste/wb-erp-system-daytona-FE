/**
 * Monitoring pipeline health grid types — Epic 68-FE
 * Extracted from monitoring.ts for Story 74.8 (file size compliance)
 *
 * Types for GET /v1/monitoring/pipeline-health-grid endpoint.
 */

import type {
  CellStatus,
  OverallStatus,
  PipelineCategory,
  PipelineStatus,
  HeatmapResolution,
} from './monitoring-enums'

// --- Pipeline Health Grid (GET /v1/monitoring/pipeline-health-grid) ---

export interface HeatmapCellError {
  timestamp: string
  taskUuid: string
  errorMessage: string
  retryAttempt: number
  wasRecovered: boolean
}

export interface HeatmapCell {
  periodStart: string
  periodEnd: string
  status: CellStatus
  executionsExpected: number
  executionsActual: number
  successCount: number
  failureCount: number
  cancelledCount: number
  avgDurationMs: number | null
  maxDurationMs: number | null
  totalRowsProcessed: number | null
  errors: HeatmapCellError[]
}

export interface GridPipeline {
  pipelineId: string
  displayName: string
  category: PipelineCategory
  expectedFrequency: string
  cronExpression: string
  dataTable: string | null
  status: PipelineStatus
  healthScore: number
  lastSuccessAt: string | null
  lastFailureAt: string | null
  nextExpectedAt: string | null
  dataLagMinutes: number | null
  successRate: number
  totalExecutions: number
  totalFailures: number
  avgDurationMs: number | null
  totalRowsProcessed: number | null
  // Story 91.3-FE: Backend Epics 89-93 — error rate fields (optional, normalizer provides ?? 0)
  errorRate?: number // 0-1, proportion of completed tasks with errors
  tasksWithErrors?: number // count of tasks with errors
  totalResultErrors?: number // total error count across those tasks
  cells: HeatmapCell[]
}

export interface GridSummary {
  overallStatus: OverallStatus
  healthScore: number
  totalPipelines: number
  healthyPipelines: number
  degradedPipelines: number
  criticalPipelines: number
  totalExecutions: number
  totalFailures: number
  successRate: number
}

export interface PipelineHealthGrid {
  cabinetId: string
  period: { from: string; to: string }
  resolution: HeatmapResolution
  generatedAt: string
  summary: GridSummary
  pipelines: GridPipeline[]
}

// --- Grid request params ---

export interface GridParams {
  from?: string
  to?: string
  resolution?: HeatmapResolution
  pipelines?: string[]
}
