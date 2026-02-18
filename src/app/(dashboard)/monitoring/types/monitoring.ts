/**
 * Monitoring TypeScript types — Epic 68-FE
 * Based on backend API: docs/request-backend/149-EPIC-67-PIPELINE-HEALTH-DASHBOARD-API.md
 * Epic 49 (8 endpoints) + Epic 67 (3 endpoints)
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

// --- Telegram Health (GET /v1/monitoring/telegram-health) ---

export interface TelegramBot {
  status: BotStatus
  lastActivityAt: string | null
}

export interface TelegramBinding {
  isBound: boolean
  boundAt: string | null
  telegramUsername: string | null
  isVerified: boolean
}

export interface TelegramDelivery {
  totalSent: number
  totalFailed: number
  totalRateLimited: number
  totalSkippedQuietHours: number
  deliveryRate: number
  avgDeliveryMs: number | null
}

export interface TelegramEventBreakdown {
  eventType: string
  enabled: boolean
  sentCount: number
  failedCount: number
}

export interface TelegramFailure {
  timestamp: string
  eventType: string
  errorMessage: string
}

export interface TelegramPreferences {
  telegramEnabled: boolean
  quietHoursEnabled: boolean
  quietHoursFrom: string | null
  quietHoursTo: string | null
  language: string
  enabledEvents: string[]
  disabledEvents: string[]
}

export interface TelegramHealth {
  cabinetId: string
  generatedAt: string
  period: { from: string; to: string }
  bot: TelegramBot
  binding: TelegramBinding
  delivery: TelegramDelivery
  eventBreakdown: TelegramEventBreakdown[]
  recentFailures: TelegramFailure[]
  preferences: TelegramPreferences
}

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

// --- Grid request params ---

export interface GridParams {
  from?: string
  to?: string
  resolution?: HeatmapResolution
  pipelines?: string[]
}

// --- Tab type ---

export type MonitoringTab = 'overview' | 'heatmap' | 'recovery' | 'history'
