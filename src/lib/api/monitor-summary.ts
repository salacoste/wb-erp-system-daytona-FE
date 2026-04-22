/**
 * Monitor Summary API Client — Epic 92-FE Story 92.1
 * Backend endpoint: GET /v1/analytics/monitor/summary
 * Replaces the originally-planned 8-request architecture with a single call.
 * @see backlog/docs/doc-1, doc-2, backlog/tasks/task-16
 */

import { apiClient } from '../api-client'
import type { MonitorSummaryResponse } from '@/app/(dashboard)/monitor/types/monitor-summary'
import { normalizeMonitorSummaryResponse } from './monitor-summary-normalizer'
import { qs } from './query-string'

export const monitorSummaryQueryKeys = {
  all: ['monitor-summary'] as const,
  byCabinet: (cabinetId: string | null) => ['monitor-summary', cabinetId] as const,
}

export async function getMonitorSummary(cabinetId: string): Promise<MonitorSummaryResponse> {
  const raw = await apiClient.get<unknown>(`/v1/analytics/monitor/summary${qs({ cabinetId })}`)
  return normalizeMonitorSummaryResponse(raw)
}
