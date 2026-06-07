/**
 * Alerts Dashboard Types
 * API contract for /v1/alerts/* endpoints
 */

export enum AlertType {
  STOCKOUT_RISK = 'stockout.risk',
  MARGIN_COLLAPSE = 'margin.collapse',
  RETURN_RATE_SPIKE = 'return_rate.spike',
  REORDER_URGENT = 'reorder.urgent',
}

export type AlertSeverity = 'critical' | 'warning' | 'info'

/** Russian labels for each alert type */
export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  [AlertType.STOCKOUT_RISK]: 'Риск отсутствия',
  [AlertType.MARGIN_COLLAPSE]: 'Падение маржи',
  [AlertType.RETURN_RATE_SPIKE]: 'Рост возвратности',
  [AlertType.REORDER_URGENT]: 'Срочный доп. заказ',
}

/** One-sentence Russian descriptions for each alert type */
export const ALERT_TYPE_DESCRIPTIONS: Record<AlertType, string> = {
  [AlertType.STOCKOUT_RISK]: 'Уведомление, когда остатки товара подходят к концу',
  [AlertType.MARGIN_COLLAPSE]: 'Уведомление при резком падении маржинальности',
  [AlertType.RETURN_RATE_SPIKE]: 'Уведомление при аномальном росте процента возвратов',
  [AlertType.REORDER_URGENT]: 'Уведомление о необходимости срочного дополнительного заказа',
}

/** Default thresholds per alert type (mirrors backend DEFAULT_THRESHOLDS) */
export const ALERT_TYPE_THRESHOLDS: Record<AlertType, Record<string, number>> = {
  [AlertType.STOCKOUT_RISK]: { daysLeftWarning: 14, daysLeftCritical: 7 },
  [AlertType.MARGIN_COLLAPSE]: { deltaWarning: -5, deltaCritical: -10, lookbackWeeks: 4 },
  [AlertType.RETURN_RATE_SPIKE]: { rateWarning: 10, rateCritical: 15, lookbackWeeks: 4 },
  [AlertType.REORDER_URGENT]: { daysUntilStockout: 7, minStock: 5 },
}

/** Threshold field label + unit for the form UI */
export interface ThresholdFieldConfig {
  key: string
  label: string
  unit: string
}

export const ALERT_THRESHOLD_FIELDS: Record<AlertType, ThresholdFieldConfig[]> = {
  [AlertType.STOCKOUT_RISK]: [
    { key: 'daysLeftWarning', label: 'Дней до окончания (предупреждение)', unit: 'дн' },
    { key: 'daysLeftCritical', label: 'Дней до окончания (критично)', unit: 'дн' },
  ],
  [AlertType.MARGIN_COLLAPSE]: [
    { key: 'deltaWarning', label: 'Падение (предупреждение)', unit: 'п.п.' },
    { key: 'deltaCritical', label: 'Падение (критично)', unit: 'п.п.' },
    { key: 'lookbackWeeks', label: 'Период анализа', unit: 'нед' },
  ],
  [AlertType.RETURN_RATE_SPIKE]: [
    { key: 'rateWarning', label: 'Процент возвратов (предупреждение)', unit: '%' },
    { key: 'rateCritical', label: 'Процент возвратов (критично)', unit: '%' },
    { key: 'lookbackWeeks', label: 'Период анализа', unit: 'нед' },
  ],
  [AlertType.REORDER_URGENT]: [
    { key: 'daysUntilStockout', label: 'Дней до отсутствия', unit: 'дн' },
    { key: 'minStock', label: 'Минимальный остаток', unit: 'шт' },
  ],
}

export interface AlertRule {
  id: string
  cabinetId: string
  alertType: string
  enabled: boolean
  thresholds: Record<string, unknown>
  cooldownMinutes: number
  severity: AlertSeverity
  channels: Record<string, unknown>
  label: string | null
  createdAt: string
  updatedAt: string
}

export interface AlertHistoryItem {
  id: string
  cabinetId: string
  channel: string
  eventType: string
  messageText: string
  status: string
  createdAt: string
  sentAt: string | null
}

export interface AlertSummary {
  period: string
  totalAlerts: number
  byType: Array<{
    alertType: string
    severity: string
    count: number
    lastTriggered: string | null
  }>
  bySeverity: Record<string, number>
}

export interface AlertHistoryParams {
  limit?: number
  alertType?: string
  status?: string
  from?: string
  to?: string
}

export interface CreateAlertRulePayload {
  alertType: string
  thresholds: Record<string, unknown>
  cooldownMinutes?: number
  severity?: AlertSeverity
  channels?: Record<string, unknown>
  label?: string
}

export interface UpdateAlertRulePayload {
  enabled?: boolean
  thresholds?: Record<string, unknown>
  cooldownMinutes?: number
  severity?: AlertSeverity
  channels?: Record<string, unknown>
  label?: string
}
