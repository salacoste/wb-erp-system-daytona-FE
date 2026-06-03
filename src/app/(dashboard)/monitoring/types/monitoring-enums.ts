/**
 * Monitoring enums and dashboard types — Epic 68-FE
 * Extracted from monitoring.ts for Story 74.8 (file size compliance)
 *
 * Contains: status enums, dashboard endpoint types, data completeness types.
 */

// --- Pipeline & Status Enums ---

export type PipelineStatus = 'healthy' | 'warning' | 'critical' | 'stale' | 'no_data'
export type OverallStatus = 'healthy' | 'degraded' | 'critical'
export type CellStatus =
  | 'success'
  | 'partial'
  | 'failed'
  | 'missed'
  | 'no_data'
  | 'pending'
  | 'recovered'
export type BotStatus = 'active' | 'degraded' | 'offline' | 'not_configured'
export type CompletenessStatus = 'complete' | 'incomplete' | 'critical'
export type PipelineCategory = 'high_frequency' | 'daily' | 'weekly'
export type RecoveryStatus = 'healthy' | 'overdue' | 'overdue_critical' | 'no_history'
export type HeatmapResolution = 'hour' | 'day'

// --- Dashboard Endpoint (GET /v1/monitoring/dashboard) ---

export interface DashboardSystem {
  overallStatus: OverallStatus
  healthScore: number
  lastReportDate: string | null
  activeAlerts: number
}

export interface DashboardPipeline {
  pipelineId: string
  displayName: string
  category: PipelineCategory
  status: PipelineStatus
  lastSuccessAt: string | null
  dataLagMinutes: number | null
  successRate24h: number
  // Story 91.3-FE: error-rate fields (Backend Epics 89-93). iter-89: the live
  // GET /v1/monitoring/dashboard endpoint does NOT actually emit these three — they exist only on
  // GET /v1/monitoring/pipeline-health-grid (GridPipeline). Declared OPTIONAL so the type is
  // honest; PipelineStatusGrid guards their absence (the Overview error badge stays hidden until
  // the backend adds them — see docs/request-backend/201). The old required typing made
  // `errorRate >= 0.01` run as `undefined >= 0.01` (always false) — a silent footgun.
  errorRate?: number // 0-1
  tasksWithErrors?: number
  totalResultErrors?: number
}

export interface DashboardTelegram {
  status: BotStatus
  deliveryRate7d: number
  recentFailures: number
}

export interface DataCompletenessTable {
  table: string
  displayName: string
  completenessRatio: number
  status: CompletenessStatus
}

export interface DashboardDataCompleteness {
  overallHealth: OverallStatus
  tables: DataCompletenessTable[]
}

/** Detail from GET /v1/monitoring/data-completeness — per-table breakdown */
export interface TableCompletenessDetail {
  table: string
  expectedDates: number
  actualDates: number
  completenessRatio: number
  status: CompletenessStatus
  missingDates: string[]
  recoverable: boolean
}

/** Full response from GET /v1/monitoring/data-completeness */
export interface DataCompletenessDetail {
  cabinetId: string
  period: { from: string; to: string }
  completeness: TableCompletenessDetail[]
  overallHealth: OverallStatus
  issuesCount: number
}

export interface MonitoringDashboard {
  cabinetId: string
  generatedAt: string
  system: DashboardSystem
  pipelines: DashboardPipeline[]
  telegram: DashboardTelegram
  dataCompleteness: DashboardDataCompleteness
}
