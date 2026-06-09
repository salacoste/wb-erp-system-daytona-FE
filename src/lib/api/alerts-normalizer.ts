/**
 * Alerts Boundary Normalizer
 * Coerces raw backend responses into frontend-canonical shapes.
 * Uses shared helpers from normalizer-helpers.ts.
 */

import { toCount, toStr, toStringOrNull, asRecord } from './normalizer-helpers'
import type { AlertRule, AlertHistoryItem, AlertSummary, AlertSeverity } from '@/types/alerts'

/** Coerce unknown severity to AlertSeverity with safe fallback to 'info' */
function toAlertSeverity(raw: unknown): AlertSeverity {
  if (raw === 'critical' || raw === 'warning' || raw === 'info') return raw
  return 'info'
}

function normalizeAlertRule(raw: unknown): AlertRule {
  const r = asRecord(raw)
  return {
    id: toStr(r.id),
    cabinetId: toStr(r.cabinetId),
    alertType: toStr(r.alertType),
    enabled: !!r.enabled,
    thresholds: (r.thresholds as Record<string, unknown>) ?? {},
    cooldownMinutes: toCount(r.cooldownMinutes),
    severity: toAlertSeverity(r.severity),
    channels: (r.channels as Record<string, unknown>) ?? {},
    label: toStringOrNull(r.label),
    createdAt: toStr(r.createdAt),
    updatedAt: toStr(r.updatedAt),
  }
}

function normalizeAlertHistoryItem(raw: unknown): AlertHistoryItem {
  const r = asRecord(raw)
  return {
    id: toStr(r.id),
    cabinetId: toStr(r.cabinetId),
    channel: toStr(r.channel),
    eventType: toStr(r.eventType),
    messageText: toStr(r.messageText),
    status: toStr(r.status),
    createdAt: toStr(r.createdAt),
    sentAt: toStringOrNull(r.sentAt),
  }
}

/** Normalize GET /v1/alerts/rules response — backend returns { items, total, nextCursor } */
export function normalizeAlertRulesResponse(raw: unknown): AlertRule[] {
  const r = asRecord(raw)
  const items = Array.isArray(r.items) ? r.items : Array.isArray(raw) ? raw : []
  return items.map(normalizeAlertRule)
}

/** Normalize GET /v1/alerts/history response — backend returns { items, total, nextCursor } */
export function normalizeAlertHistoryResponse(raw: unknown): AlertHistoryItem[] {
  const r = asRecord(raw)
  const items = Array.isArray(r.items) ? r.items : Array.isArray(raw) ? raw : []
  return items.map(normalizeAlertHistoryItem)
}

/** Normalize GET /v1/alerts/summary response */
export function normalizeAlertSummaryResponse(raw: unknown): AlertSummary {
  const r = asRecord(raw)
  const bySeverityRaw = r.bySeverity as Record<string, unknown> | undefined
  const bySeverity: Record<string, number> = {}
  if (bySeverityRaw && typeof bySeverityRaw === 'object') {
    for (const [key, val] of Object.entries(bySeverityRaw)) {
      bySeverity[key] = toCount(val)
    }
  }
  return {
    period: toStr(r.period),
    totalAlerts: toCount(r.totalAlerts),
    byType: Array.isArray(r.byType) ? r.byType.map(normalizeByTypeItem) : [],
    bySeverity,
  }
}

function normalizeByTypeItem(raw: unknown): AlertSummary['byType'][number] {
  const r = asRecord(raw)
  return {
    alertType: toStr(r.alertType),
    severity: toStr(r.severity),
    count: toCount(r.count),
    lastTriggered: toStringOrNull(r.lastTriggered),
  }
}
