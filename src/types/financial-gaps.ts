/**
 * Financial Gaps Remediation Types
 * API contract for /v1/imports/gaps/* endpoints
 */

export enum RootCause {
  SCHEDULER_GAP = 'scheduler_gap',
  IMPORT_FAILURE = 'import_failure',
  WB_API_ISSUE = 'wb_api_issue',
  QUEUE_PROCESSING_FAILURE = 'queue_processing_failure',
  RATE_LIMITING = 'rate_limiting',
}

export enum RemediationAction {
  ADD_SCHEDULE = 'add_schedule',
  RE_IMPORT = 're_import',
  RETRY_WITH_BACKOFF = 'retry_with_backoff',
  RESTART_WORKER = 'restart_worker',
  ADJUST_RATE_LIMITS = 'adjust_rate_limits',
}

/** Russian labels for root causes */
export const ROOT_CAUSE_LABELS: Record<RootCause, string> = {
  [RootCause.SCHEDULER_GAP]: 'Пропуск расписания',
  [RootCause.IMPORT_FAILURE]: 'Ошибка импорта',
  [RootCause.WB_API_ISSUE]: 'Проблема API WB',
  [RootCause.QUEUE_PROCESSING_FAILURE]: 'Ошибка очереди',
  [RootCause.RATE_LIMITING]: 'Лимит запросов',
}

/** Russian labels for remediation actions */
export const REMEDIATION_LABELS: Record<RemediationAction, string> = {
  [RemediationAction.ADD_SCHEDULE]: 'Добавить расписание',
  [RemediationAction.RE_IMPORT]: 'Переимпортировать',
  [RemediationAction.RETRY_WITH_BACKOFF]: 'Повторить с задержкой',
  [RemediationAction.RESTART_WORKER]: 'Перезапустить воркер',
  [RemediationAction.ADJUST_RATE_LIMITS]: 'Скорректировать лимиты',
}

/** Severity color mapping for root causes */
export const ROOT_CAUSE_SEVERITY: Record<RootCause, 'warning' | 'critical' | 'info'> = {
  [RootCause.SCHEDULER_GAP]: 'warning',
  [RootCause.IMPORT_FAILURE]: 'critical',
  [RootCause.WB_API_ISSUE]: 'info',
  [RootCause.QUEUE_PROCESSING_FAILURE]: 'critical',
  [RootCause.RATE_LIMITING]: 'warning',
}

export interface MissingDate {
  missing_date: string
  day_of_week: number
  day_name: string
}

export interface FinancialGapsResponse {
  cabinet_id: string
  date_from: string
  date_to: string
  total_days: number
  existing_days: number
  missing_days: number
  coverage_percent: number
  missing_dates: MissingDate[]
}

export interface ImportInfo {
  id: string
  status: string
  error_message: string | null
  created_at: string
}

export interface TaskScheduleInfo {
  id: string | null
  task_type: string
  is_enabled: boolean
  planned_at: string | null
  cron: string | null
}

export interface GapEvidence {
  imports: ImportInfo[]
  task_schedule: TaskScheduleInfo | null
  queue_errors: string[]
  wb_api_status: string
}

export interface GapAnalysisResponse {
  missing_date: string
  root_cause: RootCause
  evidence: GapEvidence
  remediation: RemediationAction
}

export interface GapRemediationResponse {
  status: string
  cabinet_id: string
  missing_date: string
  root_cause: RootCause
  remediation: RemediationAction
  task_id: string
  estimated_completion: string | null
}

export interface GapsQueryParams {
  dateFrom: string
  dateTo: string
}

export interface RemediatePayload {
  missing_date: string
  root_cause?: string
  force?: boolean
}
