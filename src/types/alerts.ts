/**
 * Alerts Dashboard Types
 * API contract for /v1/alerts/* endpoints
 */

export type AlertSeverity = 'critical' | 'warning' | 'info'

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
