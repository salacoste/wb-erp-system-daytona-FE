/**
 * Health History Chart — constants and pure helpers.
 * Epic 68-FE (Story 68.7), extracted from HealthHistoryChart.
 */

import type { HealthReportSummary, OverallStatus } from '../types/monitoring'

export type PeriodDays = 7 | 14 | 30

export const PERIOD_OPTIONS: { days: PeriodDays; label: string }[] = [
  { days: 7, label: '7 дней' },
  { days: 14, label: '14 дней' },
  { days: 30, label: '30 дней' },
]

export const STATUS_COLORS: Record<OverallStatus, string> = {
  healthy: 'bg-status-success',
  degraded: 'bg-status-warning',
  critical: 'bg-status-error',
}

export const STATUS_RING: Record<OverallStatus, string> = {
  healthy: 'ring-status-success/50',
  degraded: 'ring-status-warning/50',
  critical: 'ring-status-error/50',
}

export const STATUS_EMOJI: Record<OverallStatus, string> = {
  healthy: '✅',
  degraded: '⚠️',
  critical: '❌',
}

export function formatDayLabel(dateStr: string): { day: string; date: string } {
  // BD-30: a bare "YYYY-MM-DD" is parsed as UTC midnight by new Date(), which shifts the
  // weekday back a day in Europe/Moscow (UTC+3). Append "T00:00:00" so date-only strings
  // parse as LOCAL midnight; strings that already carry a time component are left as-is.
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
  const d = new Date(isDateOnly ? `${dateStr}T00:00:00` : dateStr)
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  return {
    day: days[d.getDay()],
    date: d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
  }
}

/** Count reports by status for trend summary */
export function countByStatus(reports: HealthReportSummary[]) {
  let healthy = 0
  let degraded = 0
  let critical = 0
  for (const r of reports) {
    if (r.status === 'healthy') healthy++
    else if (r.status === 'degraded') degraded++
    else critical++
  }
  return { healthy, degraded, critical }
}
