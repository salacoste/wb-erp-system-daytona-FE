/**
 * Monitoring TypeScript types — Epic 68-FE
 * Based on backend API: docs/request-backend/149-EPIC-67-PIPELINE-HEALTH-DASHBOARD-API.md
 * Epic 49 (8 endpoints) + Epic 67 (3 endpoints)
 *
 * Barrel re-export — split into domain files for Story 74.8 (file size compliance).
 * All existing imports from '../types/monitoring' continue to work unchanged.
 */

// Enums, dashboard, and data-completeness types
export type {
  PipelineStatus,
  OverallStatus,
  CellStatus,
  BotStatus,
  CompletenessStatus,
  PipelineCategory,
  RecoveryStatus,
  HeatmapResolution,
  DashboardSystem,
  DashboardPipeline,
  DashboardTelegram,
  DataCompletenessTable,
  DashboardDataCompleteness,
  TableCompletenessDetail,
  DataCompletenessDetail,
  MonitoringDashboard,
} from './monitoring-enums'

// Pipeline health grid types
export type {
  HeatmapCellError,
  HeatmapCell,
  GridPipeline,
  GridSummary,
  PipelineHealthGrid,
  GridParams,
} from './monitoring-grid'

// Telegram health types
export type {
  TelegramBot,
  TelegramBinding,
  TelegramDelivery,
  TelegramEventBreakdown,
  TelegramFailure,
  TelegramPreferences,
  TelegramHealth,
} from './monitoring-telegram'

// Recovery status and health report types
export type {
  RecoveryTask,
  RecoveryStatusResponse,
  HealthReportSummary,
  HealthReportIssue,
  HealthReportDetail,
  MonitoringTab,
} from './monitoring-reports'
