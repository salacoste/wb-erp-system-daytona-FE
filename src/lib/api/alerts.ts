/**
 * Alerts API Client
 * GET/POST/PATCH/DELETE /v1/alerts/* endpoints
 */

import { apiClient } from '../api-client'
import {
  normalizeAlertRulesResponse,
  normalizeAlertHistoryResponse,
  normalizeAlertSummaryResponse,
} from './alerts-normalizer'
import type {
  AlertRule,
  AlertHistoryItem,
  AlertSummary,
  AlertHistoryParams,
  CreateAlertRulePayload,
  UpdateAlertRulePayload,
} from '@/types/alerts'

/** GET /v1/alerts/rules */
export async function getAlertRules(): Promise<AlertRule[]> {
  const raw = await apiClient.get<unknown>('/v1/alerts/rules', { skipDataUnwrap: true })
  return normalizeAlertRulesResponse(raw)
}

/** GET /v1/alerts/history?limit=...&alertType=...&status=...&from=...&to=... */
export async function getAlertHistory(
  params: AlertHistoryParams = {}
): Promise<AlertHistoryItem[]> {
  const query = new URLSearchParams()
  if (params.limit) query.set('limit', String(params.limit))
  if (params.alertType) query.set('alertType', params.alertType)
  if (params.status) query.set('status', params.status)
  if (params.from) query.set('from', params.from)
  if (params.to) query.set('to', params.to)
  const qs = query.toString()
  const raw = await apiClient.get<unknown>(`/v1/alerts/history${qs ? `?${qs}` : ''}`, {
    skipDataUnwrap: true,
  })
  return normalizeAlertHistoryResponse(raw)
}

/** GET /v1/alerts/summary?days=7 */
export async function getAlertSummary(days = 7): Promise<AlertSummary> {
  const raw = await apiClient.get<unknown>(`/v1/alerts/summary?days=${days}`, {
    skipDataUnwrap: true,
  })
  return normalizeAlertSummaryResponse(raw)
}

/** POST /v1/alerts/rules */
export async function createAlertRule(payload: CreateAlertRulePayload): Promise<AlertRule> {
  return apiClient.post<AlertRule>('/v1/alerts/rules', payload)
}

/** PATCH /v1/alerts/rules/:id */
export async function updateAlertRule(
  id: string,
  payload: UpdateAlertRulePayload
): Promise<AlertRule> {
  return apiClient.patch<AlertRule>(`/v1/alerts/rules/${id}`, payload)
}

/** DELETE /v1/alerts/rules/:id */
export async function deleteAlertRule(id: string): Promise<void> {
  return apiClient.delete<void>(`/v1/alerts/rules/${id}`)
}
